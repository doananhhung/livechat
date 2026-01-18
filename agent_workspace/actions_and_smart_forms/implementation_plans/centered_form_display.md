# Implementation Plan: centered_form_display

## Status: AWAITING APPROVAL

## 1. Acceptance Tests

### Visual Tests (Manual)
- [ ] Agent sends form → Centered spacious form appears (not right-aligned)
- [ ] Visitor sees centered fillable form in widget
- [ ] Visitor submits → Form shows green tick overlay
- [ ] Agent sees submitted form with tick overlay

### Unit/Integration Tests
- [ ] `FormRequestBubble.test.tsx` — verify centered container class exists
- [ ] `FormSubmissionBubble.test.tsx` — verify green tick overlay renders when submitted
- [ ] `MessagePane` integration — form messages use centered layout (not left/right)

## 2. Files to Modify

| File | Change |
|------|--------|
| `MessagePane.tsx` | Add `isFormMessage` check, render centered wrapper |
| `FormRequestBubble.tsx` | Update to spacious styling (`p-6`, `shadow-lg`, `border-2`, `max-w-lg`) |
| `FormSubmissionBubble.tsx` | Add green tick overlay, spacious styling |
| `widget/FormRequestMessage.tsx` | Apply centered + spacious styling |
| `widget/FormSubmissionMessage.tsx` | Apply centered + spacious + tick overlay |

## 3. Implementation Details

### MessagePane.tsx
```typescript
const isFormMessage = msg.contentType === 'form_request' || msg.contentType === 'form_submission';
if (isFormMessage) {
  return (
    <div className="flex justify-center my-4">
      {renderMessageContent(msg, conversationId)}
    </div>
  );
}
```

### Styling Changes
```
OLD: className="border rounded-lg p-3 max-w-md"
NEW: className="border-2 rounded-xl p-6 max-w-lg w-full shadow-lg"
```

### Green Tick Overlay (FormSubmissionBubble)
- Semi-transparent green overlay with large checkmark icon
- Displayed when form is submitted
- Fields become read-only with values displayed

## 4. Verification Commands

```bash
cd packages/frontend && npx tsc --noEmit
cd packages/frontend && npm test -- FormRequestBubble FormSubmissionBubble
```

## 5. Risk Assessment

- **LOW**: Pure CSS changes, no logic modifications
- Widget components use Preact — ensure class names work with Preact styling
