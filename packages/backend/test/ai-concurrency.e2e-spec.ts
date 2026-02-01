import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AiResponderService } from '../src/ai-responder/ai-responder.service';
import { LLMProviderManager } from '../src/ai-responder/services/llm-provider.manager';
import {
  Conversation,
  Project,
  Message,
  Visitor,
  User,
} from '../src/database/entities';
import { DataSource, Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { TestHarness } from './utils/test-harness';
import {
  ChatMessage,
  ToolDefinition,
  LLMResponse,
} from '../src/ai-responder/interfaces/llm-provider.interface';
import { AiResponderModule } from '../src/ai-responder/ai-responder.module';
import { AiProcessMessageEvent } from '../src/inbox/events';
import { ConversationStatus } from '@live-chat/shared-types';

// Barrier Implementation for Coordination
class TestBarrier {
  private promise: Promise<void>;
  private resolveFn: (() => void) | null = null;
  private active = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.promise = new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  activate() {
    this.active = true;
  }

  async wait() {
    if (this.active) {
      await this.promise;
    }
  }

  release() {
    if (this.resolveFn) {
      this.resolveFn();
      this.resolveFn = null;
    }
    this.active = false;
  }
}

class MockLLMProvider {
  public barrier = new TestBarrier();

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    tools?: ToolDefinition[]
  ): Promise<LLMResponse> {
    await this.barrier.wait();
    return {
      content: 'AI Response Content',
      toolCalls: [],
    };
  }
}

describe('AiResponder Concurrency (E2E)', () => {
  let app: INestApplication;
  let harness: TestHarness;
  let aiResponderService: AiResponderService;
  let mockLLM: MockLLMProvider;
  let conversationRepo: Repository<Conversation>;
  let projectRepo: Repository<Project>;
  let visitorRepo: Repository<Visitor>;
  let messageRepo: Repository<Message>;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    harness = new TestHarness();
    mockLLM = new MockLLMProvider();

    // Use TestHarness logic but override LLMProviderManager for AiResponderModule
    // We cannot easily use harness.bootstrap() because it loads AppModule which loads AiResponderModule
    // and we want to override a provider inside it BEFORE compilation.
    // So we reconstruct the module graph partially or import AppModule and override.

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import AppModule to get full DB connection and all services
        // Dependencies will be resolved from it
        (await import('../src/app.module')).AppModule,
      ],
    })
      .overrideProvider(LLMProviderManager)
      .useValue(mockLLM)
      // We must also override helpers that TestHarness normally overrides
      // to avoid external dependencies issues during test
      .overrideProvider((await import('../src/mail/mail.service')).MailService)
      .useValue(new (await import('./utils/test-harness')).MailServiceMock())
      .overrideProvider(
        (await import('../src/screenshot/screenshot.service')).ScreenshotService
      )
      .useValue(
        new (await import('./utils/test-harness')).ScreenshotServiceMock()
      )
      .overrideProvider('CACHE_MANAGER')
      .useClass((await import('./utils/test-harness')).MemoryCacheMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get Repositories
    const dataSource = app.get(DataSource);
    conversationRepo = dataSource.getRepository(Conversation);
    projectRepo = dataSource.getRepository(Project);
    visitorRepo = dataSource.getRepository(Visitor);
    messageRepo = dataSource.getRepository(Message);
    userRepo = dataSource.getRepository(User);

    // Get Service
    aiResponderService = app.get(AiResponderService);

    // Clean DB
    await harness.dataSource?.query(
      'TRUNCATE "projects", "visitors", "conversations", "users" RESTART IDENTITY CASCADE;'
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should preserve concurrent updates occurred during AI generation', async () => {
    // 1. Setup Data
    const project = await projectRepo.save(
      projectRepo.create({
        name: 'Concurrency Test Project',
        aiConfig: { enabled: true, prompt: 'You are a bot.' },
        aiMode: 'simple',
      })
    );

    const agent = await userRepo.save(
      userRepo.create({
        email: `agent-${Date.now()}@test.com`,
        fullName: 'Test Agent',
        passwordHash: 'hash',
        isEmailVerified: true,
      })
    );

    const visitor = await visitorRepo.save(
      visitorRepo.create({
        project,
        visitorUid:
          '22222222-2222-2222-2222-' + Date.now().toString().slice(-12), // Dynamic UUID
        metadata: { source: 'web' },
      })
    );

    const conversation = await conversationRepo.save(
      conversationRepo.create({
        project,
        visitor,
        status: ConversationStatus.OPEN,
        metadata: {
          referrer: 'http://test.com',
          landingPage: '/',
          urlHistory: [],
          existingKey: 'oldValue',
        } as any,
      }) as Conversation
    );

    // 2. Prepare Barrier
    mockLLM.barrier.reset();
    mockLLM.barrier.activate();

    // 3. Trigger AI
    // 3. Trigger AI
    const event: AiProcessMessageEvent = {
      projectId: project.id,
      visitorUid: visitor.visitorUid,
      conversationId: conversation.id,
    };

    // Start processing in background (it will await barrier)
    const processingPromise = aiResponderService.handleVisitorMessage(event);

    // Wait a bit to ensure we are inside generateResponse (waiting at barrier)
    await new Promise((r) => setTimeout(r, 200));

    // 4. Concurrent Write
    // We update the conversation while AI is "thinking"
    const newAssingeeId = agent.id;
    await conversationRepo.update(
      { id: conversation.id },
      {
        assigneeId: newAssingeeId,
        metadata: {
          ...conversation.metadata,
          concurrentKey: 'concurrentValue',
        } as any,
      }
    );

    console.log('Concurrent update executed.');

    // 5. Release Barrier (AI resumes and saves)
    mockLLM.barrier.release();
    await processingPromise;

    console.log('AI processing finished.');

    // 6. Assert
    const finalConversation = await conversationRepo.findOne({
      where: { id: conversation.id },
    });

    expect(finalConversation).toBeDefined();

    // Verification 1: AI successfully responded
    expect(finalConversation!.lastMessageSnippet).toContain(
      'AI Response Content'
    );

    // Verification 2: Concurrent Update was PRESERVED
    // If usage of .save(entity) was still in place, this would likely be reverted to null/old metadata
    expect(finalConversation!.assigneeId).toBe(newAssingeeId);
    expect(finalConversation!.metadata).toEqual(
      expect.objectContaining({
        concurrentKey: 'concurrentValue',
      })
    );
  });
});
