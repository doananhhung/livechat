
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Conversation } from '../../../database/entities';
import { ConversationStatus } from '@live-chat/shared-types';

@Injectable()
export class ConversationPersistenceService {
  /**
   * Finds an existing conversation for a visitor or creates a new one.
   * This is intended to be called within a transaction.
   * @param projectId - The ID of the project.
   * @param visitorId - The ID of the visitor.
   * @param manager - The EntityManager from the transaction.
   * @returns The found or newly created Conversation.
   */
  async findOrCreateByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager
  ): Promise<Conversation> {
    const conversationRepo = manager.getRepository(Conversation);

    let conversation = await conversationRepo.findOne({
      where: {
        project: { id: projectId },
        visitor: { id: visitorId },
      },
    });

    if (!conversation) {
      conversation = conversationRepo.create({
        project: { id: projectId },
        visitor: { id: visitorId },
        status: ConversationStatus.OPEN,
      });
      await conversationRepo.save(conversation);
    }

    return conversation;
  }

  /**
   * Updates the conversation's metadata after a new message is received.
   * Intended to be called within a transaction.
   * @param conversationId - The ID of the conversation to update.
   * @param lastMessageSnippet - A snippet of the last message.
   * @param lastMessageTimestamp - The timestamp of the last message.
   * @param manager - The EntityManager from the transaction.
   */
  async updateLastMessage(
    conversationId: string,
    lastMessageSnippet: string,
    lastMessageTimestamp: Date,
    lastMessageId: string,
    manager: EntityManager
  ): Promise<void> {
    const conversationRepo = manager.getRepository(Conversation);

    // Fetch the conversation to check its current status
    const conversation = await conversationRepo.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      // Conversation not found, perhaps it was deleted or never existed.
      // It might be appropriate to log this or throw an error depending on expected behavior.
      return;
    }

    // Only update status to OPEN if it's not currently SPAM
    const newStatus = conversation.status === ConversationStatus.SPAM
      ? ConversationStatus.SPAM // Keep as SPAM
      : ConversationStatus.OPEN; // Re-open

    // Increment unread count by 1 for new incoming messages
    await conversationRepo.increment({ id: conversationId }, 'unreadCount', 1);

    await conversationRepo.update(
      { id: conversationId },
      {
        lastMessageSnippet: lastMessageSnippet.substring(0, 100),
        lastMessageTimestamp,
        lastMessageId,
        status: newStatus,
      }
    );
  }
}
