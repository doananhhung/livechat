
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Message } from '../../../database/entities';
import { CreateMessageDto } from '@live-chat/shared-dtos';

@Injectable()
export class MessagePersistenceService {
  private readonly logger = new Logger(MessagePersistenceService.name);

  /**
   * Create a new message.
   * This method is designed to run inside a transaction.
   */
  async createMessage(
    tempId: string,
    visitorUid: string,
    data: CreateMessageDto,
    manager: EntityManager
  ): Promise<Message> {
    const message = manager.create(Message, data);
    const savedMessage = await manager.save(message);

    this.logger.log(
      `Message ${savedMessage.id} created for visitor ${visitorUid}.`
    );

    return savedMessage;
  }
}
