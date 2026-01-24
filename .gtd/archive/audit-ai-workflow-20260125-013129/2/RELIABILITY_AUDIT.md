# Reliability Audit: Race Conditions & State Integrity

**Date:** 2026-01-25
**Scope:** `AiResponderService` vs `WorkflowConsumer`

## 1. The "Safe" Pattern: Optimistic Locking
**File:** `packages/backend/src/modules/workflow/workflow.consumer.ts`

The background job consumer implements a robust optimistic locking strategy. It only updates the conversation status if the state hasn't changed since the job was scheduled.

```typescript
// ✅ SAFE: Optimistic Locking
const result = await this.conversationRepo
  .createQueryBuilder()
  .update(Conversation)
  .set({ status: ConversationStatus.PENDING })
  .where('id = :id', { id: conversationId })
  .andWhere('status = :status', { status: ConversationStatus.OPEN })
  .andWhere('last_message_id = :triggerId', { triggerId: triggerMessageId }) // <--- Critical Check
  .execute();
```

If a user or agent sends a message, `last_message_id` updates, causing this query to affect 0 rows. The update is safely skipped.

## 2. The "Unsafe" Pattern: Stale Save
**File:** `packages/backend/src/ai-responder/ai-responder.service.ts`

The main AI response logic suffers from a "Check-Then-Act" race condition spanning a long network call (LLM generation).

```typescript
// ❌ UNSAFE: Stale Save Pattern

// Time T0: Fetch state
const conversation = await this.conversationRepository.findOne(...);

// Time T0 -> T5: Long running operation (LLM Generation loop)
// ... multiple HTTP requests ...

// Time T5: Save stale object
conversation.lastMessageSnippet = aiResponseText;
await this.conversationRepository.save(conversation); 
// ^^^ This overwrites ANY changes made to 'conversation' between T0 and T5
// e.g. Agent assignment, status changes, new messages, priority updates
```

**Risk Impact:** High.
- **Data Loss:** If a human agent assigns the conversation to themselves while the AI is thinking, that assignment will be overwritten (reverted) when the AI finishes.
- **State Corruption:** Workflow metadata could be desynchronized if multiple events fire in parallel.

## 3. Error Handling Analysis
**Status:** Satisfactory.

The `AiResponderService` uses a top-level `try/catch/finally` block to ensure locks are released even if the logic crashes.

```typescript
try {
  // ... complex logic ...
} catch (error) {
  this.logger.error('Error in handleVisitorMessage:', error);
} finally {
  // ✅ ALWAYS runs: prevents deadlocks
  await this.visitorLockService.releaseLock(payload.visitorUid, lockId);
}
```

## Recommendations
1.  **Refactor `AiResponderService` to use `UPDATE` queries** instead of `save()` for the final persistence.
2.  **Use `EntityManager` transaction** if multiple tables need updates, though `UPDATE` queries are preferred for simple field patches.
3.  **Re-fetch** the conversation immediately before saving to check for modifications (less robust than atomic updates but better than current).
