---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Types & Schema Foundation

## Objective

Define the `switch` node type in shared-types and create Zod validation schema in backend. This establishes the data contract before engine/UI implementation.

## Context

- ./.gtd/switch-node/SPEC.md
- ./.gtd/switch-node/ROADMAP.md
- packages/shared-types/src/workflow.types.ts
- packages/backend/src/ai-responder/schemas/workflow.schemas.ts

## Architecture Constraints

- **Single Source:** `workflow.types.ts` is authoritative for WorkflowNode type
- **Invariants:** `cases.length <= 10`, each case has non-empty `route` and `when`
- **Resilience:** Zod validation catches malformed switch data at runtime
- **Testability:** Schemas are pure functions, no mocking needed

## Tasks

<task id="1" type="auto">
  <name>Add switch type to shared-types</name>
  <files>packages/shared-types/src/workflow.types.ts</files>
  <action>
    Add `"switch"` to the `WorkflowNode.type` union:
    ```
    type: "start" | "trigger" | "action" | "condition" | "end" | "llm" | "switch"
    ```
    No other changes needed — data shape uses existing `Record<string, unknown>`.
  </action>
  <done>TypeScript compiles without error. `switch` is valid in `WorkflowNode.type`.</done>
</task>

<task id="2" type="auto">
  <name>Create SwitchDataSchema in workflow.schemas.ts</name>
  <files>packages/backend/src/ai-responder/schemas/workflow.schemas.ts</files>
  <action>
    1. Define `SwitchCaseSchema`:
       ```typescript
       export const SwitchCaseSchema = z.object({
         route: z.string().min(1, { message: 'Route name is required' }),
         when: z.string().min(1, { message: 'Condition is required' }),
       });
       ```

    2. Define `SwitchDataSchema`:
       ```typescript
       export const SwitchDataSchema = z.object({
         cases: z.array(SwitchCaseSchema).max(10, { message: 'Maximum 10 cases allowed' }),
         prompt: z.string().optional(),
       });
       ```

    3. Add switch variant to `WorkflowNodeSchema` discriminated union:
       ```typescript
       z.object({
         type: z.literal('switch'),
         id: z.string(),
         position: PositionSchema,
         data: SwitchDataSchema,
       }).passthrough(),
       ```

  </action>
  <done>Zod schema validates switch nodes. Invalid data (>10 cases, empty route) throws validation error.</done>
</task>

## Success Criteria

- [ ] `switch` is valid value in `WorkflowNode.type` (shared-types)
- [ ] `SwitchDataSchema` validates `cases` array with max 10 items
- [ ] `SwitchCaseSchema` enforces non-empty `route` and `when`
- [ ] `WorkflowNodeSchema` includes switch variant
- [ ] Backend compiles without TypeScript errors
