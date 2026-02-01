<LayoutSection title="System Architecture">

**Member 1: System Architect**

Kiến trúc tổng thể, triển khai, Event-Driven Core, Webhooks, và Audit Logs

</LayoutSection>

---


<LayoutTwoCol title="System Overview">

<template #left>

### 🎯 Application Type
**Customer Support Chat Platform**

- Real-time messaging giữa Visitor và Agent
- Widget nhúng vào website khách hàng
- Dashboard quản lý cho nhân viên hỗ trợ

</template>

<template #right>

### 🏗️ Architecture Style
**Event-Driven Microservices**

| Đặc điểm | Mô tả |
|----------|-------|
| **Real-time** | WebSocket (Socket.IO) |
| **Multi-tenant** | Cô lập dữ liệu theo Project |
| **Decoupled** | EventEmitter2 Bus |

</template>

</LayoutTwoCol>

<!--
"Trước tiên, để các bạn có cái nhìn tổng quan về hệ thống chúng tôi đang xây dựng.

Về Application Type: Đây là một nền tảng Customer Support Chat Platform, cho phép real-time messaging giữa Visitor - người truy cập website - và Agent - nhân viên hỗ trợ. Hệ thống bao gồm một chat widget có thể nhúng vào bất kỳ website nào của khách hàng, và một dashboard quản lý dành cho các nhân viên hỗ trợ.

Về Architecture Style: Chúng tôi chọn kiến trúc Event-Driven Microservices. Các điểm đặc biệt là:

Real-time: Sử dụng WebSocket thông qua Socket.IO để đảm bảo tin nhắn được truyền trong thời gian thực
Multi-tenant: Hỗ trợ nhiều công ty khác nhau sử dụng cùng hệ thống, với dữ liệu được cô lập hoàn toàn theo từng Project
Decoupled: Các thành phần giao tiếp thông qua EventEmitter2 Bus, giúp hệ thống linh hoạt và dễ mở rộng"
-->

---

<LayoutDiagram title="System Components Overview">

```mermaid
flowchart LR
    subgraph Frontend
        Dashboard["Agent Dashboard <br/> (React)"]
        Widget["Chat Widget <br/> (Preact)"]
    end

    subgraph WSLayer["WebSocket Layer"]
        SIO["Socket.IO Gateway"]
        Rooms["Project Rooms"]
    end

    subgraph Backend["Backend (NestJS)"]
        Guards["Auth Guards + <br/> Role-Based Access Control"]
        API["REST Controllers"]
        EventBus["EventEmitter2 Bus"]
        Services["Domain Services"]
    end

    subgraph Workers["Background Processing"]
        BullMQ["BullMQ Consumer"]
        Webhooks["Webhook Processor"]
    end

    subgraph Infra["Infrastructure"]
        PG[("PostgreSQL")]
        Redis[("Redis")]
    end

    %% Frontend connections
    Dashboard -->|"REST API"| Guards
    Dashboard <-->|"WebSocket"| SIO
    Widget <-->|"WebSocket only"| SIO

    %% Auth flow
    Guards -->|"Authenticated"| API
    API --> Services

    %% WebSocket to Backend
    SIO --> Rooms
    SIO -->|"Events"| EventBus
    EventBus --> Services

    %% Backend to Infrastructure
    Services --> PG
    Services --> Redis

    %% Background processing
    Services -.->|"Enqueue jobs"| BullMQ
    BullMQ --> Webhooks
    
    %% Redis Pub/Sub (for cross-server)
    Redis -.->|"Pub/Sub"| SIO
```

</LayoutDiagram>

<!--
"Bây giờ chúng ta sẽ đi sâu vào các thành phần chính của hệ thống qua sơ đồ này.

Hệ thống được chia thành 5 tầng chính:

Tầng Frontend gồm hai phần:
Agent Dashboard: Được viết bằng React, đây là giao diện làm việc của nhân viên hỗ trợ
Chat Widget: Được viết bằng Preact - một phiên bản nhẹ hơn của React - để đảm bảo tải nhanh khi nhúng vào website khách hàng

Tầng WebSocket Layer: Sử dụng Socket.IO Gateway để xử lý tất cả các kết nối real-time. Đặc biệt, chúng tôi sử dụng cơ chế Project Rooms để cô lập các sự kiện theo từng project.

Tầng Backend: Xây dựng trên NestJS framework, bao gồm:

REST Controllers để xử lý các API request
Domain Services chứa business logic
Auth Guards và RBAC để kiểm soát quyền truy cập
Background Workers: Xử lý các tác vụ nặng như gửi webhook mà không làm block main thread. Chúng tôi dùng BullMQ để quản lý queue.

Cuối cùng là Infrastructure layer: Gồm PostgreSQL để lưu trữ dữ liệu, và Redis phục vụ cho cache, queue, và pub/sub.

