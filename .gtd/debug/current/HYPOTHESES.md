# Root Cause Hypotheses

**Analyzed:** 2026-02-02
**Status:** PENDING VERIFICATION

## Summary

Based on code analysis, the send message flow appears correctly wired:
- `MessageComposer` receives `projectId` and `conversationId` as props from `MessagePane`
- Calls `useSendAgentReply()` hook → `sendAgentReply` API function
- API posts to `/projects/${projectId}/inbox/conversations/${conversationId}/messages`

The frontend code appears intact. The symptom (no network request at all) suggests the `sendMessage` mutate function is not being invoked.

---

## Hypothesis 1: `sendMessage` mutate function is silently failing or not being called

**Confidence:** High (75%)

**Description:**
The `useMutation` hook's `mutate` function might not be working correctly, or there's a silent error preventing the API call. The mutation could be failing before the network request is made.

**Evidence:**
- Code logic looks correct - `submitMessage()` calls `sendMessage()` when `content.trim()` is truthy
- No visible errors in console suggests the failure is silent
- The mutation hook is destructured correctly: `const { mutate: sendMessage, isPending } = useSendAgentReply();`

**Location:**
- `MessageComposer.tsx` line 24, 118-122
- `inboxApi.ts` lines 203-318 (`useSendAgentReply`)

**Verification Method:**
Add console.log in `submitMessage()` before and after `sendMessage()` call to verify execution path.

---

## Hypothesis 2: Event handler not being triggered (form submit or keydown)

**Confidence:** Medium (60%)

**Description:**
The `handleSubmit` or `handleKeyDown` handlers might not be triggering properly, preventing `submitMessage()` from being called at all.

**Evidence:**
- Form has `onSubmit={handleSubmit}`
- Textarea has `onKeyDown={handleKeyDown}`
- Both should call `submitMessage()`

**Location:**
- `MessageComposer.tsx` lines 135-153, 170-203

**Verification Method:**
Add console.log at start of `handleSubmit` and `handleKeyDown` handlers.

---

## Hypothesis 3: `slashState.isOpen` is stuck true, blocking Enter key submit

**Confidence:** Medium (40%)

**Description:**
The slash command popover state might be stuck in `isOpen: true`, which blocks the Enter key from submitting (line 149).

**Evidence:**
- Line 149: `if (!slashState.isOpen) { submitMessage(); }`
- If `slashState.isOpen` is incorrectly `true`, Enter won't submit

**Location:**
- `MessageComposer.tsx` lines 31-35, 149

**Verification Method:**
Add console.log to show `slashState.isOpen` value when Enter is pressed.

---

## Hypothesis 4: Props not being passed correctly (projectId/conversationId undefined)

**Confidence:** Low (25%)

**Description:**
The props `projectId` or `conversationId` might be undefined or wrong type, causing the API call to fail silently.

**Evidence:**
- `MessagePane` parses params as integers (lines 276-277)
- Conditional render: `{numericProjectId && convoId && (...)}` at line 487

**Location:**
- `MessagePane.tsx` lines 276-277, 487-492
- `MessageComposer.tsx` lines 14-16

**Verification Method:**
Add console.log to show received props in MessageComposer.

---

## Code Analysis Notes

- The code structure appears correct
- No obvious recent changes that would break this
- The silent failure (no errors, no network) is unusual
- Most likely the `sendMessage()` call itself or the path to it is broken
