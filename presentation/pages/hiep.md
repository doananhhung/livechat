<LayoutSection title="Agent Experience & Productivity">

**Member 4: The Product Owner**

Inbox Operations, Conversation Assignments, Actions Engine, Canned Responses, và Visitor Notes

</LayoutSection>

---

<LayoutTwoCol title="Feature Catalog">

<template #left>

### 🎯 Agent Workspace

- **Inbox**: Quản lý hội thoại
- **Assignments**: Phân công công việc
- **Typing Indicator**: Agent đang gõ

</template>

<template #right>

### ⚡ Productivity Tools

| Feature | Mô tả |
|---------|-------|
| **Actions** | Form động |
| **Canned Responses** | Trả lời nhanh |
| **Visitor Notes** | Ghi chú CRM |

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Inbox: List Conversations">

```mermaid
flowchart LR
    subgraph Auth
        A[Request] --> B[Guards]
    end
    subgraph Query
        B --> C[QueryBuilder]
        C --> D[Filter/Sort/Page]
    end
    subgraph Enrich
        D --> E[Redis MGET]
        E --> F[Response]
    end
```

</LayoutDiagram>

---

<LayoutTwoCol title="Inbox API & Status">

<template #left>

### 📋 Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/conversations` | List |
| **PATCH** | `/conversations/:id` | Update |
| **DELETE** | `/conversations/:id` | Delete |
| **POST** | `/:id/messages` | Reply |

</template>

<template #right>

### 📊 Status Values
- **OPEN** — Đang xử lý
- **RESOLVED** — Đã giải quyết  
- **PENDING** — Chờ phản hồi

### 🔔 Events Emitted
- `conversation.updated`
- `conversation.deleted`

> Base: `/projects/:projectId/inbox`

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Update Conversation Flow">

```mermaid
flowchart LR
    A[PATCH] --> B{status?}
    B -->|Yes| C[updateStatus]
    B -->|No| D{read?}
    D -->|Yes| E[markAsRead]
    D -->|No| F[Error]
    C --> G[Save]
    E --> G
```

</LayoutDiagram>

---

<LayoutDiagram title="Conversation Assignments">

```mermaid
flowchart LR
    subgraph Validation
        A[POST] --> B[Auth]
        B --> C{Exists?}
    end
    subgraph Check
        C -->|Yes| D[Actor Member?]
        D --> E[Assignee Member?]
    end
    subgraph Save
        E --> F[Update DB]
        F --> G[Emit Event]
    end
    C -->|No| H[404]
```

</LayoutDiagram>

---

<LayoutTwoCol title="Assignment API">

<template #left>

### 🔗 Endpoints
| Method | Path | Role |
|--------|------|------|
| **POST** | `/:id/assignments` | AGENT |
| **DELETE** | `/:id/assignments` | AGENT |

```typescript
{ assigneeId: "uuid" }
```

</template>

<template #right>

### 📊 Database & Event
| Field | Type |
|-------|------|
| `assigneeId` | UUID |
| `assignedAt` | Date |

**Event:** `conversation.updated`
**Unassign:** set fields to `null`

</template>

</LayoutTwoCol>

---

<LayoutTwoCol title="Actions Engine">

<template #left>

### 📝 Concept
- Manager tạo template
- Agent điền form
- Submission → Conversation

### 🔐 Permissions
| Role | Access |
|------|--------|
| **MANAGER** | CRUD templates |
| **AGENT** | Submit only |

</template>

<template #right>

### 🎨 Field Types
| Type | Validation |
|------|------------|
| **TEXT** | string |
| **NUMBER** | number |
| **BOOLEAN** | bool |
| **DATE** | parseable |
| **SELECT** | in options |

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Create Action Template">

```mermaid
flowchart LR
    subgraph Frontend
        A[Manager] --> B[Form]
    end
    subgraph Backend
        B --> C[POST]
        C --> D[Check MANAGER]
        D --> E[Validate Fields]
    end
    subgraph Database
        E --> F[Save Template]
    end
```

</LayoutDiagram>

---

<LayoutDiagram title="Submit Action">

```mermaid
flowchart LR
    subgraph UI
        A[Agent] --> B[Select Template]
        B --> C[Fill Form]
    end
    subgraph Validate
        C --> D[Check Member]
        D --> E[Validate Data]
    end
    subgraph Persist
        E --> F[Save Submission]
    end
```

</LayoutDiagram>

---

<LayoutTwoCol title="Canned Responses">

<template #left>

### 🔗 Endpoints
| Method | Path | Role |
|--------|------|------|
| **POST** | `/canned-responses` | MANAGER |
| **GET** | `/canned-responses` | AGENT |
| **PATCH** | `/:id` | MANAGER |
| **DELETE** | `/:id` | MANAGER |

</template>

<template #right>

### ⌨️ Usage
1. Gõ `/` trong chat
2. Chọn shortcut
3. Auto-fill content

**Ví dụ:** `/greeting` → "Xin chào!"