Các thành phần này làm việc phối hợp với nhau để tạo nên một hệ thống real-time hiệu quả và scalable."
-->

---

<LayoutTwoCol title="Multi-Tenancy with Projects">

<template #left>

### 🔐 Data Isolation

```
Mọi entity → projectId → Cô lập hoàn toàn
```

- **Project**: Đơn vị cô lập dữ liệu gốc
- **ProjectMember**: Liên kết User với Project
- Mọi request phải validate **project membership**

</template>

<template #right>

### 👥 Role Hierarchy

| Role | Quyền hạn |
|------|-----------|
| **MANAGER** | Toàn quyền: cấu hình, báo cáo, quản lý team |
| **AGENT** | Chat với khách, quản lý conversation |

> Dữ liệu công ty A **không bao giờ lẫn** với công ty B

</template>

</LayoutTwoCol>

<!--
"Một trong những đặc điểm quan trọng nhất của hệ thống là khả năng Multi-Tenancy.

Về Data Isolation: Mọi entity trong hệ thống đều có projectId. Đây là đơn vị cô lập dữ liệu gốc. Điều này có nghĩa là:

Project là container chứa tất cả dữ liệu của một công ty
ProjectMember liên kết User với Project
Mọi request đều phải validate project membership trước khi cho phép truy cập
Về Role Hierarchy: Hệ thống có 2 role chính:

MANAGER: Có toàn quyền quản lý - bao gồm cấu hình hệ thống, xem báo cáo, và quản lý team members
AGENT: Quyền chat với khách hàng và quản lý conversation
Điểm quan trọng nhất là: Dữ liệu của công ty A không bao giờ có thể lẫn với công ty B. Mỗi project là một môi trường độc lập hoàn toàn."
-->

---

<LayoutSection title="Deployment & Tech Stack">

Công nghệ và cấu trúc Monorepo

</LayoutSection>

---

<LayoutTwoCol title="Technology Stack">

<template #left>

### 🖥️ Backend
| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js ≥18.x |
| **Framework** | NestJS |
| **Database** | PostgreSQL |
| **Cache/Queue** | Redis + BullMQ |
| **Real-time** | Socket.IO |

</template>

<template #right>

### 🎨 Frontend
| Component | Technology |
|-----------|------------|
| **Dashboard** | React |
| **Widget** | Preact (nhẹ hơn) |
| **State** | Zustand |
| **Styling** | TailwindCSS |

### 📦 DevOps
- **Container**: Docker Compose ≥2.x
- **Monorepo**: npm workspaces
- **CI/CD**: GitHub Actions (Auto Testing & Linting)

</template>

</LayoutTwoCol>

---

<LayoutTwoCol title="Development Process">
<template #left>

### 🔄 Agile & Iterative
**Philosophy: "Build Small, Scale Fast"**

1.  **Phase 1 (Core)**: Chat text-only (Agent ↔ Visitor)
2.  **Phase 2 (Real-time)**: WebSocket + Optimistic UI
3.  **Phase 3 (Enterprise)**: Multi-tenancy + Security
4.  **Final**: AI Orchestration

</template>
<template #right>

### 🛠️ Why NestJS?
**Structure & Scalability**

- **Modular**: Dễ chia tách features (Auth, Inbox, Gateway)
- **Opinionated**: Chuẩn hóa cách viết code cho Team 4 người
- **Ecosystem**: Support Native cho WebSocket & Microservices

</template>
</LayoutTwoCol>

---

<LayoutTitleContent title="Monorepo Structure">

```
live_chat/
├── packages/
│   ├── backend/        # NestJS API + Worker
│   │   ├── src/
│   │   │   ├── auth/       # Authentication
│   │   │   ├── inbox/      # Messages & Conversations
│   │   │   ├── gateway/    # WebSocket
│   │   │   └── webhooks/   # External integration
│   │   └── ...
│   ├── frontend/       # React Dashboard + Widget
│   └── shared-*/       # Shared DTOs & Types
└── docs/               # Documentation
```

> Cấu trúc này giúp **code sharing dễ dàng** và **build/deploy thống nhất**

</LayoutTitleContent>

---

<LayoutSection title="Event-Driven Core">

Kiến trúc Event và Socket.IO Room Isolation

</LayoutSection>

---

<LayoutDiagram title="Event Architecture">

