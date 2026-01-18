# Implementation Plan: rich_form_display

## 1. Acceptance Tests (What "Done" Looks Like)

### Frontend

#### Integration Tests (Components with Logic)

**FormRequestBubble.test.tsx:**
- [ ] Test: `<FormRequestBubble />` renders template name and field count badge
- [ ] Test: `<FormRequestBubble />` expands on chevron click → shows field list
- [ ] Test: `<FormRequestBubble />` collapses on chevron click → hides field list
- [ ] Test: `<FormRequestBubble />` with pending state → shows "Awaiting response"
- [ ] Test: `<FormRequestBubble />` with filling state → shows "Visitor is filling..." with animation class
- [ ] Test: `<FormRequestBubble />` with submitted state → shows "Submitted" in green
- [ ] Test: `<FormRequestBubble />` with expired state → shows "Expired" with muted styling

**FormSubmissionBubble.test.tsx:**
- [ ] Test: `<FormSubmissionBubble />` renders template name with checkmark
- [ ] Test: `<FormSubmissionBubble />` renders key-value pairs from metadata.data
- [ ] Test: `<FormSubmissionBubble />` collapses/expands data section on chevron click
- [ ] Test: `<FormSubmissionBubble />` shows edit/delete buttons

**FormFieldPreview.test.tsx:**
- [ ] Test: `<FormFieldPreview />` with text field → shows "[Text field]"
- [ ] Test: `<FormFieldPreview />` with value → shows actual value
- [ ] Test: `<FormFieldPreview />` with boolean true → shows "✓ Yes"

## 2. Verification Commands

- [ ] Type Check: `cd packages/frontend && npx tsc --noEmit`
- [ ] Tests: `cd packages/frontend && npm test -- FormRequestBubble FormSubmissionBubble FormFieldPreview`

## 3. Implementation Approach

1. Create `FormFieldPreview.tsx` — reusable field renderer (dependency for bubbles)
2. Create `FormRequestBubble.tsx` — agent view of form request (collapsed/expanded, status states)
3. Create `FormSubmissionBubble.tsx` — agent view of filled form data
4. Modify `MessagePane.tsx` — add `renderMessageContent()` helper to switch on `contentType`
5. Extend `typingStore.ts` — add `fillingStatus` for form filling indicator
6. Write tests for all new components

## 4. Files to Create/Modify

**Create:**
- `packages/frontend/src/components/features/inbox/FormFieldPreview.tsx`
- `packages/frontend/src/components/features/inbox/FormRequestBubble.tsx`
- `packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx`
- `packages/frontend/src/components/features/inbox/__tests__/FormRequestBubble.test.tsx`
- `packages/frontend/src/components/features/inbox/__tests__/FormSubmissionBubble.test.tsx`
- `packages/frontend/src/components/features/inbox/__tests__/FormFieldPreview.test.tsx`

**Modify:**
- `packages/frontend/src/components/features/inbox/MessagePane.tsx` — add contentType switch
- `packages/frontend/src/stores/typingStore.ts` — add fillingStatus field

## 5. Dependencies

- `lucide-react` (already installed) — icons for chevron, clipboard, check, clock
- `@live-chat/shared-types` — FormRequestMetadata, FormSubmissionMetadata, ActionFieldDefinition

## 6. Risk Assessment

1. **fillingStatus WebSocket integration** — Design assumes `fillingStatus` exists in store. Need to add state and ensure WebSocket handler updates it on `VISITOR_FILLING_FORM` event.
2. **Message type assertion** — `msg.metadata` needs to be cast to `FormRequestMetadata | FormSubmissionMetadata`. Type safety depends on `contentType` discriminator.
