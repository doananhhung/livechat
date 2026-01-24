# Research: Critical Path Tracing

**Date:** 2026-01-25
**Scope:** `AiResponderService.handleVisitorMessage`

## Goal
Trace the complete data flow from `visitor.message.received` to `agent.message.sent`, documenting every state change and side effect.

## Trace Analysis

### 1. Trigger
- **Event:** `visitor.message.received`
- **Handler:** `AiResponderService.handleVisitorMessage`
- **Lock:** `visitorLockService.acquireLock` (Prevents concurrent processing)

### 2. Pre-Checks
- Visitor Opt-out: `sessionMetadata?.aiEnabled === false` -> Abort
- Project AI Active: `isAiActive(projectId)` (Must have 0 online agents) -> Abort
- Project Config: `projectRepository.findOneBy` -> Abort if missing

### 3. State Fetching (The Danger Zone)
- **Action:** `conversationRepository.findOne`
- **Risk:** Fetches snapshot at Time T0. Any changes to this object in DB after T0 are invisible to this thread.

### 4. History Preparation
- **Action:** `messageRepository.find` (Last 10 messages)
- **Logic:** Appends current payload content if not present.

### 5. Workflow Execution (Orchestrator Mode)
- **Condition:** `project.aiMode === 'orchestrator' && project.aiConfig`
- **State Recovery:** `conversation.metadata.workflowState?.currentNodeId`
- **Start Node:** If no state, finds `type: 'start'`.
- **Action Nodes:** Auto-executes `type: 'action'` nodes in a loop until LLM/Condition node reached.
  - **Side Effect:** `toolExecutor.executeTool` (e.g. `add_visitor_note`, `change_status`).
- **Context Preparation:** `workflowEngine.getNodeContext` generates `systemPrompt` and `tools` for the LLM.

### 6. LLM Generation Loop (Max 3 Turns)
- **Call:** `llmProviderManager.generateResponse`
- **Tool Handling:**
  - `route_decision`: Sets `routeDecisionMade`, breaks loop.
  - Other tools: `aiToolExecutor.executeTool`, adds result to history, continues loop.

### 7. Post-LLM Processing
- **Routing:** If `routeDecisionMade`:
  - `workflowEngine.processRouteDecision` -> `nextNodeId`
  - Updates `conversation.metadata`
  - **Saves Conversation** (Potential Overwrite)
  - **Recursion:** Calls `handleVisitorMessage` again to process next node.
- **Response:** If text response generated:
  - Creates `Message` entity (`senderId: 'AI_BOT'`).
  - Saves `Message`.
  - Updates `conversation.lastMessageSnippet` & `lastMessageTimestamp`.
  - **Saves Conversation** (Potential Overwrite).
  - Emits `agent.message.sent`.

### 8. Cleanup
- `finally { visitorLockService.releaseLock }`

## Synthesis Findings
- The critical path is logic-heavy and stateful.
- The recursive call in routing (`return this.handleVisitorMessage(payload)`) is a clever way to chain nodes but holds the lock for extended periods.
- The "Stale Save" issue identified in Phase 2 is confirmed to happen at two distinct points:
  1. After Routing Decision.
  2. After Sending Message.

