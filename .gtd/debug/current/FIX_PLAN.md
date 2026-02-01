---
created: 2026-02-01
root_cause: Dialog buttons remount during dropdown close, breaking click events
---

# Fix Plan

## Objective

Fix the double-click bug on AlertDialog buttons by deferring the dialog open state update until after the Radix DropdownMenu close sequence completes.

## Context

- ./.gtd/debug/current/ROOT_CAUSE.md
- packages/frontend/src/components/features/inbox/ConversationList.tsx

## Architecture Constraints

- **Single Source:** Dialog state (`deleteDialogOpen`, `isRenameDialogOpen`) is managed in `ConversationList`.
- **Invariants:** Click events must fire reliably on AlertDialog buttons.
- **Resilience:** N/A (UI only).
- **Testability:** Manual verification required (visual interaction).

## Tasks

<task id="1" type="auto">
  <name>Defer dialog open state update</name>
  <files>packages/frontend/src/components/features/inbox/ConversationList.tsx</files>
  <action>
    Modify `handleDeleteClick` and `handleRenameClick` to defer the `setDeleteDialogOpen(true)` and `setIsRenameDialogOpen(true)` calls using `setTimeout(..., 0)`.
    
    This allows the Radix dropdown to fully close and React to stabilize before the dialog opens, preventing the button remount race condition.
    
    Change from:
    ```tsx
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
    ```
    
    To:
    ```tsx
    setConversationToDelete(conversation);
    setTimeout(() => setDeleteDialogOpen(true), 0);
    ```
    
    Apply the same pattern to `handleRenameClick`.
  </action>
  <done>Both handler functions use `setTimeout` to defer dialog open.</done>
</task>

<task id="2" type="checkpoint:human-verify">
  <name>Verify single-click works</name>
  <files>N/A</files>
  <action>
    User manually tests:
    1. Open inbox with conversations
    2. Click "..." dropdown on a conversation
    3. Click "Delete Conversation"
    4. Dialog opens
    5. Click "Delete" button ONCE
    6. Conversation should be deleted on single click
    
    Also test the "Cancel" button and "Rename Visitor" flow.
  </action>
  <done>All dialog buttons respond to single click.</done>
</task>

## Success Criteria

- [ ] Original symptom no longer occurs (single click deletes)
- [ ] Rename dialog also works with single click
- [ ] No regressions (existing flows still work)

## Rollback Plan

Revert the `setTimeout` wrappers if they introduce timing issues. The original behavior (double-click) would return.
