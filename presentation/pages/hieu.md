<LayoutSection title="Core Developer">

**Member 2: Core Developer**

Authentication, Multi-tenancy, User Management, và Core Utilities

</LayoutSection>

---

<LayoutTwoCol title="Core Developer Overview">

<template #left>

### 🎯 Trách nhiệm chính
**Identity & Security Foundation**

- **Authentication**: JWT (15min) + Refresh (7 days) + 2FA
- **Multi-tenancy**: Project-based isolation với RBAC
- **User Management**: Self-service account operations
- **Core Utilities**: Transactional email + Screenshot service

</template>

<template #right>

### 🔐 Phạm vi công việc

| Lĩnh vực | Chi tiết kỹ thuật |
|----------|-------------------|
| **Authentication** | JWT + OAuth 2.0 + TOTP 2FA |
| **Multi-tenancy** | Row-level security per project |
| **User Management** | Secure email change với double verification |
| **Mail Service** | i18n support (EN/VI) + async queue |
| **Screenshot** | Puppeteer + SSRF protection |

</template>

</LayoutTwoCol>

---

<LayoutSection title="Database Schema (ERD)">

Entity Relationship Diagram - Toàn bộ hệ thống

</LayoutSection>

---

<LayoutDiagram title="Database Schema: Core & Tenancy">

```mermaid
erDiagram
    %% === CHAT CORE & TENANCY ===
    User ||--o{ ProjectMember : "memberships"
    Project ||--o{ ProjectMember : "team"
    Project ||--o{ Visitor : "website_users"
    Project ||--o{ Conversation : "chats"
    Visitor ||--o{ Conversation : "sessions"
    Visitor ||--o{ VisitorNote : "crm_notes"
    User ||--o{ VisitorNote : "authored_notes"
    Conversation ||--o{ Message : "history"
    User }o--o| Conversation : "assignee"

    User { uuid id PK }
    Project { int id PK }
    Visitor { int id PK }
    Conversation { bigint id PK }
    Message { bigint id PK }
    ProjectMember { int id PK }
```

</LayoutDiagram>

---

<LayoutDiagram title="Database Schema: Identity & Extensions">

```mermaid
erDiagram
    %% === IDENTITY & AUTH ===
    User ||--o{ UserIdentity : "oauth"
    User ||--o{ RefreshToken : "sessions"
    User ||--o{ TwoFactorRecoveryCode : "2fa_codes"
    User ||--o{ EmailChangeRequest : "email_changes"

    %% === EXTENSIONS ===
    Project ||--o{ Invitation : "pending_invites"
    User ||--o{ Invitation : "sent_invites"
    Project ||--o{ ActionTemplate : "forms"
    ActionTemplate ||--o{ ActionSubmission : "responses"
    Conversation ||--o{ ActionSubmission : "form_data"
    Project ||--o{ CannedResponse : "quick_replies"
    Project ||--o{ WebhookSubscription : "integrations"
    WebhookSubscription ||--o{ WebhookDelivery : "delivery_log"

    User { uuid id PK }
    Project { int id PK }
    ActionTemplate { int id PK }
```

</LayoutDiagram>


---

<LayoutTwoCol title="Entity Details">

<template #left>

### 🔐 Identity Domain (5 tables)

| Entity | Purpose |
|--------|---------|
| **User** | Agent/Manager accounts |
| **UserIdentity** | OAuth providers (Google) |
| **RefreshToken** | Session management |
| **TwoFactorRecoveryCode** | 2FA backup codes |
| **EmailChangeRequest** | Secure email change flow |

### 🏢 Multi-tenancy Domain (3 tables)

| Entity | Purpose |
|--------|---------|
| **Project** | Workspace isolation unit |
| **ProjectMember** | RBAC pivot table |
| **Invitation** | Pending team invites |

</template>

<template #right>

### 💬 Communication Domain (4 tables)

| Entity | Purpose |
|--------|---------|
| **Visitor** | Website customers |
| **Conversation** | Chat sessions |
| **Message** | Chat history |
| **VisitorNote** | CRM notes |

### ⚙️ Automation Domain (5 tables)

| Entity | Purpose |
|--------|---------|
| **ActionTemplate** | Custom forms |
| **ActionSubmission** | Form responses |
| **CannedResponse** | Quick replies |
| **WebhookSubscription** | External integrations |
| **WebhookDelivery** | Webhook logs |

</template>

</LayoutTwoCol>

---

<LayoutSection title="Authentication Flow">

JWT, OAuth Integration, và Two-Factor Authentication

</LayoutSection>

---

