import { Module } from '@nestjs/common';
import { AiResponderService } from './ai-responder.service';
import { GatewayModule } from '../gateway/gateway.module';
import { ProjectModule } from '../projects/project.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation, Message, Project } from '../database/entities';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';
import { GroqProvider } from './providers/groq.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { LLMProviderManager } from './services/llm-provider.manager';
import { VisitorNotesModule } from '../visitor-notes/visitor-notes.module';
import { AiToolExecutor } from './services/ai-tool.executor';
import { WorkflowEngineService } from './services/workflow-engine.service';
import { VisitorLockService } from './services/visitor-lock.service';
import { InboxModule } from '../inbox/inbox.module';
import { ActionsModule } from '../actions/actions.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    GatewayModule,
    ProjectModule,
    RealtimeSessionModule,
    VisitorNotesModule,
    InboxModule, // For ConversationService
    ActionsModule, // For ActionsService
    RedisModule, // For VisitorLockService
    TypeOrmModule.forFeature([Conversation, Message, Project]),
  ],
  providers: [
    AiResponderService,
    GroqProvider,
    OpenAIProvider,
    LLMProviderManager,
    AiToolExecutor,
    WorkflowEngineService,
    VisitorLockService,
  ],
  exports: [AiResponderService],
})
export class AiResponderModule {}
