---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Configuration Cleanup

## Objective

Remove technical debt by consolidating split AI configuration into a single source of truth (`aiConfig`).
We will deprecate `aiResponderEnabled` and `aiResponderPrompt` on the Project entity and implement a transition logic in `AiResponderService`.

## Context

- `packages/backend/src/projects/entities/project.entity.ts`
- `packages/backend/src/ai-responder/ai-responder.service.ts`

## Invariants

- **Backward Compatibility:** Existing projects that rely on `aiResponderEnabled` MUST still work.
- **Precedence:** If `aiConfig` has values, they override the legacy columns.

## Tasks

<task id="1" type="auto">
  <name>Mark Fields as Deprecated</name>
  <files>packages/backend/src/projects/entities/project.entity.ts</files>
  <action>
    Add `/** @deprecated Use aiConfig instead */` JSDoc to:
    - `aiResponderEnabled`
    - `aiResponderPrompt`
  </action>
  <done>
    - JSDoc present on fields.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Config Fallback Logic</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    Refactor `isAiActive`:
    - Read `enabled` from `project.aiConfig` (cast as Record<string, any> if needed).
    - Use `project.aiResponderEnabled` as fallback.

    Refactor `_processMessage` prompt loading:
    - Read `prompt` from `project.aiConfig`.
    - Use `project.aiResponderPrompt` as fallback.

  </action>
  <done>
    - Service no longer relies *solely* on legacy fields.
    - Logic explicitly prefers `aiConfig` properties.
  </done>
</task>

## Success Criteria

- [ ] `AiResponderService` logic handles both new `aiConfig` structure and legacy fields.
- [ ] Legacy fields are documented as deprecated.
