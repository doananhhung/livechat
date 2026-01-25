---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Runtime Safety

## Objective

Prevent runtime crashes caused by malformed AI configuration or invalid tool execution arguments.
We will introduce **Zod** for schema validation and enforce it at the `WorkflowEngineService` boundary.

## Context

- `packages/backend/src/ai-responder/services/workflow-engine.service.ts`
- `packages/backend/package.json` (Need to add `zod`)

## Architecture Constraints

- **Fail Fast:** Validation should happen as early as possible (when loading the workflow or executing a node).
- **Graceful Failure:** If a specific node is invalid, the workflow should arguably stop or skip, but not crash the entire process. For this phase, we will throw explicit errors that are caught by the `AiResponderService` try/catch block.

## Tasks

<task id="1" type="auto">
  <name>Install Zod</name>
  <files>packages/backend/package.json</files>
  <action>
    Run `npm install zod` in `packages/backend`.
  </action>
  <done>
    - `zod` appears in `package.json` dependencies.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Validation Schemas</name>
  <files>packages/backend/src/ai-responder/schemas/workflow.schemas.ts</files>
  <action>
    Create a new file `packages/backend/src/ai-responder/schemas/workflow.schemas.ts`.
    Define Zod schemas for:
    - `ToolDataSchema`: { toolName: string, toolArgs?: record }
    - `ConditionDataSchema`: { prompt?: string }
    - `WorkflowNodeSchema`: Validates `type` and strict `data` shape based on type.
  </action>
  <done>
    - File exists with exported Zod schemas.
  </done>
</task>

<task id="3" type="auto">
  <name>Enforce Validation in Engine</name>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    In `WorkflowEngineService`:
    1. Import schemas.
    2. In `executeStep`, validate `node.data` against the schema before processing.
    - For `action` nodes: Validate `toolName` exists.
    - For `condition` nodes: Validate `prompt` (optional).
    3. Throw `WorkflowValidationError` if validation fails.
  </action>
  <done>
    - `WorkflowEngineService` imports `zod`.
    - `executeStep` calls `safeParse` or `parse`.
  </done>
</task>

## Success Criteria

- [ ] `zod` is installed.
- [ ] `WorkflowEngineService` throws explicit errors for malformed node data instead of crashing with `undefined` access.
- [ ] `action` nodes are guaranteed to have a string `toolName`.
