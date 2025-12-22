
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation, Message, Visitor } from '../database/entities';
import { VisitorPersistenceService } from './services/persistence/visitor.persistence.service';
import { ConversationPersistenceService } from './services/persistence/conversation.persistence.service';
import { MessagePersistenceService } from './services/persistence/message.persistence.service';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Visitor])],
  providers: [
    VisitorPersistenceService,
    ConversationPersistenceService,
    MessagePersistenceService,
  ],
  exports: [
    VisitorPersistenceService,
    ConversationPersistenceService,
    MessagePersistenceService,
  ],
})
export class InboxPersistenceModule {}
