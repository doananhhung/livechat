
import { Injectable } from '@nestjs/common';
import { EntityManager, In, Not } from 'typeorm';
import { Conversation } from '../../../database/entities';
import { ConversationStatus, HistoryVisibilityMode, VisitorSessionMetadata } from '@live-chat/shared-types';

@Injectable()
export class ConversationPersistenceService {
  /**
   * Finds an existing conversation for a visitor based on the mode.
   * Does NOT create a new one.
   * 
   * @param projectId - The ID of the project.
   * @param visitorId - The ID of the visitor.
   * @param manager - The EntityManager from the transaction.
   * @param mode - The history visibility mode.
   * @returns The found Conversation or null.
   */
  async findByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager,
    mode: HistoryVisibilityMode = 'limit_to_active'
  ): Promise<Conversation | null> {
    const conversationRepo = manager.getRepository(Conversation);

    if (mode === 'forever') {
      // Find the most recent conversation that is NOT Spam
      return conversationRepo.findOne({
        where: {
          project: { id: projectId },
          visitor: { id: visitorId },
          status: Not(ConversationStatus.SPAM),
        },
        relations: ['messages'],
        order: { 
          createdAt: 'DESC',
          messages: { createdAt: 'ASC' }
        }, 
      });
    } else {
      // limit_to_active (Default)
      // Only find active conversations (OPEN or PENDING)
      return conversationRepo.findOne({
        where: {
          project: { id: projectId },
          visitor: { id: visitorId },
          status: In([ConversationStatus.OPEN, ConversationStatus.PENDING]),
        },
        relations: ['messages'],
        order: { 
          createdAt: 'DESC',
          messages: { createdAt: 'ASC' }
        },
      });
    }
  }

  /**
   * Finds an existing conversation or creates a new one.
   * Used when processing a new message.
   * 
   * @param projectId - The ID of the project.
   * @param visitorId - The ID of the visitor.
   * @param manager - The EntityManager from the transaction.
   * @param mode - The history visibility mode.
   * @param metadata - Optional visitor session metadata to be saved with the conversation.
   * @returns The found or newly created Conversation.
   */
  async findOrCreateByVisitorId(
    projectId: number,
    visitorId: number,
    manager: EntityManager,
    mode: HistoryVisibilityMode = 'limit_to_active',
    metadata?: VisitorSessionMetadata // New parameter
  ): Promise<Conversation> {
    const conversationRepo = manager.getRepository(Conversation);

    // Reuse the find logic, but without loading messages (optimization for write path)
    let conversation: Conversation | null = null;

    if (mode === 'forever') {
      conversation = await conversationRepo.findOne({
        where: {
          project: { id: projectId },
          visitor: { id: visitorId },
          status: Not(ConversationStatus.SPAM),
        },
        order: { createdAt: 'DESC' },
      });
    } else {
      conversation = await conversationRepo.findOne({
        where: {
          project: { id: projectId },
          visitor: { id: visitorId },
          status: In([ConversationStatus.OPEN, ConversationStatus.PENDING]),
        },
        order: { createdAt: 'DESC' },
      });
    }

    if (!conversation) {
      conversation = conversationRepo.create({
        project: { id: projectId },
        visitor: { id: visitorId },
        status: ConversationStatus.OPEN,
        metadata: metadata || null, // Assign metadata if provided
      });
      await conversationRepo.save(conversation);
    } else if (metadata) { // If conversation exists and new metadata is provided
      // Always update metadata if provided, regardless of whether it existed before.
      // The design states "First Message" sets it, so this will ensure it's always applied
      // if metadata is present in the sendMessage payload.
      conversation.metadata = metadata;
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

