import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '../gateway/events.gateway';
import { ProjectService } from '../projects/project.service';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import {
  VisitorMessageReceivedEvent,
  AgentMessageSentEvent,
  ConversationUpdatedEvent,
} from '../inbox/events';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, Message, Project } from '../database/entities';
import { MessageStatus } from '@live-chat/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RealtimeSessionService } from '../realtime-session/realtime-session.service';

@Injectable()
export class AiResponderService {
  private readonly logger = new Logger(AiResponderService.name);
  private openai: OpenAI;

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly projectService: ProjectService,
    private readonly configService: ConfigService,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
    private readonly realtimeSessionService: RealtimeSessionService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    } else {
      this.logger.warn('GROQ_API_KEY is not set. AI Responder will not work.');
    }
  }

  /**
   * Determines if the AI responder should be active for a given project.
   * AI is active if:
   * 1. It is enabled in the project settings.
   * 2. There are no human agents online.
   * @param projectId The ID of the project.
   */
  async isAiActive(projectId: number): Promise<boolean> {
    const project = await this.projectService.findByProjectId(projectId);

    if (!project || !project.aiResponderEnabled) {
      return false;
    }

    const agentCount = await this.eventsGateway.getOnlineAgentCount(projectId);
    this.logger.debug(`Project ${projectId} agent count: ${agentCount}`);

    return agentCount === 0;
  }

  /**
   * Generates a response using Groq.
   * @param messages List of conversation messages.
   * @param systemPrompt The system instruction for the AI.
   */
  private async generateResponse(
    messages: any[],
    systemPrompt: string,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        model: 'llama3-70b-8192', // Or configurable model
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Failed to generate response from Groq', error);
      throw error;
    }
  }

  @OnEvent('visitor.message.received')
  async handleVisitorMessage(payload: VisitorMessageReceivedEvent) {
    this.logger.log(
      `Checking AI response for visitor ${payload.visitorUid} in project ${payload.projectId}`
    );

    try {
      // 0. Check Visitor Preference (Opt-out)
      // If aiEnabled is strictly false, skip. Undefined implies true/default.
      if (payload.sessionMetadata?.aiEnabled === false) {
        this.logger.debug(
          `AI skipped for visitor ${payload.visitorUid} (opted out).`
        );
        return;
      }

      // 1. Check if AI should be active
      const isActive = await this.isAiActive(payload.projectId);
      if (!isActive) {
        this.logger.debug(
          `AI not active for project ${payload.projectId}. Skipping.`
        );
        return;
      }

      // 2. Fetch project for prompt
      const project = await this.projectRepository.findOneBy({
        id: payload.projectId,
      });
      if (!project) return;

      const systemPrompt =
        project.aiResponderPrompt || 'You are a helpful assistant.';

      // 3. Wait a bit to simulate processing/prevent race conditions with the message being saved
      // Ideally we would listen to 'message.created' but 'visitor.message.received' is upstream.
      // We need to fetch the conversation context.
      
      // Let's look up the conversation by visitorUid
      const conversation = await this.conversationRepository.findOne({
        where: {
          visitor: { visitorUid: payload.visitorUid },
          project: { id: payload.projectId },
        },
        relations: ['visitor'],
      });

      if (!conversation) {
        this.logger.warn(
          `No conversation found for visitor ${payload.visitorUid} when trying to reply with AI.`
        );
        return;
      }

      // 4. Fetch recent history
      const history = await this.messageRepository.find({
        where: { conversationId: Number(conversation.id) },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      // 5. Format messages for OpenAI
      const messages = history.reverse().map((msg) => ({
        role: msg.fromCustomer ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Append the new message if it wasn't in DB yet (it might not be if event is async parallel)
      // But typically 'visitor.message.received' triggers creation.
      // If we see the last message in history is NOT the new one, append it.
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg || lastMsg.content !== payload.content) {
        messages.push({ role: 'user', content: payload.content });
      }

      // 6. Generate Response
      this.logger.log(`Generating AI response for project ${payload.projectId}`);
      // Show typing indicator? (Nice to have)
      
      const aiResponseText = await this.generateResponse(
        messages,
        systemPrompt
      );

      // 7. Save AI Message
      const aiMessage = this.messageRepository.create({
        conversationId: Number(conversation.id),
        content: aiResponseText,
        senderId: 'AI_BOT', // Special ID
        recipientId: conversation.visitor.visitorUid,
        fromCustomer: false,
        status: MessageStatus.SENT,
        createdAt: new Date(), // Explicitly set if needed
      });

      const savedMessage = await this.messageRepository.save(aiMessage);

      // 8. Update Conversation Last Message
      conversation.lastMessageSnippet = aiResponseText;
      conversation.lastMessageTimestamp = savedMessage.createdAt;
      // Do NOT increment unread count for AI messages (or do? depends if we want agents to see it as unread)
      // Usually AI handling means agent doesn't need to see it immediately.
      // Let's keep it 0 or unchanged.
      await this.conversationRepository.save(conversation);

      // 9. Resolve socket ID and Emit Event
      const visitorSocketId =
        await this.realtimeSessionService.getVisitorSession(
          conversation.visitor.visitorUid
        );

      const eventPayload = {
        visitorSocketId,
        message: savedMessage,
        projectId: payload.projectId,
      };

      this.eventEmitter.emit('agent.message.sent', eventPayload);
      
      this.logger.log(`AI Response sent: ${savedMessage.id}`);

    } catch (error) {
      this.logger.error('Error in handleVisitorMessage:', error);
    }
  }
}