```mermaid
flowchart TB
    subgraph Inbound["Inbound Events (Visitor → System)"]
        direction TB
        GW_IN["EventsGateway"]
        E_IN(["visitor.message.received"])
        IEH["InboxEventHandlerService"]
        BQ["BullMQ Queue"]
    end
    subgraph OutboundFlow["Outbound Events (System → Visitor)"]
        direction TB
        
        subgraph Backend["Domain Services"]
            CS["ConversationService"]
            MS["MessageService"]
            VS["VisitorsService"]
        end

        subgraph Events["EventEmitter2 (System → Gateway)"]
            direction LR
            E1(["conversation.updated"])
            E2(["agent.message.sent"])
            E3(["visitor.updated"])
        end

        subgraph Listener["GatewayEventListener"]
            H1["handleConversationUpdated"]
            H2["handleAgentMessageSent"]
            H3["handleVisitorUpdated"]
        end

        subgraph Gateway["EventsGateway"]
            Emit["Broadcast to Rooms"]
        end
    end

    %% Inbound Flow
    GW_IN -->|"emit"| E_IN
    E_IN --> IEH
    IEH -->|"enqueue"| BQ

    %% Outbound Flow
    CS --> E1
    MS --> E2
    VS --> E3
    E1 --> H1
    E2 --> H2
    E3 --> H3
    H1 --> Emit
    H2 --> Emit
    H3 --> Emit
```

</LayoutDiagram>

---

<LayoutTitleContent title="Socket.IO Room Isolation">

```typescript
// Khi agent join project
async handleJoinProjectRoom(client, payload) {
  // 1. Phải đăng nhập
  if (!client.data.user) 
    throw new WsException('Unauthorized');
  
  // 2. Phải là member của project
  await this.projectService.validateProjectMembership(
    payload.projectId, 
    client.data.user.id
  );
  
  // 3. Join room
  client.join(`project:${payload.projectId}`);
}

// Broadcast chỉ đến project room
this.server
  .to(`project:${projectId}`)
  .emit('conversationUpdated', payload);
```

> Agent của công ty A **không nhận được event** của công ty B

</LayoutTitleContent>

---

<LayoutTwoCol title="Event Catalog">

<template #left>

### 📨 Inbox Events
| Event | Trigger |
|-------|---------|
| conversationUpdated | Assign, status change |
| newMessage | Tin nhắn mới |

</template>

<template #right>

### 👤 Visitor Events
| Event | Trigger |
|-------|---------|
| visitorStatusChanged | Connect/Disconnect |
| visitorIsTyping | Visitor gõ phím |
| visitorContextUpdated | URL thay đổi |

</template>

</LayoutTwoCol>

---

<LayoutSection title="Webhooks">

External Integration với SSRF Protection

</LayoutSection>

---

<LayoutDiagram title="Webhook Architecture">

```mermaid
flowchart LR
    subgraph Trigger
        A["Message Created"]
    end
    subgraph System
        B["Redis Pub/Sub"] --> C["Dispatcher"]
        C --> D["BullMQ Queue"]
        D --> E["Processor"]
    end
    subgraph External
        F["Customer Server"]
    end
    
    A --> B
    E -->|"HTTP POST"| F
```

</LayoutDiagram>

<!--
"Đây là sơ đồ tổng quan về Webhook Architecture.

Khi một Message được tạo (Trigger), sự kiện được broadcast qua Redis Pub/Sub đến Dispatcher. 

Dispatcher lắng nghe channel này, tìm các webhook subscriptions cần gửi, rồi đẩy jobs vào BullMQ Queue.

BullMQ Queue thực chất là data structures được lưu trong Redis - đảm bảo persistence và retry mechanism.

Processor (BullMQ Worker) lấy jobs từ queue và gửi HTTP POST đến Customer Server của khách hàng.

Slide tiếp theo sẽ giải thích chi tiết hơn về infrastructure và luồng xử lý."
-->
---

<LayoutDiagram title="Webhook Architecture: Detailed Flow">

```mermaid
sequenceDiagram
    participant Msg as Message Created
    participant OL as OutboxListener<br/>(Worker Server)
    participant Redis as Redis Server
    participant Disp as WebhookDispatcher<br/>(API Server)
    participant DB as PostgreSQL
    participant Proc as WebhookProcessor<br/>(Worker Server)
    participant Ext as Customer Server

    Note over Msg,Redis: 1️⃣ TRIGGER & BROADCAST
    Msg->>OL: PostgreSQL NOTIFY
    OL->>OL: Fetch events from Outbox
    OL->>Redis: PUBLISH to 'new_message_channel'<br/>(Pub/Sub - broadcast to ALL)

    Note over Redis,DB: 2️⃣ DISPATCHER RECEIVES & ENQUEUES
    Redis-->>Disp: Pub/Sub message received
    Disp->>DB: Find active webhook subscriptions<br/>for this projectId
    DB-->>Disp: Return subscriptions list
    Disp->>Redis: addBulk(jobs) to Queue<br/>(BullMQ - stored as Lists)

    Note over Redis,Ext: 3️⃣ PROCESSOR EXECUTES
    Redis-->>Proc: Worker claims job from Queue
    Proc->>Proc: Sign payload with HMAC-SHA256
    Proc->>Ext: HTTP POST with signature header
    
    alt Success (2xx)
        Ext-->>Proc: 200 OK
        Proc->>DB: Log delivery: SUCCESS
    else Failure
        Ext-->>Proc: Error / Timeout
        Proc->>Redis: Retry with exponential backoff
    end
```

