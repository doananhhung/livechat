---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Configuration Interface

## Objective

Build the "AI Orchestrator" settings page in the frontend, allowing users to switch between 'Simple' and 'Orchestrator' modes. For now, since only one tool exists, the UI will focus on selecting the mode and providing the system prompt.

## Context

- ./.gtd/ai-orchestrator-prototype/SPEC.md
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/frontend/src/pages/settings/ProjectSettingsPage.tsx
- packages/shared-dtos/src/projects/update-project.dto.ts

## Architecture Constraints

- **Type Safety:** Ensure `aiMode` and `aiConfig` are correctly typed in the frontend update DTO.
- **UX:** The 'Orchestrator' mode should be presented as an advanced option.
- **Single Source:** We reuse the existing `updateProject` API; no new endpoints needed.

## Tasks

<task id="1" type="auto">
  <name>Update Shared DTOs</name>
  <files>
    packages/shared-dtos/src/projects/update-project.dto.ts
    packages/shared-types/src/project.ts
  </files>
  <action>
    1. Update `UpdateProjectDto` in `shared-dtos` to include:
       - `aiMode?: 'simple' | 'orchestrator'`
       - `aiConfig?: Record<string, any>`
    2. Update `Project` interface in `shared-types` (if not auto-generated/shared) to match backend entity.
  </action>
  <done>
    - Frontend can safely send `aiMode` in update requests.
  </done>
</task>

<task id="2" type="auto">
  <name>Enhance AI Settings Form</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
  </files>
  <action>
    1. Add a "Mode" selection (Radio buttons or Select) to `AiResponderSettingsForm`:
       - Options: "Simple Responder" (default), "Orchestrator (Advanced)".
    2. If "Orchestrator" is selected:
       - Show a brief explanation: "In this mode, the AI can execute tools like adding notes."
       - (Future: Show node configuration list - out of scope for Phase 3 MVP, just mode switch for now).
    3. Include `aiMode` in the `updateMutation` payload.
  </action>
  <done>
    - User can toggle between Simple and Orchestrator modes.
    - Selection persists to backend.
  </done>
</task>

## Success Criteria

- [ ] `UpdateProjectDto` includes `aiMode`.
- [ ] Settings page shows AI Mode selector.
- [ ] Saving settings updates the `ai_mode` column in the database (via existing API).
