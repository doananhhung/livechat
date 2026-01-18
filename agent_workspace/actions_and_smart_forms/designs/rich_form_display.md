# Design: Rich Form Display in Message Pane

## 0. Context

This is a follow-on feature slice to "Send Form to Chat". The core form sending/receiving flow is complete, but:
- Agent message pane displays form messages as plain text ("Form request: [name]")
- Visitor widget has full form rendering (FormRequestMessage.tsx)

## 1. Objective

Display form messages with rich UI in both:
1. **Agent Dashboard**: Read-only form preview with field details
2. **Widget**: Interactive fillable form (already exists in Preact)

## 2. Scope

| Item | In Scope | Notes |
|------|----------|-------|
| Agent dashboard form request display | ✅ | New component |
| Agent dashboard form submission display | ✅ | New component |
| Expand/collapse form details | ✅ | User confirmed |
| Expired form visual distinction | ✅ | User confirmed |
| "Visitor is filling form" indicator | ✅ | User confirmed |
| Widget form request rendering | ❌ | Already exists (FormRequestMessage.tsx) |
| Widget form submission rendering | ❌ | Already exists (FormSubmissionMessage.tsx) |

## 3. Design

### 3.1 Component Architecture

```
packages/frontend/src/components/features/inbox/
├── MessagePane.tsx              # MODIFY - add contentType switch
├── FormRequestBubble.tsx        # NEW - agent view of form request
├── FormSubmissionBubble.tsx     # NEW - agent view of filled form
└── FormFieldPreview.tsx         # NEW - reusable field renderer
```

### 3.2 MessagePane Modification

```typescript
// In MessageList, replace direct content rendering:
// BEFORE (L110):
{msg.content}

// AFTER:
{renderMessageContent(msg)}

// Add helper function:
const renderMessageContent = (msg: Message) => {
  switch (msg.contentType) {
    case 'form_request':
      return <FormRequestBubble message={msg} conversationId={conversationId} />;
    case 'form_submission':
      return <FormSubmissionBubble message={msg} />;
    default:
      return msg.content;
  }
};
```

### 3.3 FormRequestBubble Component

**Purpose:** Read-only preview of form sent to visitor

**Props:**
```typescript
interface FormRequestBubbleProps {
  message: Message;        // Contains metadata: FormRequestMetadata
  conversationId: number;  // For typing store lookup
}
```

