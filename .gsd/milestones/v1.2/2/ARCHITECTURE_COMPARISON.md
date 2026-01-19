# Architecture Comparison: Handling Form States

## Context

Current behavior renders two separate entries in the message list:

1. `FormRequestBubble` ("Please fill this form...")
2. `FormSubmissionBubble` (The actual data submitted)

Goal: Show **only one** persistent element that transitions from "Pending" to "Submitted".

## Option A: Message Replacement (Filter Strategy)

Filter the message list to hide the `form_request` message if a corresponding `form_submission` exists.

**Pros:**

- minimal code changes (just logic in `MessageList`).
- Keeps `FormRequestBubble` and `FormSubmissionBubble` as separate, simple components.
- Native to how chat logs work (linear time).

**Cons:**

- "Popping" effect if not handled carefully during transition.
- Complex logic in `MessagePane` loop (need to look ahead/behind to dedupe).
- If a user submits multiple times (edits), history might get weird.

## Option B: Unified Component (Single Source of Truth)

Create a `FormMessage` component.

- If `status === 'pending'`, render Request UI.
- If `status === 'submitted'`, render Submission UI.
- The `form_request` message acts as the **anchor**. Use the `metadata.submissionId` (added in Phase 1) to fetch/display the submission data _in place_ of the request.

**Pros:**

- **Zero redundancy guaranteed**: The request bubble _becomes_ the submission bubble.
- Smooth transition (in-place animation).
- Cleaner MessagePane logic (just render the component).

**Cons:**

- Requires fetching submission message content to display inside the request bubble (or storing submission data in the request metadata).
- Slightly more complex component state.

## Recommendation: Option B (Unified Component)

Since we already added `submissionId` to the request metadata in Phase 1, we can easily make the Request bubble "smart".
It effectively becomes a "Form Interaction" component.

1. It renders the "Request" view initially.
2. When `metadata.submissionId` exists, it fetches/looks up the submission data and renders the "Receipt" view instead.
3. We actively **hide** the separate `form_submission` message type from the main list to avoid duplication.
