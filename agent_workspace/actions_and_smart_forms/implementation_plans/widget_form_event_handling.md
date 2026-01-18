# Implementation Plan: widget_form_event_handling

## Status: COMPLETE (Part A) → IN PROGRESS (Part B)

---

## Part A: Event Handling ✓ DONE

| File | Status |
|------|--------|
| `gateway.event-listener.ts` | ✅ AGENT_REPLIED emit |
| `socketService.ts` | ✅ contentType/metadata |
| `inbox-event.handler.ts` | ✅ history DTO |

---

## Part B: Form Submission Wiring

### Acceptance Tests

**Backend:**
- [ ] `events.gateway.spec.ts`: SUBMIT_FORM handler calls `submitFormAsVisitor`
- [ ] Returns error if `socket.data.visitorId` missing

**Widget:**
- [ ] Manual: Visitor fills form → clicks submit → form shows "✓ Submitted"
- [ ] Manual: Refresh → form still shows submitted state

### Files to Modify

| Order | File | Change |
|-------|------|--------|
| 1 | `websocket.types.ts` | Add `SUBMIT_FORM` event + `SubmitFormPayload` type |
| 2 | `events.gateway.ts` | Add `@SubscribeMessage(SUBMIT_FORM)` handler |
| 3 | `useChatStore.ts` | Add `submittedFormMessageIds` + `markFormAsSubmitted` |
| 4 | `socketService.ts` | Add `emitSubmitForm()` + `FORM_SUBMITTED` listener |
| 5 | `MessageList.tsx` | Pass `onFormSubmit` + `submittedFormIds` props |
| 6 | `ChatWindow.tsx` | Pass props to MessageList |
| 7 | `App.tsx` | Wire `handleFormSubmit` callback |

### Implementation Details

**1. websocket.types.ts**
```typescript
SUBMIT_FORM = 'submit_form',

export interface SubmitFormPayload {
  formRequestMessageId: string;
  data: Record<string, unknown>;
}
```

**2. events.gateway.ts**
```typescript
@SubscribeMessage(WebSocketEvent.SUBMIT_FORM)
async handleSubmitForm(socket: Socket, payload: SubmitFormPayload) {
  const { visitorId, conversationId } = socket.data;
  // Call ActionsService.submitFormAsVisitor
  // Emit FORM_SUBMITTED to visitor and project room
}
```

**3-7:** Props threading from App → ChatWindow → MessageList → Message

### Verification Commands

```bash
cd packages/backend && npm run test -- events.gateway
cd packages/frontend && npx tsc --noEmit
```