**Error 409:** Shortcut exists

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Create Canned Response">

```mermaid
flowchart LR
    subgraph Input
        A[Manager] --> B[POST]
    end
    subgraph Validate
        B --> C[Auth MANAGER]
        C --> D{Unique?}
    end
    D -->|No| E[409 Conflict]
    D -->|Yes| F[Save]
```

</LayoutDiagram>

---

<LayoutTwoCol title="Visitor Notes">

<template #left>

### 📝 Đặc điểm
- Gắn với **Visitor** (không phải Conv)
- Persist across sessions
- All agents can see
- **Real-time** WebSocket

</template>

<template #right>

### 📡 WebSocket Events
| Event | Payload |
|-------|---------|
| `NOTE_ADDED` | `{ visitorId, note }` |
| `NOTE_UPDATED` | `{ visitorId, note }` |
| `NOTE_DELETED` | `{ visitorId, noteId }` |

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Create Visitor Note">

```mermaid
flowchart LR
    subgraph Request
        A[Agent] --> B[POST]
    end
    subgraph Process
        B --> C[Save DB]
        C --> D[Fetch Author]
    end
    subgraph Broadcast
        D --> E[Emit WebSocket]
        E --> F[Return Note]
    end
```

</LayoutDiagram>

---

<LayoutDiagram title="Notes Data Flow">

```mermaid
flowchart LR
    A[Dashboard] --> B[Controller]
    B --> C[Service]
    C --> D[(PostgreSQL)]
    C --> E[Gateway]
    E --> F[Other Agents]
```

</LayoutDiagram>

---

<LayoutSection title="Quality Assurance">

Chiến lược Kiểm thử và Tính Truy vết (Traceability)

</LayoutSection>

---

<LayoutTwoCol title="Testing Strategy">

<template #left>

### 🧪 Testing Pyramid
Hệ thống áp dụng mô hình kim tự tháp với trọng tâm là **E2E Testing** để đảm bảo luồng nghiệp vụ.

**Tools & Frameworks**:
- **Backend**: Jest (`jest`, `ts-jest`)
- **Frontend**: Vitest (`vitest`, `RTL`)
- **Integration**: Supertest
- **Coverage**: Tooling tích hợp sẵn

</template>

<template #right>

### 📊 Test Suites
- **Unit Tests**: Kiểm tra logic nghiệp vụ (Services, Utils).
- **Integration**: Kiểm tra kết nối DB, Redis, BullMQ.
- **E2E (23+ specs)**: Mô phỏng hành vi người dùng từ API level (Auth, Chat, Actions).

```bash
# Run backend tests
npm run test
npm run test:e2e
```

</template>

</LayoutTwoCol>

---

<LayoutDiagram title="Traceability Flow">

```mermaid
flowchart LR
    Req["🎯 Yêu cầu<br/>(User Story)"] --> Doc["📝 Tài liệu<br/>(Deep Investigation)"]
    Doc --> Code["💻 Thực thi<br/>(Controller/Service)"]
    Code --> Test["✅ Kiểm thử<br/>(E2E Spec)"]

    subgraph "Traceability Mapping"
    Req
    Doc
    Code
    Test
    end

    style Req fill:#e3f2fd,stroke:#1565c0
    style Doc fill:#e8f5e9,stroke:#2e7d32
    style Code fill:#fff3e0,stroke:#ef6c00
    style Test fill:#f3e5f5,stroke:#7b1fa2
```

</LayoutDiagram>

---

<LayoutTwoCol title="Traceability in Practice">

<template #left>

### 🔍 Mapping Example
Mỗi tài liệu trong `docs/deep_investigation/` đều bao gồm:

1.  **User Story**: User story
2.  **Acceptance Criteria**: Điều kiện để một tính năng coi như đã hoàn thành
3.  **Verification**: Unit/Intergration/e2e test
4.  **Code execution flow**: Luồng hoạt động hoàn chỉnh của tính năng, từ user -> backend -> user

</template>

<template #right>

### 📑 Ví dụ Cụ thể (Đơn giản hóa)
Tài liệu `widget_to_dashboard_message_flow.md`:

| Mục | Nội dung |
|-----|----------|
| **User Story** | Visitor gửi tin nhắn đến Agent |
| **Acceptance** | Tin nhắn persist vào DB, broadcast real-time |
| **Verification** | `chat.e2e-spec.ts` |
| **Flow** | Widget → Gateway → BullMQ → DB → Redis → Dashboard |

</template>

</LayoutTwoCol>

---

<LayoutTitleContent title="Summary">

| Feature | Key Points |
|---------|-----------|
| **Inbox** | List, filter, status, Redis enrichment |
| **Assignments** | Assign/unassign, membership validation |
| **Actions** | Templates, field validation, submissions |
| **Canned Responses** | Shortcuts, unique constraint |
| **Visitor Notes** | CRM-lite, real-time WebSocket sync |

</LayoutTitleContent>
