---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Enhanced Form Submission UI

## Objective

Upgrade the `FormSubmissionMessage` component to provide a professional, read-only "receipt" view of submitted data. Replace the current basic list with a polished card component using proper typography, spacing, and layout.

## Context

- `FormSubmissionMessage.tsx` currently uses inline styles and renders a simple key-value list.
- The UI needs to distinguish between "Agent" and "Visitor" submissions (different background colors/alignments).
- Data type formatting (boolean to Yes/No) is already present but can be improved (e.g., null handling).

## Tasks

<task type="auto">
  <name>Polish FormSubmissionMessage UI</name>
  <files>packages/frontend/src/widget/components/FormSubmissionMessage.tsx</files>
  <action>
    - Refactor inline styles to use Tailwind classes (via `className` prop) or improved CSS-in-JS if Tailwind isn't fully set up for the widget.
    - Implement a "Receipt" layout:
      - Header: Template Name (Icon + Title)
      - Body: Grid layout for key-value pairs (Label: muted, Value: bold/primary)
      - Footer: (Optional) Timestamp
    - Improve boolean/null formatting.
    - Ensure distinct styling for Visitor vs. Agent messages matches `Message.tsx` styling conventions.
  </action>
  <verify>npm run test:widget --FormSubmissionMessage</verify>
  <done>Component renders a visually structured card with clear label/value distinction</done>
</task>

## Success Criteria

- [ ] UI looks like a "summary card" rather than a debug list
- [ ] Labels are visually distinct from values (e.g., smaller/lighter font for labels)
- [ ] Layout handles long values gracefully
- [ ] Existing tests in `FormSubmissionMessage.test.tsx` pass