<LayoutDiagram title="Authentication Lifecycle">

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant A as 🔐 AuthService
    participant D as 💾 Database
    participant R as ⚡ Redis

    Note over C,R: PHASE 1: LOGIN
    C->>A: POST /auth/login {email, password}
    A->>D: Validate credentials
    A->>A: Check 2FA requirement
    alt 2FA Required
        A-->>C: 401 {2fa_required: true}
        C->>A: POST /2fa/authenticate {code}
    end
    A->>A: Generate JWT (15min) + Refresh (7 days)
    A->>R: Store refresh token hash
    A-->>C: {accessToken, refreshToken}

    Note over C,R: PHASE 2: API REQUEST
    C->>A: GET /api/* + Bearer JWT
    A->>A: Verify signature & expiry
    A-->>C: 200 OK + Data

    Note over C,R: PHASE 3: TOKEN REFRESH
    C->>A: POST /auth/refresh
    A->>R: Validate & rotate token
    A-->>C: New accessToken
```

</LayoutDiagram>

---

<LayoutTwoCol title="Authentication Components">

<template #left>

### 🔑 Token Strategy

| Token | Lifetime | Storage |
|-------|----------|---------|
| **Access Token** | 15 min | Memory |
| **Refresh Token** | 7 days | Redis + HttpOnly Cookie |
| **2FA Partial** | 5 min | HttpOnly Cookie |

### 🛡️ Guards Pipeline

```
Request → JwtAuthGuard → ProjectGuard → RolesGuard → Controller
```

</template>

<template #right>

### 🌐 OAuth Flow (Google)

1. Redirect to Google consent
2. Callback with authorization code
3. Exchange for Google tokens
4. Create/Link `UserIdentity`
5. Generate app tokens

### 📱 2FA (TOTP)

- **Library**: `otplib`
- **Setup**: QR code + secret
- **Recovery**: 10 backup codes (hashed)

</template>

</LayoutTwoCol>

---

<LayoutSection title="Multi-Tenancy Architecture">

Project-based Data Isolation và Role-Based Access Control

</LayoutSection>

---

<LayoutDiagram title="Multi-Tenancy Model">

```mermaid
flowchart TB
    subgraph Users["👥 USERS"]
        U1["User A"]
        U2["User B"]
    end

    subgraph PM["🔗 PROJECT_MEMBERS (RBAC)"]
        M1["User A → Project 1: MANAGER"]
        M2["User B → Project 1: AGENT"]
        M3["User A → Project 2: AGENT"]
    end

    subgraph Projects["🏢 PROJECTS"]
        P1["Project 1"]
        P2["Project 2"]
    end

    subgraph Data["💾 ISOLATED DATA"]
        D1["Project 1: Conversations, Visitors, Messages"]
        D2["Project 2: Conversations, Visitors, Messages"]
    end

    U1 & U2 --> PM
    PM --> P1 & P2
    P1 -.->|"owns"| D1
    P2 -.->|"owns"| D2
```

</LayoutDiagram>

---

<LayoutTwoCol title="Access Control">

<template #left>

### 🎭 Role Hierarchy

| Role | Permissions |
|------|-------------|
| **MANAGER** | Full project access + settings |
| **AGENT** | Chat operations only |

### 🔒 Isolation Layers

1. **Database**: `WHERE project_id = ?`
2. **Guards**: `ProjectGuard` validates membership
3. **WebSocket**: Rooms `project:{id}`

</template>

<template #right>

### ✅ Permission Matrix

| Action | MANAGER | AGENT |
|--------|:-------:|:-----:|
| View conversations | ✅ | ✅ |
| Reply to visitor | ✅ | ✅ |
| Manage team | ✅ | ❌ |
| Configure webhooks | ✅ | ❌ |
| View audit logs | ✅ | ❌ |

</template>

</LayoutTwoCol>

---

<LayoutSection title="Security Architecture">

Defense in Depth

</LayoutSection>

---

<LayoutDiagram title="Security Layers">

```mermaid
flowchart LR
    Req([🌐 Request]) --> L1
    
    subgraph L1["Layer 1: Authentication"]
        A1[JWT Validation]
        A2[Token Expiry Check]
    end
    
    L1 --> L2
    
    subgraph L2["Layer 2: Authorization"]
        B1[Project Membership]
        B2[Role Verification]
    end
    
    L2 --> L3
    
    subgraph L3["Layer 3: Data Isolation"]
        C1[Row-Level Scoping]
        C2[WebSocket Rooms]
    end
    
    L3 --> End([✅ Execute])
    
    style L1 fill:#e3f2fd,stroke:#1976d2
    style L2 fill:#f3e5f5,stroke:#7b1fa2
    style L3 fill:#e8f5e9,stroke:#388e3c
```

</LayoutDiagram>

---

<LayoutTwoCol title="Core Utilities">

<template #left>

### 📧 Mail Service

**Stack**: Nodemailer + BullMQ

| Email Type | Trigger |
|------------|---------|
| Welcome | Registration |
| Verification | Email change |
| Password Reset | Forgot password |
| Invitation | Team invite |

**I18n**: Templates in EN/VI based on `user.language`

</template>

<template #right>

### 📸 Screenshot Service

**Stack**: Puppeteer (headless Chrome)

**🛡️ SSRF Protection**:
1. HTTPS only
2. DNS resolution before request
3. Block private IPs (`10.x`, `192.168.x`, `127.x`)
4. Block metadata endpoints (AWS/GCP)

**Config**: 1280x720, JPEG 70%, 60s cache

</template>

</LayoutTwoCol>

---
transition: slide-up
---

<LayoutTitleContent title="Summary">

### 🔐 Core Developer Achievements

| Domain | Implementation | Key Metric |
|--------|---------------|------------|
| **Authentication** | JWT + OAuth + 2FA | Access: 15min, Refresh: 7 days |
| **Multi-tenancy** | ProjectMember RBAC | 2 roles (Manager/Agent) |
| **Database** | 17 entities, 4 domains | Full referential integrity |
| **Security** | Defense in Depth | 3-layer guard pipeline |
| **Utilities** | Mail (i18n) + Screenshot (SSRF-safe) | Async processing |

</LayoutTitleContent>