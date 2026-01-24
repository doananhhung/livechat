---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Backend Data Sync

## Objective

Ensure all AI-related project configuration fields are correctly returned by the backend API. Currently, the `findAllForUser` method in `ProjectService` manually maps database entities to a DTO but omits the AI fields, causing the frontend settings form to initialize with default/empty values.

## Context

- ./.gtd/fix-ai-responder-sync-and-theming/SPEC.md
- packages/backend/src/projects/project.service.ts
- packages/shared-types/src/project.types.ts

## Architecture Constraints

- **Single Source:** `ProjectService.findAllForUser` is the authoritative source for the project list used in the dashboard.
- **Typing:** The mapped objects must strictly adhere to the `ProjectWithRole` interface defined in `shared-types`.

## Tasks

<task id="1" type="auto">
  <name>Update ProjectService Mapper</name>
  <files>
    packages/backend/src/projects/project.service.ts
  </files>
  <action>
    Modify the `findAllForUser` method in `ProjectService`.
    Include the following fields in the return mapping:
    - `aiResponderEnabled`
    - `aiResponderPrompt`
    - `aiMode`
    - `aiConfig`
    Ensure they are pulled from `membership.project`.
  </action>
  <done>
    - `findAllForUser` includes AI fields in its return object.
    - Code passes type check.
  </done>
</task>

<task id="2" type="auto">
  <name>Verify Type Consistency</name>
  <files>
    packages/shared-types/src/project.types.ts
    packages/backend/src/projects/project.service.ts
  </files>
  <action>
    1. Verify `IProject` interface in `shared-types` correctly defines the AI fields.
    2. Run `npm run check-types` in `packages/backend` to ensure the new mapper fields are recognized and correctly typed.
  </action>
  <done>
    - `check-types` in backend completes without AI-related mapping errors.
  </done>
</task>

## Success Criteria

- [ ] `ProjectService.findAllForUser` returns project objects containing `aiResponderEnabled`, `aiResponderPrompt`, `aiMode`, and `aiConfig`.
- [ ] Backend type safety is maintained.
