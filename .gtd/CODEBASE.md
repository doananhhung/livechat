# Codebase Overview

**Generated:** 2026-01-24
**Last Updated:** 2026-01-24

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| **Language**   | TypeScript (Strict)                           |
| **Runtime**    | Node.js                                       |
| **Backend**    | NestJS, BullMQ (Workers), EventEmitter2       |
| **Frontend**   | React (Dashboard), Preact (Widget), Vite      |
| **Database**   | PostgreSQL (TypeORM), Redis (Pub/Sub & Queue) |
| **Real-time**  | Socket.io (Namespaced by projects)            |
| **Validation** | class-validator, class-transformer            |
| **I18n**       | i18next (English & Vietnamese)                |
| **Tools**      | Puppeteer (Screenshots), Nodemailer (SMTP)    |

## Project Structure

```text
.
├── packages/
│   ├── backend/           # NestJS API & Worker (Modular Architecture)
│   ├── frontend/          # Vite-powered Dashboard & Widget
│   ├── shared-dtos/       # 35+ validation-ready DTOs
│   └── shared-types/      # Centralized interfaces & enums
├── docs/                  # Detailed architecture & feature specs
│   └── deep_investigation/# 18 deep-dive investigation documents
├── compose.yaml           # Full-stack Docker development setup
└── tsconfig.base.json     # shared TS compiler configuration
```

## Core Modules

### Backend (packages/backend)

**Type:** Infrastructure | Domain | API
**Architecture:** Modular NestJS with a strong emphasis on reliability and auditability.

- **`auth/`**: Comprehensive system supporting JWT access/refresh rotation, TOTP 2FA, and Google OAuth with automatic account linking.
- **`inbox/`**: Conversation management engine using optimistic updates and cursor-based pagination.
- **`ai-responder/`**: Extensible LLM integration (Groq, OpenAI) that triggers automatically when no agents are online (`agentCount === 0`) for a project.
- **`gateway/`**: Socket.io layer using project-based rooms (`project:{id}`) for multi-tenancy isolation.
- **`database/`**: TypeORM entities and migrations tracking 20+ tables.
- **`audit-logs/`**: Decorator-based system (`@Auditable`) for automatic action logging.
- **`event-consumer/`**: Implementation of the **Transactional Outbox Pattern** for reliable event delivery.

### Frontend (packages/frontend)

**Type:** UI | API Client
**Architecture:** Modular React/Preact with Zustand for lightweight state management.

- **Dashboard**: React-based administration interface for agents.
- **Widget**: Preact-based embeddable chat widget using **Shadow DOM** for CSS isolation and a custom script loader.
- **`services/`**: Feature-split API layer (e.g., `inboxApi.ts`, `authApi.ts`) built on Axios.
- **`stores/`**: Global state management via Zustand (`authStore`, `themeStore`, `typingStore`).
- **`i18n/`**: Localization support for `vi` and `en` (including `docs` namespace).
- **`pages/public/`**: Landing Page and Documentation pages (`HomePage`, `DocsLayout`). (Added: 2026-01-24)
- **`components/features/docs/`**: Documentation-specific UI components (Sidebar, etc.). (Added: 2026-01-24)

## Entry Points

| Entry Point        | Type      | File                                    | Purpose                          |
| ------------------ | --------- | --------------------------------------- | -------------------------------- |
| **Backend API**    | HTTP/WS   | `packages/backend/src/main.ts`          | Main REST & Socket.io server     |
| **Backend Worker** | Worker    | `packages/backend/src/worker.ts`        | BullMQ background job processor  |
| **Admin App**      | UI (Vite) | `packages/frontend/src/main.tsx`        | Primary agent management UI      |
| **Chat Widget**    | UI (Vite) | `packages/frontend/src/widget/main.tsx` | Visitor-facing embeddable widget |

## Key Patterns & Conventions

- **Transactional Outbox**: Ensures DB writes and Socket/Webhook events are atomic (verified in `event-consumer/`).
- **Decorator-based Auditing**: Controllers use `@Auditable` to log business-critical mutations without cluttering logic.
- **Shadow DOM Isolation**: The chat widget encapsulates styles to prevent leakage into the host website.
- **Optimistic UI**: Frontend state (Zustand) updates immediately on message send, syncing via socket events.
- **Multi-Tenancy**: Stringent isolation via `projectId` across DB, Sockets, and Auth Guards.
- **Layout-Based Routing**: Frontend uses distinct layouts (`PublicLayout`, `DocsLayout`, `MainLayout`) to separate public, documentation, and authenticated app contexts.
- **AI Provider Failover**: Uses a circuit-breaker pattern to switch between LLM providers (e.g., Groq to OpenAI) based on health and configured preference.

## Critical Dependencies

- **`bullmq`**: Powering the asynchronous message persistence and webhook system.
- **`socket.io-client`**: Dual usage in both React dashboard and Preact widget.
- **`typeorm`**: Handling complex relations between Projects, Users, Conversations, and Visitors.
- **`puppeteer`**: Used specifically for capturing visitor page snapshots for agent context.
- **`lucide-react`**: Standard icon set used across the Dashboard and Public pages.

## Verified Documentation (docs/)

Refer to the following for deep dives:

- `architecture.md`: Full system mermaid diagrams and data flow.
- `deep_investigation/user-authentication-flow.md`: Security implementation details.
- `deep_investigation/inbox-operations.md`: Real-time state synchronization logic.
