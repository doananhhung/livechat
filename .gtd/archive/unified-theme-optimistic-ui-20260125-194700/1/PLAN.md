---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Dashboard Optimistic UI & Visual Cleanup

## Objective

Update `MessagePane.tsx` to visualize the optimistic `SENDING` and `FAILED` states that `inboxApi.ts` already provides, and standardize the message bubble styling to match the Widget's "xl" border radius.

## Context

- **Spec:** ./.gtd/unified-theme-optimistic-ui/SPEC.md
- **Research:** ./.gtd/unified-theme-optimistic-ui/1/RESEARCH.md
- **Files:** `packages/frontend/src/components/features/inbox/MessagePane.tsx`

## Architecture Constraints

- **Single Source:** Use `msg.status` from the `Message` object (provided by `inboxApi` optimistic update).
- **Invariants:** Agent messages are always right-aligned (primary). Visitor messages are always left-aligned (muted).
- **Resilience:** Failed messages must be clearly visible (red icon).
- **Testability:** `MessagePane` already receives mocked messages in tests; we'll verify status rendering there.

## Tasks

<task id="1" type="auto">
  <name>Implement MessageStatus Visualization</name>
  <files>packages/frontend/src/components/features/inbox/MessagePane.tsx</files>
  <action>
    Modify the message rendering loop in `MessagePane.tsx` to:
    1. Check `msg.status` (sending/failed).
    2. Apply `opacity-70` and render a `Spinner` (size 3/3) next to the bubble if `sending`.
    3. Render a red `AlertCircle` icon (lucide-react) if `failed`.
    4. Ensure these status indicators appear *outside* the bubble, adjacent to it.
  </action>
  <done>
    - Sending messages show a spinner and reduced opacity.
    - Failed messages show a red error icon.
  </done>
</task>

<task id="2" type="auto">
  <name>Standardize Bubble Styles</name>
  <files>packages/frontend/src/components/features/inbox/MessagePane.tsx</files>
  <action>
    Update the Tailwind classes for message bubbles:
    1. Change `rounded-lg` to `rounded-xl` to match the Widget.
    2. Ensure corner logic matches:
       - Visitor: `rounded-tl-none` (Top Left square)
       - Agent: `rounded-tr-none` (Top Right square)
    3. Verify padding `p-2 px-3` is consistent.
  </action>
  <done>
    - Bubbles use `rounded-xl`.
    - Corner "tails" are correctly positioned.
  </done>
</task>

## Success Criteria

- [ ] Agent messages appear immediately with a spinner when sent.
- [ ] Failed messages are clearly marked with an error icon.
- [ ] Bubble border radius is `xl` (approx 12px) matching the widget.
