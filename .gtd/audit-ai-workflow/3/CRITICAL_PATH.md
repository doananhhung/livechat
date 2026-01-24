# Critical Path Trace: AI Responder

**Date:** 2026-01-25
**Source:** `packages/backend/src/ai-responder/ai-responder.service.ts`

## Trace Overview
This document maps the execution flow of `handleVisitorMessage` from trigger to completion.

### Legend
- 🔒 **LOCK:** Critical section protected by `VisitorLockService`.
- ⚠️ **RISK:** Potential race condition or failure point.
- 🌐 **I/O:** External network or database call.

---

## Execution Flow

### 1. Trigger & Locking
- **Line 72:** `@OnEvent('visitor.message.received')` - Triggered by event bus.
- **Line 76:** 🔒 `lockId = await this.visitorLockService.acquireLock` - **LOCK ACQUIRED**.
- **Line 79:** Checks if lock failed. If so, aborts.

### 2. Validation & Setup
- **Line 87:** Checks `sessionMetadata?.aiEnabled` (Visitor Opt-out).
- **Line 95:** 🌐 `await this.isAiActive(projectId)` - Database call to check project settings & online agents.
- **Line 104:** 🌐 `projectRepository.findOneBy` - Fetches project config.

### 3. State Fetching (⚠️ The Danger Zone Starts)
- **Line 114:** 🌐 `conversationRepository.findOne` - Fetches conversation state.
  - **Risk:** This snapshot becomes stale as execution proceeds.
- **Line 131:** 🌐 `messageRepository.find` - Fetches chat history.

### 4. Workflow State & LLM Prep
- **Line 157:** Checks `aiMode === 'orchestrator'`.
- **Line 162:** Recovers `currentNodeId` from `conversation.metadata`.
- **Line 177:** `workflowEngine.executeStep` - Auto-executes Action nodes (Loop).
  - 🌐 `toolExecutor.executeTool` runs here for actions.
- **Line 212:** `workflowEngine.getNodeContext` - Prepares `systemPrompt` and `tools` for the LLM.

### 5. LLM Generation Loop (The "Think" Phase)
- **Line 252:** Loop starts (`MAX_TURNS = 3`).
- **Line 254:** 🌐 `llmProviderManager.generateResponse` - **LONG RUNNING I/O**.
  - **Risk:** During this HTTP call (can take 5-30s), the DB state of `conversation` may change (e.g. user sends another message, agent assigns self).
- **Line 276:** Tool Execution Loop.
  - **Line 294:** 🌐 `aiToolExecutor.executeTool` - Executes tools like `add_visitor_note`.

### 6. Routing Decision (Branch A)
- **Line 318:** If `route_decision` was called:
  - **Line 324:** `workflowEngine.processRouteDecision`.
  - **Line 334:** `conversation.metadata = ...` - Updates workflow state in memory.
  - **Line 340:** 🌐 `conversationRepository.save(conversation)` - **⚠️ STALE SAVE**.
    - Overwrites `conversation` record with the snapshot from Step 3.
  - **Line 347:** `return this.handleVisitorMessage` - Recursive call.

### 7. Message Sending (Branch B)
- **Line 350:** If text response exists:
  - **Line 357:** `messageRepository.create`.
  - **Line 366:** 🌐 `messageRepository.save` - Saves AI message.
  - **Line 369:** `conversation.lastMessageSnippet = ...` - Updates in-memory object.
  - **Line 370:** `conversation.lastMessageTimestamp = ...`
  - **Line 389:** 🌐 `conversationRepository.save(conversation)` - **⚠️ STALE SAVE**.
    - Overwrites `conversation` record with the snapshot from Step 3.

### 8. Event Emission
- **Line 393:** 🌐 `realtimeSessionService.getVisitorSession`.
- **Line 403:** `eventEmitter.emit('agent.message.sent')`.

### 9. Cleanup
- **Line 409:** `catch` block logs errors.
- **Line 413:** 🔒 `visitorLockService.releaseLock` - **LOCK RELEASED**.

## Conclusion
The critical path is functionally complete but architecturally fragile due to the "Stale Save" pattern at lines 340 and 389. The locking mechanism (lines 76 & 413) prevents *parallel* AI executions for the same visitor, but does not protect against *interleaved* human/system actions.
