
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation, Message, Visitor } from '../database/entities';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { InboxController } from './inbox.controller';
import { AssignmentsController } from './assignments.controller';
import { EncryptionService } from '../common/services/encryption.service';
import { GatewayModule } from '../gateway/gateway.module';
import { VisitorService } from './services/visitor.service';
import { RealtimeSessionModule } from '../realtime-session/realtime-session.module';
import { ProjectModule } from '../projects/project.module';
import { InboxEventHandlerService } from './inbox-event.handler';
import { EventProducerModule } from '../event-producer/event-producer.module';
import { InboxPersistenceModule } from './inbox.persistence.module';
import { WorkflowModule } from '../modules/workflow/workflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Visitor]),
    GatewayModule,
    RealtimeSessionModule,
    ProjectModule,
    EventProducerModule,
    InboxPersistenceModule,
    WorkflowModule,
  ],
  providers: [
    ConversationService,
    MessageService,
    EncryptionService,
    VisitorService,
    InboxEventHandlerService,
  ],
  controllers: [InboxController, AssignmentsController],
  exports: [ConversationService, MessageService, VisitorService, InboxPersistenceModule], // Export InboxPersistenceModule
})
export class InboxModule {}
