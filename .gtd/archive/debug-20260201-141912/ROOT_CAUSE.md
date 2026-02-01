# Root Cause Analysis

**Verified:** 2026-02-01
**Status:** VERIFIED

## Problem Statement

The unit test `AiResponderService › Condition Node Logic` hangs indefinitely during execution.

## Root Cause

The hang is caused by **infinite recursion** in `AiResponderService._processMessage`. 

When the service processes a message, it uses `_handleRoutingDecision` to determine if a workflow node transition is required. If a transition occurs (e.g., from a condition node), `_handleRoutingDecision` calls `_processMessage` recursively at line 440.

In the unit test environment:
1. `conversationRepository.findOne` (called via `_loadExecutionContext`) is mocked to return a static object.
2. This static object always has `metadata.workflowState.currentNodeId` set to `'cond-node'`.
3. The mock for `llmProviderManager.generateResponse` always returns a `route_decision` tool call.
4. Consequently, the service re-enters `_processMessage`, re-loads the **same** nodeId from the static mock, re-generates the **same** tool call, and recurses again infinitely.

Additionally, `_processMessage` lacks a **recursion depth guard** to prevent such loops in any environment.

## Impact

- **Unit Tests:** Fails to complete, blocking CI/CD.
- **Production:** A circular workflow (Node A -> Node B -> Node A) would cause a stack overflow or infinite execution loop, potentially crashing or hanging the AI worker.

## Evidence

- `packages/backend/src/ai-responder/ai-responder.service.ts:440`: `return this._processMessage(payload);` (Unconditional recursion).
- `packages/backend/src/ai-responder/ai-responder.service.spec.ts:287`: Static mock for conversation retrieval.
- `packages/backend/src/ai-responder/ai-responder.service.spec.ts:306`: Static mock for LLM response.

## Recommended Fix

1. Implement a `depth` or `turnId` counter in `_processMessage` with a hard limit (e.g., 5 turns).
2. Update the unit test to return different states or mock `_handleRoutingDecision` behavior to stop the recursion.
