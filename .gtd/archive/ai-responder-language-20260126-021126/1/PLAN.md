---
phase: 1
created: 2026-01-26
---

# Plan: Phase 1 - Database & Frontend Configuration

## Objective

Update the `Project` entity architecture to support the new `aiConfig.language` property and expose this configuration via the Frontend UI.

## Context

- ./.gtd/ai-responder-language/SPEC.md
- ./.gtd/ai-responder-language/ROADMAP.md
- packages/shared-types/src/project.types.ts
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/backend/src/projects/entities/project.entity.ts

## Architecture Constraints

- **Single Source:** `Project.aiConfig` (JSONB column) is the authoritative source for the language setting.
- **Invariants:** `aiConfig.language` defaults to 'en' if undefined for backward compatibility. Valid values are strictly 'en' | 'vi'.
- **Resilience:** The frontend form must handle legacy projects where `aiConfig` might be null or missing properties without crashing.
- **Testability:** Frontend changes verified via manual checklist (due to visual nature).

## Tasks

<task id="1" type="auto">
  <name>Update Shared Types</name>
  <files>packages/shared-types/src/project.types.ts</files>
  <action>
    Add `language?: 'en' | 'vi'` to the `AiConfig` interface definition.
    Ensure strict typing to prevent invalid string values.
  </action>
  <done>Interface update reflected in shared library.</done>
</task>

<task id="2" type="auto">
  <name>Update Frontend UI</name>
  <files>packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx</files>
  <action>
    1. Update component state to track `language` (defaulting to current i18n language if project config is empty).
    2. Add a `Select` or `RadioGroup` input for Language selection (English/Vietnamese).
    3. Update `handleSubmit` to include the `language` field in the payload sent to `updateProject`.
    4. Ensure the UI correctly reflects the saved state on reload.
  </action>
  <done>User can select and save their preferred AI language setting.</done>
</task>

## Success Criteria

- [ ] `AiConfig` type includes `language` property.
- [ ] Requirements check: Can select "Vietnamese" in project settings.
- [ ] Requirements check: Saving persistence verified (reload page preserves selection).
- [ ] Backward compatibility: Old projects default safely (likely to 'en') without errors.
