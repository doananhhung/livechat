# Phase 1: Form State Persistence

## Goal

Ensure that when the widget reloads or connects (receiving conversation history), the "submitted" state of forms is correctly restored.
**Problem**: Currently, reloading the widget causes previously submitted forms to revert to an editable state because the `submittedFormMessageIds` store is not rehydrated from history.

## Proposed Changes

### [Frontend] Derived State from History

#### [MODIFY] [useChatStore.ts](packages/frontend/src/widget/store/useChatStore.ts)

- Update `loadConversationHistory` action.
- Iterate through the incoming history `messages`.
- Identify messages with `contentType === 'form_submission'`.
- Extract `metadata.formRequestMessageId`.
- Populate `submittedFormMessageIds` Set with these IDs.

## Verification Plan

### Automated Tests

- **File**: `packages/frontend/src/widget/store/__tests__/useChatStore.test.ts`
- **Test Case**: `restores submitted state from history`
  1. Create a mock history containing a `form_request` and a `form_submission`.
  2. Call `store.loadConversationHistory(mockHistory)`.
  3. Assert `store.submittedFormMessageIds` contains the request ID.

### Manual Verification

1. **Setup**: Send a form request and submit it.
2. **Action**: Reload the widget (refresh page).
3. **Verify**:
   - The original "test" form request should **NOT** be editable.
   - It should display as "✓ Form submitted" (or the submitted state UI).
   - It should **NOT** look like the "Before" image provided by the user (editable form + submission bubble).