</LayoutDiagram>

<!--
"Đây là luồng chi tiết của Webhook Architecture.

ĐIỂM QUAN TRỌNG: Redis Pub/Sub và BullMQ Queue đều sử dụng CÙNG MỘT Redis Server, nhưng với cơ chế khác nhau:
- Pub/Sub: Broadcast message đến TẤT CẢ subscribers (fire-and-forget)
- BullMQ: Lưu jobs trong Redis dưới dạng Lists, chỉ 1 worker claim mỗi job

BƯỚC 1 - TRIGGER & BROADCAST:
- Khi message được tạo, OutboxListener (chạy trong Worker Server) phát hiện thông qua PostgreSQL NOTIFY
- OutboxListener publish event lên Redis Pub/Sub channel 'new_message_channel'
- Đây là broadcast - mọi Dispatcher trên tất cả servers đều nhận được

BƯỚC 2 - DISPATCHER RECEIVES & ENQUEUES:
- WebhookDispatcher (chạy trong API Server) đã subscribe vào channel từ trước
- Khi nhận message, Dispatcher query database để tìm active subscriptions cho project
- Với mỗi subscription, Dispatcher tạo job và đẩy vào BullMQ Queue
- Queue này được lưu trong Redis, shared cho tất cả servers

BƯỚC 3 - PROCESSOR EXECUTES:
- WebhookProcessor (BullMQ Worker, chạy trong Worker Server) liên tục polling queue
- Khi có job, Worker claim bằng distributed lock - đảm bảo chỉ 1 worker xử lý
- Processor ký payload bằng HMAC-SHA256 và gửi HTTP POST đến Customer Server
- Nếu thành công: log SUCCESS
- Nếu thất bại: retry với exponential backoff (1s, 2s, 4s, 8s, 16s)

Cơ chế này đảm bảo: Reliability (retry), Scalability (distributed workers), Security (HMAC signature)."
-->

---

<LayoutTwoCol title="Webhook Components & Security">

<template #left>

### ⚙️ Components
| Thành phần | Chức năng |
|------------|-----------|
| **Dispatcher** | Lắng nghe Redis → Enqueue jobs |
| **Processor** | HTTP POST + retry + HMAC |
| **Delivery Log** | Theo dõi trạng thái gửi |

</template>

<template #right>

### 🛡️ SSRF Protection
| Bảo vệ | Chi tiết |
|--------|----------|
| **HTTPS only** | Chỉ URL https:// |
| **DNS Validation** | Resolve hostname trước |
| **Block Private IPs** | 127.0.0.0/8, 10.0.0.0/8... |
| **HMAC Signature** | X-Hub-Signature-256 |

</template>

</LayoutTwoCol>

---

<LayoutSection title="Audit Logs">

Security Compliance & Investigation

</LayoutSection>

---

<LayoutTwoCol title="Audit System">

<template #left>

### 📋 Overview
| Đặc điểm | Mô tả |
|----------|-------|
| **Mục đích** | Security compliance |
| **Cơ chế** | Decorator-based Interceptor |
| **Pattern** | Fail-Open |
| **Storage** | PostgreSQL + JSONB |

```typescript
@Auditable({ 
  action: AuditAction.UPDATE, 
  entity: 'Conversation' 
})
@Patch(':id/assign')
async assign(@Body() dto) { ... }
```

</template>

<template #right>

### 🔒 Sensitive Data Redaction

```typescript
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 
  'authorization', 'apikey',
  'creditcard', 'cvv', 'ssn'
];

// Kết quả trong log
{
  "email": "user@example.com",
  "password": "[REDACTED]",
  "token": "[REDACTED]"
}
```

> Matching là **case-insensitive** và **recursive**

</template>

</LayoutTwoCol>

---

<LayoutSection title="Summary">

Tổng kết phần System Architecture

</LayoutSection>

---
transition: slide-up
---

<LayoutTitleContent title="Architecture Recap">

| Chủ đề | Điểm chính |
|--------|-----------|
| **Kiến trúc** | Event-Driven Microservices với NestJS |
| **Multi-tenancy** | Project-based isolation với RBAC |
| **Real-time** | Socket.IO Rooms + EventEmitter2 |
| **Message Flow** | Optimistic UI + Outbox Pattern |
| **External Integration** | Webhooks với SSRF Protection |
| **Compliance** | Audit Logs với Fail-Open + Redaction |

</LayoutTitleContent>