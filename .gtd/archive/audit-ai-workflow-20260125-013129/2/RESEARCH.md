# Research: Reliability & Hygiene Deep-Dive

**Date:** 2026-01-25
**Scope:** `packages/backend/src/ai-responder`, `packages/backend/src/modules/workflow`

## Findings

### 1. Code Hygiene (Orphans & Dead Code)
- **Status:** ✅ Clean
- **Analysis:**
  - `VisitorLockService`: Used in `AiResponderService` and E2E tests.
  - `CircuitBreaker`: Used in `LLMProviderManager`.
  - `LLMProviderManager`: Used in `AiResponderService`.
  - No unreachable files or obvious dead methods found in the target modules.

### 2. Error Handling
- **Status:** ✅ Clean
- **Analysis:**
  - No empty `catch` blocks found in the backend codebase.
  - `AiResponderService` wraps the entire logic in `try/catch/finally` ensuring locks are always released.
  - `LLMProviderManager` correctly catches provider errors, logs them, and implements a failover loop.

### 3. Concurrency & State Integrity
- **Status:** ⚠️ Mixed
- **Safe:** `WorkflowConsumer` (Status Automation)
  - Uses optimistic locking: `where('last_message_id = :triggerId')`.
  - If a new message arrives during the delay, `last_message_id` changes, and the update is skipped. This is excellent design.
- **Unsafe:** `AiResponderService` (AI Logic)
  - **Issue:** The service fetches the `Conversation` entity at the start (`step 3`).
  - It performs a long-running operation (LLM generation, multiple turns).
  - At the end (`step 8`), it calls `conversationRepository.save(conversation)`.
  - **Risk:** If a human agent updates the conversation (e.g., changes status, adds a note, or sends a message) during the LLM generation, the `save()` call will overwrite those changes with the stale data fetched seconds ago.
  - **Specific Fields at Risk:** `metadata` (Workflow State), `lastMessageSnippet`, `lastMessageTimestamp`.

## Recommendations for Plan
1.  **Flag the `AiResponderService` Race Condition:** Document this as a critical finding.
2.  **No Refactoring (per Spec):** We are only auditing. We will not fix this now, but the report must detail it.
3.  **Verify `GroqProvider` / `OpenAIProvider` dynamic loading:** The `LLMProviderManager` code shows explicit registration in the constructor, so they are not dynamic orphans.

