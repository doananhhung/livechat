# Design Amendment: Centered Spacious Form Display

## Context

User clarified that forms should display as **centered, spacious** elements within the message flow — not as regular message-style bubbles aligned to left/right.

## Requirements (Confirmed)

| # | Requirement |
|---|-------------|
| 1 | Centered inline (not full width, but spacious) |
| 2 | Within message flow (not overlay/modal) |
| 3 | Both agent AND visitor see centered form |
| 4 | Submitted form stays visible with green tick indicator |

## Design

### Layout Change

**Current (Slice 2):**
```
┌──────────────────────────────────────────────┐
│ [Visitor msg]                                │
│                        [Agent msg]           │
│                        ┌─────────────────┐   │  ← right-aligned
│                        │ 📋 Booking Form │   │
│                        │ • Field 1       │   │
│                        │ ⏳ Pending      │   │
│                        └─────────────────┘   │
│ [Visitor msg]                                │
└──────────────────────────────────────────────┘
```

**New (Slice 3):**
```
┌──────────────────────────────────────────────┐
│ [Visitor msg]                                │
│                        [Agent msg]           │
│         ┌─────────────────────────────┐      │
│         │       📋 Booking Form       │      │  ← CENTERED
│         │                             │      │
│         │  Guest Name     [________]  │      │  ← SPACIOUS
│         │  Check-in Date  [________]  │      │
│         │  Room Type      [▼ Select]  │      │
│         │                             │      │
│         │        [ Submit Form ]      │      │
│         │                             │      │
│         │     ⏳ Awaiting response    │      │
│         └─────────────────────────────┘      │
│ [Visitor msg]                                │
└──────────────────────────────────────────────┘
```

### Styling Specifications

| Property | Value |
|----------|-------|
| Width | `max-w-lg` (512px) or 80% of pane, whichever smaller |
| Margin | `mx-auto` (centered) |
| Padding | `p-6` (spacious internal padding) |
| Border | `border-2` (more prominent than message bubbles) |
| Shadow | `shadow-lg` (elevated appearance) |
| Background | `bg-card` (distinct from message bubbles) |

### Form States (with visual indicator)

| State | Display |
|-------|---------|
| **Pending** | Form fields visible, submit button active, "⏳ Awaiting response" footer |
| **Filling** | "✏️ Visitor is filling..." with pulsing animation |
| **Submitted** | Green overlay tick (✓) on form, fields disabled, "✓ Submitted" badge |

### Submitted State Mockup

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │    ✓ ← large green tick     │    │  ← semi-transparent overlay
│  │       Booking Form          │    │
│  │                             │    │
│  │  Guest Name: John Doe       │    │  ← read-only values
│  │  Check-in: 2024-03-15       │    │
│  │  Room Type: Deluxe          │    │
│  │                             │    │
│  │  ✓ Submitted 2 min ago      │    │  ← green badge
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Implementation Changes

### MessagePane.tsx

```typescript
// For form messages, render centered instead of left/right aligned
const isFormMessage = msg.contentType === 'form_request' || msg.contentType === 'form_submission';

if (isFormMessage) {
  return (
    <div className="flex justify-center my-4">
      {renderMessageContent(msg, conversationId)}
    </div>
  );
}
```

### FormRequestBubble.tsx / FormSubmissionBubble.tsx

Update styling:
```typescript
// OLD
className="border rounded-lg p-3 max-w-md"

// NEW
className="border-2 rounded-xl p-6 max-w-lg w-full shadow-lg mx-auto"
```

### Widget FormRequestMessage.tsx

Apply same centered, spacious styling to visitor widget.

## Files to Modify

| File | Change |
|------|--------|
| `MessagePane.tsx` | Center form messages in layout |
| `FormRequestBubble.tsx` | Spacious styling (p-6, shadow-lg, border-2) |
| `FormSubmissionBubble.tsx` | Spacious styling + green tick overlay |
| `widget/FormRequestMessage.tsx` | Center + spacious styling |
| `widget/FormSubmissionMessage.tsx` | Center + spacious + tick overlay |

## Verification Plan

1. Agent sends form → Centered spacious form appears
2. Visitor sees centered fillable form in widget
3. Visitor submits → Form shows green tick overlay
4. Agent sees submitted form with tick overlay