**State:**
```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

**Display:**
| Element | Description |
|---------|-------------|
| Header | Template name + expand/collapse chevron |
| Description | Template description (if any) |
| Field list | Collapsible, show when expanded |
| Status indicator | Dynamic based on state (see 3.6) |
| Field count badge | "4 fields" — always visible |

**Styling:**
- Card with subtle border
- Light background (agent-sent style)
- Form icon in header
- Chevron rotates on expand/collapse

### 3.4 FormSubmissionBubble Component

**Purpose:** Display filled form data from visitor

**Props:**
```typescript
interface FormSubmissionBubbleProps {
  message: Message; // Contains metadata: FormSubmissionMetadata
}
```

**State:**
```typescript
const [isExpanded, setIsExpanded] = useState(true); // Default expanded
```

**Display:**
| Element | Description |
|---------|-------------|
| Header | "✓ [Template Name] Submitted" + collapse chevron |
| Data | Collapsible key-value pairs |
| Timestamp | Submission time |
| Actions | Edit/Delete buttons (collapsible) |

### 3.5 FormFieldPreview Component

**Purpose:** Reusable field display for both bubbles

```typescript
interface FormFieldPreviewProps {
  field: ActionFieldDefinition;
  value?: unknown;  // undefined = show type placeholder
}
```

**Display by type:**
| Type | Empty (Request) | Filled (Submission) |
|------|-----------------|---------------------|
| text | `[Text field]` | "John Doe" |
| number | `[Number field]` | 42 |
| date | `[Date field]` | "2024-01-15" |
| boolean | `[Yes/No]` | ✓ Yes / ✗ No |
| select | `[Options: A, B, C]` | "Option B" |

### 3.6 Form Status States

**Status indicator in FormRequestBubble:**

| State | Condition | Display | Style |
|-------|-----------|---------|-------|
| **Pending** | No submission, not expired, visitor not filling | ⏳ Awaiting response | Gray text |
| **Filling** | Visitor typing status active | ✏️ Visitor is filling... | Blue pulsing |
| **Submitted** | Submission exists for this form | ✓ Submitted | Green text |
| **Expired** | `expiresAt < now` and no submission | ⏱️ Expired | Red text, muted card |

**Expired form styling:**
- Card background: muted gray
- Border: dashed
- Header: strikethrough on template name
- Status: red "Expired" badge

**Filling indicator integration:**
```typescript
// Use existing typingStore with form-specific status
const { fillingStatus } = useTypingStore();
const isFillingForm = fillingStatus[conversationId];
```

## 4. UI Mockups

### Form Request — Pending (Collapsed)
```
┌─────────────────────────────────┐
│ 📋 Booking Form          ▶ ︎︎[4] │
│ ⏳ Awaiting visitor response    │
└─────────────────────────────────┘
```

### Form Request — Pending (Expanded)
```
┌─────────────────────────────────┐
│ 📋 Booking Form          ▼ [4] │
│ Please fill out your details    │
├─────────────────────────────────┤
│ • Guest Name (text) *           │
│ • Check-in Date (date) *        │
│ • Room Type (select)            │
│ • Special Requests (text)       │
├─────────────────────────────────┤
│ ⏳ Awaiting visitor response    │
└─────────────────────────────────┘
```

### Form Request — Filling
```
┌─────────────────────────────────┐
│ 📋 Booking Form          ▼ [4] │
├─────────────────────────────────┤
│ [fields...]                     │
├─────────────────────────────────┤
│ ✏️ Visitor is filling form...   │  ← pulsing animation
└─────────────────────────────────┘
```

### Form Request — Expired
```
┌╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┐  ← dashed border
│ 📋 ̶B̶o̶o̶k̶i̶n̶g̶ ̶F̶o̶r̶m̶        ▶ ︎︎[4] │  ← strikethrough
│ ⏱️ Expired                      │  ← red
└╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴┘
```

### Form Submission (Expanded)
```
┌─────────────────────────────────┐
│ ✓ Booking Form Submitted  ▼    │
├─────────────────────────────────┤
│ Guest Name: John Doe            │
│ Check-in Date: 2024-03-15       │
│ Room Type: Deluxe               │
│ Special Requests: Late checkout │
├─────────────────────────────────┤
│ Submitted 2 min ago             │
│ [Edit] [Delete]                 │
└─────────────────────────────────┘
```

## 5. Data Flow

**Form Request:**
```
Message {
  contentType: 'form_request',
  content: 'Form request: Booking Form',
  metadata: {
    templateId: 1,
    templateName: 'Booking Form',
    templateDescription: 'Please fill out...',
    definition: { fields: [...] },
    expiresAt: '2024-03-20T...'
  }
}
```

**Form Submission:**
```
Message {
  contentType: 'form_submission',
  content: 'Form submitted: Booking Form',
  metadata: {
    formRequestMessageId: '123',
    submissionId: 'abc-uuid',
    templateName: 'Booking Form',
    data: { guestName: 'John', ... }
  }
}
```

## 6. Verification Plan

### Automated Tests
1. **FormRequestBubble.test.tsx**
   - Renders template name and field count
   - Expands/collapses on chevron click
   - Shows pending/filling/submitted/expired states
   - Expired form has muted styling

2. **FormSubmissionBubble.test.tsx**
   - Renders submitted data
   - Shows edit/delete buttons
   - Collapses/expands data section

3. **MessagePane integration**
   - Switches renderer based on contentType

**Run command:**
```bash
cd packages/frontend && npm run test -- FormRequestBubble FormSubmissionBubble
```

### Manual Verification
1. Agent sends form → Collapsed bubble appears with "Awaiting response"
2. Click chevron → Expands to show field list
3. Visitor starts filling → Status changes to "Visitor is filling..." (pulsing)
4. Visitor submits → Form request shows "Submitted", submission bubble appears
5. If form expires → Form request shows "Expired" with muted styling

## 7. Confirmed Requirements

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Expand/collapse form details | ✅ Confirmed |
| 2 | Expired forms show differently (muted, dashed border, strikethrough) | ✅ Confirmed |
| 3 | "Visitor is filling form" indicator (pulsing) | ✅ Confirmed |
