# Codebase Overview

**Generated:** Saturday, January 24, 2026
**Last Updated:** Saturday, January 24, 2026

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Language** | TypeScript |
| **Runtime** | Node.js |
| **Framework** | NestJS (Express adapter) |
| **Database** | PostgreSQL (via TypeORM) |
| **Caching / PubSub** | Redis (ioredis, cache-manager) |
| **Queues** | BullMQ |
| **Realtime** | Socket.IO (@nestjs/websockets, Redis Adapter) |
| **Auth** | Passport (JWT, OAuth2), 2FA (otplib) |
| **External** | OpenAI, Puppeteer, Nodemailer |

## Project Structure

```
src/
├── actions/            # Action Templates & Form Submissions (Interactive Messages)
├── ai-responder/       # AI-driven automated responses
├── audit-logs/         # Audit logging for security/compliance
├── auth/               # Authentication (JWT, OAuth, 2FA)
├── canned-responses/   # Saved responses for agents
├── common/             # Shared decorators, guards, interceptors, utils
├── database/           # TypeORM config, entities, migrations
├── event-consumer/     # Background worker logic (BullMQ consumer)
├── event-producer/     # Event dispatching logic (BullMQ producer)
├── gateway/            # WebSocket Gateway (Socket.IO)
├── inbox/              # Core Chat Logic (Conversations, Messages)
├── mail/               # Email sending service (Nodemailer)
├── modules/            # (Likely deprecated or specific feature modules)
├── projects/           # Project management & Settings
├── rbac/               # Role-Based Access Control
├── realtime-session/   # Active session tracking (Redis)
├── redis/              # Redis module configuration
├── screenshot/         # URL screenshotting (Puppeteer)
├── users/              # User management
├── visitor-notes/      # Internal notes on visitors
├── visitors/           # Visitor management & Tracking
├── webhooks/           # Webhook dispatching system
├── worker.ts           # Entry point for Background Worker
└── main.ts             # Entry point for API & WebSocket Server
```

## Modules

### Core Domain

#### **Inbox (`src/inbox/`)**
**Type:** Domain
**Purpose:** Manages the core chat experience: conversations, messages, and assignments.
**Key Files:**
- `inbox.controller.ts`: HTTP endpoints for chat history.
- `inbox-event.handler.ts`: Handles internal events affecting chat state.

#### **Auth (`src/auth/`)**
**Type:** Domain
**Purpose:** Handles user authentication, session management, and 2FA.
**Key Files:**
- `auth.service.ts`: Login/Register logic.
- `2fa/`: Two-factor authentication logic.

#### **Projects (`src/projects/`)**
**Type:** Domain
**Purpose:** Multi-tenancy support. Users belong to projects; settings are scoped to projects.
**Key Files:**
- `project.service.ts`: CRUD for projects and member management.

#### **Actions (`src/actions/`)**
**Type:** Domain
**Purpose:** Interactive forms and workflows within chat (e.g., "Send Form", "Submit Data").
**Key Files:**
- `actions.service.ts`: Manages templates and validates submissions against definitions.

### Infrastructure

#### **Gateway (`src/gateway/`)**
**Type:** API / Realtime
**Purpose:** WebSocket entry point for real-time communication.
**Key Files:**
- `events.gateway.ts`: Socket.IO gateway definition.
- `redis-io.adapter.ts`: Redis adapter for horizontal scaling.

#### **Event Consumer (`src/event-consumer/`)**
**Type:** Infrastructure / Worker
**Purpose:** Processes background jobs from BullMQ.
**Key Files:**
- `event-consumer.service.ts`: Routes worker events to handlers (e.g., `NEW_MESSAGE_FROM_VISITOR`).
- `outbox.persistence.service.ts`: Implements the "Outbox Pattern" for reliable event delivery.

#### **Redis (`src/redis/`)**
**Type:** Infrastructure
**Purpose:** Centralized Redis client configuration.

### Support Services

- **AiResponder:** Generates AI replies (OpenAI).
- **Screenshot:** Captures website screenshots using Puppeteer.
- **Mail:** Sends transactional emails.
- **Audit:** Logs critical actions (Interceptor based).
- **Webhooks:** Dispatches events to external URLs.

## Entry Points

| Entry Point | Type | File | Purpose |
| --- | --- | --- | --- |
| **API Server** | HTTP / WS | `src/main.ts` | Serves REST API and WebSockets. |
| **Worker** | Background | `src/worker.ts` | Consumes BullMQ jobs (async tasks). |

## Patterns & Conventions

- **Outbox Pattern:** Events are first written to the DB (`outbox` table) within a transaction, then picked up and published to the queue. (Source: `src/event-consumer/event-consumer.service.ts`)
- **Repository Pattern:** TypeORM repositories are injected into services.
- **Shared DTOs:** DTOs are imported from `@live-chat/shared-dtos` (Monorepo structure).
- **Decorators for Auth:** `@Roles()` and `@Auditable()` are used for RBAC and logging.

## Dependencies (Key)

| Dependency | Purpose |
| --- | --- |
| **BullMQ** | Job queue for background processing (message persistence, emails). |
| **Socket.IO** | Real-time bidirectional communication. |
| **TypeORM** | ORM for PostgreSQL interactions. |
| **Puppeteer** | Headless browser for screenshots. |
| **OpenAI** | LLM integration for AI responses. |

## Open Questions

- **Modules Folder:** `src/modules/workflow` exists but seems isolated. Is it active or legacy?
- **Realtime Session:** How strictly is `src/realtime-session` coupled with `GatewayModule`?
