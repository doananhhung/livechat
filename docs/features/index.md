# Feature Documentation Index

> This document provides summaries of all features. For detailed implementation, see the linked investigations.

## Core Features

### Authentication & Authorization

Complete authentication system with registration, email verification, login, 2FA, and OAuth (Google).

| Component    | Purpose                           |
| ------------ | --------------------------------- |
| JwtAuthGuard | Validates access tokens           |
| RolesGuard   | Enforces project-level RBAC       |
| TokenService | JWT generation + refresh rotation |

**Investigation:** [user-authentication-flow.md](../deep_investigation/user-authentication-flow.md)

---

### Projects (Multi-Tenancy)

Projects are the root isolation unit. All data is scoped by `projectId`. Supports MANAGER and AGENT roles.

| Component      | Purpose                      |
| -------------- | ---------------------------- |
| ProjectService | CRUD + membership validation |
| ProjectMember  | Role-based access control    |

**Investigations:** [projects-feature.md](../deep_investigation/projects-feature.md) | [project-event-flow.md](../deep_investigation/project-event-flow.md)

---

### Inbox & Conversations

Agent-facing conversation management with listing, filtering, status updates, and assignments.

| Component           | Purpose                     |
| ------------------- | --------------------------- |
| ConversationService | CRUD + status management    |
| MessageService      | Message creation + delivery |

**Investigations:** [inbox-operations.md](../deep_investigation/inbox-operations.md) | [conversation-assignments.md](../deep_investigation/conversation-assignments.md)

---

### Real-time Messaging

Bidirectional messaging between agents (dashboard) and visitors (widget).

| Flow            | Description                                    |
| --------------- | ---------------------------------------------- |
| Agent → Visitor | REST API → Redis lookup → Socket emit          |
| Visitor → Agent | Socket → BullMQ → Outbox → Pub/Sub → Broadcast |

**Investigations:** [dashboard_to_widget_message_flow.md](../deep_investigation/dashboard_to_widget_message_flow.md) | [widget_to_dashboard_message_flow.md](../deep_investigation/widget_to_dashboard_message_flow.md)

---

### Embeddable Widget

Lightweight Preact-based chat widget with domain whitelisting and session persistence.

| Component     | Purpose                              |
| ------------- | ------------------------------------ |
| socketService | Socket.IO client + event handlers    |
| WsAuthService | Domain validation + session creation |

**Investigations:** [widget_connection_flow.md](../deep_investigation/widget_connection_flow.md) | [visitor_session_management.md](../deep_investigation/visitor_session_management.md)

---

## Additional Features

### Actions & Smart Forms

Manager-defined form templates that agents can send to visitors during chat.

**Investigation:** [actions_template_flow.md](../deep_investigation/actions_template_flow.md)

---

### Canned Responses

Pre-defined text snippets for quick agent replies. Managers create, agents use.

**Investigation:** [canned-responses-flow.md](../deep_investigation/canned-responses-flow.md)

---

### Visitor Notes

Private notes attached to visitors, visible to all project agents.

**Investigation:** [visitor-notes-flow.md](../deep_investigation/visitor-notes-flow.md)

---

### User Profile & Settings

Self-service account management including email change with token verification.

**Investigation:** [user-profile-settings.md](../deep_investigation/user-profile-settings.md)

---

## Infrastructure Features

### Audit Logging

Automatic audit trail via `@Auditable` decorator. Fail-open strategy ensures main flow never blocks.

**Investigation:** [audit-logs-flow.md](../deep_investigation/audit-logs-flow.md)

---

### Mail Service

Transactional email delivery for verification, password reset, invitations. Supports EN/VI i18n.

**Investigation:** [mail-service.md](../deep_investigation/mail-service.md)

---

### Screenshot Service

URL-to-image capture with comprehensive SSRF protection (IP blocking, DNS rebinding prevention).

**Investigation:** [screenshot-service.md](../deep_investigation/screenshot-service.md)

---

### Webhooks

Event subscriptions with HTTP delivery, HMAC signatures, and automatic retries.

**Investigation:** [webhooks-flow.md](../deep_investigation/webhooks-flow.md)
