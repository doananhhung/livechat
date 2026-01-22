import { Module } from '@nestjs/common';
import { AiResponderService } from './ai-responder.service';
import { GatewayModule } from '../gateway/gateway.module';
import { ProjectModule } from '../projects/project.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation, Message, Project } from '../database/entities';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';

@Module({
  imports: [
    GatewayModule,
    ProjectModule,
    RealtimeSessionModule,
    TypeOrmModule.forFeature([Conversation, Message, Project]),
  ],
  providers: [AiResponderService],
  exports: [AiResponderService],
})
export class AiResponderModule {}