# Architecture Map: AI vs. Status Automation

**Date:** 2026-01-25
**Scope:** `packages/backend`

## Executive Summary

The codebase contains two distinct, unrelated systems using the overloaded term "Workflow".

1.  **AI Workflow Engine:** Handles LLM-driven conversation logic (nodes, edges, tools).
2.  **Status Automation:** Handles background job scheduling for auto-resolving conversations.

## System 1: AI Workflow Engine

**Purpose:** Executes the "AI Agent" logic, determining how to respond to a user based on a configured graph of nodes.

-   **Module:** `AiResponderModule`
    -   `packages/backend/src/ai-responder/ai-responder.module.ts`
-   **Service:** `WorkflowEngineService`
    -   `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
-   **Consumer (Entry Point):** `AiResponderService`
    -   `packages/backend/src/ai-responder/ai-responder.service.ts` calls `workflowEngine.executeStep(...)`.
-   **Data Model:** `WorkflowDefinition` (Shared Type), stored in `Project.ai_config` (Verified in Task 2).
-   **State:** Stateless execution per step. Context passed in method arguments.

**Flow:**
`AiResponderService` (receives message) -> `WorkflowEngineService.executeStep` -> `AiToolExecutor` (if action node) -> Returns `WorkflowStepResult`

## System 2: Status Automation (Legacy "Workflow")

**Purpose:** Schedules background jobs to automatically change conversation status (e.g., move to PENDING after inactivity).

-   **Module:** `WorkflowModule`
    -   `packages/backend/src/modules/workflow/workflow.module.ts`
-   **Queue:** `conversation-workflow-queue` (BullMQ)
-   **Producer:** `MessageService`
    -   `packages/backend/src/inbox/services/message.service.ts` injects the queue and adds jobs.
-   **Consumer:** `WorkflowConsumer`
    -   `packages/backend/src/modules/workflow/workflow.consumer.ts` processes `auto_pending` jobs.

**Flow:**
`MessageService` (sends agent reply) -> Adds job to `conversation-workflow-queue` (delayed) -> `WorkflowConsumer` (wakes up) -> Updates `Conversation` status.

## Conflict Analysis

-   **Naming:** `WorkflowModule` is a misnomer. It should be `StatusAutomationModule` or `SchedulerModule`.
-   **Overlap:** None functionally. They are orthogonal.
-   **Risk:** Developers might assume `WorkflowModule` governs the AI workflow, leading to confusion.

