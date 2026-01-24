# Research: AI & Workflow Architecture

**Date:** 2026-01-25
**Scope:** `packages/backend/src/ai-responder`, `packages/backend/src/modules/workflow`, `packages/backend/src/database`

## Key Findings

### 1. The "Two Workflows" Problem
The term "Workflow" is critically overloaded in the codebase, referring to two completely independent systems:

| System | Module | Service | Purpose |
| :--- | :--- | :--- | :--- |
| **AI Conversation Flow** | `AiResponderModule` | `WorkflowEngineService` | Executes LLM-driven state machines (nodes, edges, conditions). Uses `WorkflowDefinition` from shared-types. |
| **Status Automation** | `WorkflowModule` | `WorkflowConsumer` | Background job processor (BullMQ) for `auto_pending` status updates. |

**Impact:** High confusion potential. `WorkflowModule` does *not* contain the workflow engine.

### 2. Migration vs Entity Discrepancy
- **Migration:** `1769253859605-AddAiOrchestratorConfig.ts` added `ai_mode` and `ai_config` columns to the `projects` table.
- **Entity Location:** Project entity is at `packages/backend/src/projects/entities/project.entity.ts`.
- **Risk:** If the entity file was not updated to include these columns, TypeORM will not map them, making them inaccessible in the code (Ghost Columns).

### 3. Service Boundaries
- `AiResponderModule` encapsulates the `WorkflowEngineService`.
- `WorkflowModule` encapsulates the `WorkflowConsumer`.
- `MessageService` injects the `conversation-workflow-queue` directly, bypassing `WorkflowModule`'s service layer (if one existed).

### 4. Shared Types
- `workflow.types.ts`: Defines the schema for the AI Workflow (Nodes, Edges).
- `ai-tools.ts`: Defines the tools (Action Names) used by the AI Workflow.
- Separation here is clean.

## Unknowns to Resolve in Plan
- Does `projects/entities/project.entity.ts` actually contain the new columns?
- Is `AiOrchestratorConfig` defined in any DTO?
