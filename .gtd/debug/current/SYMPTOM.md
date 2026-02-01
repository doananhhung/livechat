# Bug Symptom

**Reported:** 2026-02-01
**Status:** CONFIRMED (Updated after failed fix attempt)

## Expected Behavior

Single click on Delete/Cancel button in AlertDialog should trigger the action.

## Actual Behavior

- **First click:** Nothing happens (no focus ring visible)
- **Second click:** Border lights up AND action triggers

## Reproduction Steps

1. Open inbox with conversations
2. Click "..." dropdown on a conversation
3. Click "Delete Conversation" from dropdown
4. Dialog opens
5. Click "Delete" button once → nothing happens
6. Click "Delete" button again → border lights up and conversation is deleted

## Conditions

- Happens on both Delete and Cancel buttons in AlertDialog
- Only these AlertDialog buttons have this problem
- Other buttons on the page work with single click

## Environment

- **Environment:** Dev
- **Recent Changes:** Applied `setTimeout(() => setDeleteDialogOpen(true), 0)` fix - did not resolve issue

## Fix Attempts

1. **setTimeout(0) on dialog open** - Changed behavior slightly (no focus on first click) but still requires two clicks

## Additional Context

The setTimeout fix changed the visual behavior but did not fix the core issue. The problem is likely deeper than the dropdown close sequence.
