# Root Cause

**Found:** 2026-02-01
**Status:** CONFIRMED

## Root Cause

The "Delete" and "Cancel" buttons in the `AlertDialog` require two clicks because they are **unmounting and remounting** exactly during the first click sequence. 

When the `DropdownMenuItem` is clicked, the Radix `DropdownMenu` closes. This closure triggers a re-render of the `ConversationList` (due to focus restoration or internal state updates). Since the `AlertDialog` is a child of `ConversationList`, it also re-renders. If the button component unmounts and remounts between the `mousedown` and `mouseup` events, the browser discards the `click` event because it identifies the target element has been destroyed.

## Verified Hypothesis

**Original Hypothesis 1:** Radix DropdownMenu Focus Restoration Conflict
**Confidence:** 75% → **Confirmed**

## Evidence

Debug logs showed a rapid "Unmounted" then "Mounted" sequence for the buttons ("Xóa" and "Hủy") just as the user attempted the first click. Specifically:
- `Button unmounted {text: 'Xóa'}` 
- `Button mounted {text: 'Xóa'}`
- `Button onMouseUp {text: 'Xóa'}` (Notice `onMouseDown` was missing or hit the previous instance)

## Location

- **Files:** `packages/frontend/src/components/features/inbox/ConversationList.tsx`, `packages/frontend/src/components/ui/AlertDialog.tsx`
- **Component:** `ConversationList` re-rendering logic when dropdown closes.

## Why It Causes The Symptom

A standard DOM `click` event is only fired if both `mousedown` and `mouseup` occur on the same persistent element. Because the button remounts (loses its previous DOM node and creates a new one) during the interaction, the second half of the click (`mouseup`) hits a "new" element, making it a "fresh" focus event rather than a completed click event. The second physical click works because the buttons have finished remounting and remain stable.

## Rejected Hypotheses

- **Hypothesis 2 (Type="button"):** Irrelevant, as the logs confirmed the issue was physical unmounting of the element.
- **Hypothesis 3 (Animation Race):** The issue isn't CSS blocking pointers, but the React lifecycle destroying the event target.
