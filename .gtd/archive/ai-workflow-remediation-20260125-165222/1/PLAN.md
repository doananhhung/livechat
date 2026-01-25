---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Reliability Hardening

## Objective

Eliminate the critical "Stale Save" race condition in `AiResponderService`.
Currently, the service fetches a conversation, waits 5-30s for LLM generation, and then saves the _stale_ conversation object, potentially overwriting concurrent updates (e.g. agent assignments).

## Context

- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/inbox/entities/conversation.entity.ts`

## Implementation Strategy

We will replace the full `save(entity)` with a **Re-fetch & Atomic Update** pattern.

1.  **Fetch Fresh State:** Immediately before persisting, fetch only the `metadata` for the conversation.
2.  **Merge:** Merge the new `workflowState` into the fresh metadata.
3.  **Atomic Update:** Use `repository.update()` to persist `lastMessageSnippet`, `lastMessageTimestamp`, and the merged `metadata`.

This reduces the race condition window from **Seconds (LLM latency)** to **Milliseconds (DB RTT)**.

## Tasks

<task id="1" type="auto">
  <name>Refactor Condition Node Persistence (Line 375)</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Locate the condition routing logic (around line 375).
    Replace `await this.conversationRepository.save(conversation)` with:
    1. Fetch fresh `metadata` using `conversationRepository.findOne`.
    2. Merge `workflowState` with `nextNodeId`.
    3. Execute `this.conversationRepository.update({ id: conversation.id }, { metadata: mergedMetadata })`.
    4. Provide fallback `{}` if metadata is null.
  </action>
  <done>
    - `save(conversation)` is removed.
    - `update()` is used.
    - Metadata is merged on top of FRESH data, not the stale `conversation` variable.
  </done>
</task>

<task id="2" type="auto">
  <name>Refactor Final Response Persistence (Line 431)</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Locate the final save logic (around line 431).
    Replace `await this.conversationRepository.save(conversation)` with:
    1. Fetch fresh `metadata` using `conversationRepository.findOne`.
    2. Merge `workflowState` (if `workflowCtx` exists).
    3. Execute `this.conversationRepository.update({ id: conversation.id }, { 
         lastMessageSnippet: aiResponseText,
         lastMessageTimestamp: savedMessage.createdAt,
         metadata: mergedMetadata 
       })`.
  </action>
  <done>
    - `save(conversation)` is removed.
    - Properties `lastMessageSnippet`, `lastMessageTimestamp`, and `metadata` are updated via `update()`.
  </done>
</task>

## Verification Plan

### Manual Verification

1.  **Trigger AI:** Send a message to a project with AI enabled (Orchestrator mode).
2.  **Simulate Concurrent Update:** While AI is "thinking" (mock latency if needed, or just be fast), open another tab and Assign the conversation to an agent (or change status).
3.  **Assert:**
    - AI response should still appear (`lastMessageSnippet` updates).
    - Assignment/Status change should **NOT** be reverted.
