# Changelog: Actions and Smart Forms

## 2024-03-25 - Slice 4: Widget Form Event Handling
- **Slice:** `widget_form_event_handling`
- **What Changed:** Unified visitor message delivery and wired up form submission from the widget.
- **Files Modified:**
  - `packages/backend/src/gateway/gateway.event-listener.ts` — Switched to `AGENT_REPLIED` for form requests.
  - `packages/frontend/src/widget/services/socketService.ts` — Added `SUBMIT_FORM` emission and response handling.
  - `packages/backend/src/gateway/events.gateway.ts` — Added `SUBMIT_FORM` listener.
- **Tests Added:**
  - `packages/backend/src/gateway/events.gateway.spec.ts`
- **Reviewed By:** Reviewer (see `code_reviews/widget_form_event_handling.md`)
- **Verified By:** Architect (see `handoffs/widget_form_event_handling.md`)

## 2024-03-23 - Slice 3: Rich Form Display
- **Slice:** `rich_form_display`
- **What Changed:** Implemented rich UI bubbles for form requests and submissions in the agent message pane.
- **Files Modified:**
  - `packages/frontend/src/components/features/inbox/FormRequestBubble.tsx` — NEW component for form previews.
  - `packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx` — NEW component for submission data.
  - `packages/frontend/src/components/features/inbox/FormFieldPreview.tsx` — NEW shared component.
- **Tests Added:**
  - `FormRequestBubble.test.tsx`
  - `FormSubmissionBubble.test.tsx`
- **Reviewed By:** Reviewer (see `code_reviews/rich_form_display.md`)
- **Verified By:** Architect (see `handoffs/rich_form_display.md`)

## 2024-03-21 - Slice 2: Send Form to Chat
- **Slice:** `send_form_to_chat`
- **What Changed:** Extended the action system to allow agents to send forms to visitors.
- **Files Modified:**
  - `packages/backend/src/actions/entities/action-submission.entity.ts` — Support visitor IDs.
  - `packages/shared-types/src/message.types.ts` — New content types.
- **Reviewed By:** Reviewer (see `code_reviews/send_form_to_chat.md`)

## 2024-03-15 - Slice 1: Initial Implementation (Actions Templates)
- **Slice:** `centered_form_display`
- **What Changed:** Core framework for managing action templates and internal agent submissions.
- **Files Modified:**
  - `packages/backend/src/actions/actions.service.ts`
  - `packages/frontend/src/components/features/actions/ActionPanel.tsx`
- **Reviewed By:** Reviewer (see `code_reviews/centered_form_display.md`)
