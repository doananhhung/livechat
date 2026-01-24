---
phase: 4
created: 2026-01-24
---

# Plan: Phase 4 - UI Refinement

## Objective

Polish the user experience when switching between "Simple" and "Orchestrator" AI modes. This phase adds smooth enter animations to the dynamic form sections and ensures the transition feels fluid and high-quality.

## Context

- ./.gtd/fix-ai-responder-sync-and-theming/SPEC.md
- packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
- packages/frontend/tailwind.config.js

## Architecture Constraints

- **Animation:** Use `tailwindcss-animate` classes for consistent, lightweight transitions.
- **Performance:** Avoid heavy re-renders or complex state logic for simple animations.

## Tasks

<task id="1" type="auto">
  <name>Add Transitions to AI Mode Sections</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
  </files>
  <action>
    1. Wrap the "Workflow Logic" container in a div with enter animation classes: `animate-in fade-in zoom-in-95 duration-300`.
    2. Wrap the "System Prompt" (simple mode) container in a div with enter animation classes: `animate-in fade-in slide-in-from-top-2 duration-200`.
    3. Ensure the transitions don't conflict with React Flow's internal rendering.
  </action>
  <done>
    - Switching modes shows a smooth fade/scale or slide animation for the new section.
  </done>
</task>

<task id="2" type="auto">
  <name>Polish Layout Transitions</name>
  <files>
    packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx
  </files>
  <action>
    1. Add a subtle transition to the main form container if needed to smooth out height changes.
    2. Verify that the "Orchestrator" badge and radio buttons remain stable during transitions.
  </action>
  <done>
    - Form layout remains stable and professional during mode toggling.
  </done>
</task>

## Success Criteria

- [ ] AI mode switching feels polished with smooth fade/slide effects.
- [ ] No visual "glitches" or abrupt jumps when the inline editor appears.
