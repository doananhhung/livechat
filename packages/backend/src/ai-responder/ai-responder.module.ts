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

@Module({
  imports: [
    GatewayModule,
    ProjectModule,
    RealtimeSessionModule,
    VisitorNotesModule,
    TypeOrmModule.forFeature([Conversation, Message, Project]),
  ],
  providers: [
    AiResponderService,
    GroqProvider,
    OpenAIProvider,
    LLMProviderManager,
  ],
  exports: [AiResponderService],
})
export class AiResponderModule {}
