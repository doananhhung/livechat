# Phase 2 Summary

**Status:** Complete
**Executed:** 2026-02-01

## What Was Done

Updated the Frontend UI to expose the "System Prompt" configuration in both "Simple" and "Orchestrator" modes. Previously, it was hidden in Orchestrator mode. Now, it serves as the "Global System Prompt" that is prepended to all nodes.

## Behaviour

**Before:**
- "Simple Mode": Showed "System Prompt" input.
- "Orchestrator Mode": Hidden "System Prompt" input.

**After:**
- "Simple Mode": Shows "System Prompt" input (unchanged).
- "Orchestrator Mode": Shows "Global System Prompt" input (same field).
- Labels and descriptions update dynamically based on the selected mode.

## Tasks Completed

1. ✓ Move System Prompt Input
   - Moved the `aiResponderPrompt` textarea outside the conditional block in `AiResponderSettingsForm.tsx`.
   - Applied consistent styling (`bg-card`, `border`, `p-4`) to the container.

2. ✓ Update Description Logic
   - Added conditional logic to render different labels/descriptions based on `mode`.
   - Added new translation keys:
     - `globalSystemPrompt`
     - `globalSystemPromptDesc`

## Deviations

- Added `bg-card` and border styling to the Prompt container to match other settings sections (previously unstyled in Simple mode).

## Success Criteria

- [x] System Prompt input is visible in Orchestrator Mode.
- [x] Saving functionality works for Orchestrator Mode (persistence).

## Files Changed

- `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx`
- `packages/frontend/src/i18n/locales/en.json`
- `packages/frontend/src/i18n/locales/vi.json`

## Proposed Commit Message

feat(frontend): expose global system prompt in orchestrator mode

- Move AI prompt input to be visible in all execution modes
- Add dynamic labels for "Global System Prompt" vs "System Prompt"
- Add i18n keys for new settings
- Fix styling consistency for prompt input container
