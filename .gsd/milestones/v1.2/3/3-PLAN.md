---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Form Render Consolidation & Style Reversion

## Objective

Consolidate the Form Request and Form Submission views into a single logical message component. When a form is submitted, the "Request" bubble should transform in-place into the "Submission" bubble. Additionally, revert the "Submission" bubble's visual style to the original cleaner look as requested.

## Context

- packages/frontend/src/components/features/inbox/FormRequestBubble.tsx
- packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx
- packages/frontend/src/components/features/inbox/MessagePane.tsx

## Tasks

<task type="auto">
  <name>Revert Submission Bubble Style</name>
  <files>
    packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx
  </files>
  <action>
    - Remove the green top-border "premium card" styling.
    - Revert to the original styling (simple border, green text for success state).
    - Keep the "Smart Formatting" logic (dates, URLs) as that adds value without changing the aesthetic significantly.
    - Remove the redundant "Submitted" text from the header if it appears elsewhere.
  </action>
  <verify>
    npm run build --workspace=@live-chat/frontend
  </verify>
  <done>
    Visual verification: Bubble looks like the original version (simple, clean).
  </done>
</task>

<task type="auto">
  <name>Unified Form Component Logic</name>
  <files>
    packages/frontend/src/components/features/inbox/FormRequestBubble.tsx
    packages/frontend/src/components/features/inbox/MessagePane.tsx
  </files>
  <action>
    - Update `FormRequestBubble.tsx`:
      - Accept an optional `submissionMessage` prop.
      - If `metadata.submissionId` exists, look up the submission message from the cache (or receive it via prop).
      - If submission exists, render `FormSubmissionBubble` *instead* of the request UI.
    - Update `MessagePane.tsx` (`MessageList` component):
      - In the rendering loop, identify `form_request` messages.
      - Check if a corresponding `form_submission` message exists in the list (matching `formRequestMessageId`).
      - If it does, pass that submission message to the `FormRequestBubble`.
      - **Filter out** the standalone `form_submission` message from the rendered list to prevent duplication.
  </action>
  <verify>
    npm run build --workspace=@live-chat/frontend
  </verify>
  <done>
    Manual verification:
    1. Send Form -> See Request Bubble.
    2. Submit Form -> Request Bubble *becomes* Submission Bubble.
    3. No duplicate bubbles appear.
  </done>
</task>

## Success Criteria

- [ ] Form Submission Bubble matches the user's preferred original style.
- [ ] A single UI element represents the entire form lifecycle (Request -> Submission).
- [ ] No duplicate "Form Request" and "Form Submission" bubbles appear for the same transaction.
