phase: 2
created: 2026-02-01
is_tdd: false

---

# Plan: Phase 2 - Frontend UI

## Objective

Expose the "System Prompt" configuration field in the Settings UI so it is visible and editable in "Orchestrator Mode". This allows users to define the Global System Prompt.

## Context

- `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx`

## Architecture Constraints

- **Persistence:** Relies on the existing `aiResponderPrompt` field in the Project entity. No new API needed.
- **UX:** Must clarify that in Orchestrator mode, this prompt is "Global".

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Move System Prompt Input</name>
  <risk>None</risk>
  <files>packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx</files>
  <action>
    1.  Locate the `textarea` for `aiResponderPrompt`.
    2.  Move it OUTSIDE the `{mode === 'simple' && ...}` condition block.
    3.  Wrap it in a visible container that appears for both modes.
  </action>
  <done>Input is visible when switching between modes.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Update Description Logic</name>
  <risk>None</risk>
  <files>packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx</files>
  <action>
    Dynamic label/description:
    - If `mode === 'simple'`: "AI Responder Prompt" / "Base instructions for the AI."
    - If `mode === 'orchestrator'`: "Global System Prompt" / "These instructions are prepended to every node in the workflow."
  </action>
  <done>Text updates dynamically based on mode.</done>
</task>

## Success Criteria

- [ ] System Prompt input is visible in Orchestrator Mode.
- [ ] Saving functionality works for Orchestrator Mode (persistence).
