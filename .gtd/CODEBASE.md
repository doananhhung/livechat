# Codebase Overview

**Generated:** 2026-01-24
**Last Updated:** 2026-01-25 (Sync & Time Fix)

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
- **`ai-responder/`**: Extensible LLM integration (Groq, OpenAI) that supports two modes: 'simple' (text-only) and 'orchestrator' (workflow-enabled). Orchestrator mode persists workflow state in `conversation.metadata.workflowState.currentNodeId` and advances through nodes across messages. Support for Action nodes (auto-exec), Condition nodes (binary `route_decision`), and Switch nodes (multi-case `switch_decision`).
- **`gateway/`**: Socket.io layer using project-based rooms (`project:{id}`) for multi-tenancy isolation.
- **`database/`**: TypeORM entities and migrations tracking 20+ tables.
- **`audit-logs/`**: Decorator-based system (`@Auditable`) for automatic action logging.
- **`event-consumer/`**: Implementation of the **Transactional Outbox Pattern** for reliable event delivery.
- **`visitor-notes/`**: Manages internal notes attached to visitors. Supports both human (User) and AI (System/null) authors.

#### Mandatory rules:

- **System User Bypass in Permission-Protected Services:** Services that check project membership (e.g., `ConversationService.updateStatus()`, `ActionsService.sendFormRequest()`) MUST include a bypass for `SYSTEM_USER_ID` when the operation can be triggered by AI tools. Pattern:
  ```typescript
  import { SYSTEM_USER_ID } from "@live-chat/shared-types";
  // ...
  if (userId !== SYSTEM_USER_ID) {
    await this.projectService.validateProjectMembership(projectId, userId);
  }
  ```
  This prevents `ForbiddenException` during AI workflow execution. **Evidence:** `conversation.service.ts:203-209`, `actions.service.ts:301-310`.

### Frontend (packages/frontend)

**Type:** UI | API Client
**Architecture:** Modular React/Preact with Zustand for lightweight state management.

#### Mandatory rules:

- All display text must be follow the i18n structure.
- All display Component must support current like, dark theme logic.
- **Theme Support:** Use semantic color classes (e.g., `bg-background`, `text-foreground`, `bg-card`) which automatically adapt to light/dark mode via CSS variables defined in `packages/frontend/src/index.css`. Explicit `.theme-light` and `.theme-dark` classes mirror `:root` and `.dark` respectively for programmatic theme application. (Updated: 2026-01-25)

- **Dashboard**: React-based administration interface for agents.
- **Widget**: Preact-based embeddable chat widget using **Shadow DOM** for CSS isolation and a custom script loader.
- **`services/`**: Feature-split API layer (e.g., `inboxApi.ts`, `authApi.ts`) built on Axios.
- **`stores/`**: Global state management via Zustand (`authStore`, `themeStore`, `typingStore`).
- **`i18n/`**: Localization support for `vi` and `en` (including `docs` namespace).
- **`pages/public/`**: Landing Page and Documentation pages (`HomePage`, `DocsLayout`). (Added: 2026-01-24)
- **`components/features/docs/`**: Documentation-specific UI components (Sidebar, etc.). (Added: 2026-01-24)
- **`components/features/projects/ai-responder/`**: Unified configuration UI for AI modes and inline workflow editing.
- **`components/features/workflow/`**: Inline Workflow Editor using **React Flow** (@xyflow/react) for configuring AI logic graphs. Includes `GlobalToolsPanel`, i18n-ready node components (Start, Action, Condition, Switch), and configuration panels with case reordering support. (Updated: 2026-01-25)

## Entry Points

| Entry Point        | Type      | File                                    | Purpose                          |
| ------------------ | --------- | --------------------------------------- | -------------------------------- |
| **Backend API**    | HTTP/WS   | `packages/backend/src/main.ts`          | Main REST & Socket.io server     |
| **Backend Worker** | Worker    | `packages/backend/src/worker.ts`        | BullMQ background job processor  |
| **Admin App**      | UI (Vite) | `packages/frontend/src/main.tsx`        | Primary agent management UI      |
| **Chat Widget**    | UI (Vite) | `packages/frontend/src/widget/main.tsx` | Visitor-facing embeddable widget |

## Key Patterns & Conventions

- **React Query Key Consistency**: Optimistic updates (e.g., via Sockets) MUST use the exact same query key structure as the fetch hook. This includes optional arguments which become `undefined` in the key array (e.g., `['messages', id, undefined]`). Mismatches cause silent sync failures. (Verified: 2026-01-25)
- **Time Display Semantics**: Use `conversation.lastMessageTimestamp` for displaying "Last Message Time". Do NOT use `conversation.updatedAt`, which tracks internal modifications (read status, assignee, etc.) and causes "Time Ago" drift. (Verified: 2026-01-25)
- **Transactional Outbox**: Ensures DB writes and Socket/Webhook events are atomic (verified in `event-consumer/`).
- **Decorator-based Auditing**: Controllers use `@Auditable` to log business-critical mutations without cluttering logic.
- **Shadow DOM Isolation**: The chat widget encapsulates styles to prevent leakage into the host website.
- **Optimistic UI**: Frontend state (Zustand) updates immediately on message send, syncing via socket events.
- **Multi-Tenancy**: Stringent isolation via `projectId` across DB, Sockets, and Auth Guards.
- **Layout-Based Routing**: Frontend uses distinct layouts (`PublicLayout`, `DocsLayout`, `MainLayout`) to separate public, documentation, and authenticated app contexts.
- **AI Provider Failover**: Uses a circuit-breaker pattern to switch between LLM providers (e.g., Groq to OpenAI) based on health and configured preference.
- **AI Tool Orchestration**: Uses a multi-turn loop (max 3 turns) to execute tools (like `add_visitor_note`) and feed results back to the LLM for a final text response.
- **AI Workflow Engine**: Graph-based state machine (`WorkflowEngineService`) driving AI logic via a persisted `WorkflowDefinition` (Start, Action, LLM, Condition nodes). Key behaviors: (Updated: 2026-01-24)
  - **State Persistence:** `conversation.metadata.workflowState.currentNodeId` tracks position across messages
  - **Action Auto-Execution:** Action nodes execute in a loop until an LLM or Condition node is reached
  - **Condition Routing:** Condition nodes inject `route_decision` tool; LLM calls `{path: "yes"|"no"}` for path selection via `processRouteDecision()`
  - **Switch Routing:** Switch nodes inject dynamic `switch_decision` tool constrained to valid case names; LLM selects case for routing via `processSwitchDecision()` (Updated: 2026-01-25)
  - **Recursive Chaining:** After condition routing, handler re-invokes to immediately process the next node
  - **Terminal Detection:** Nodes with no outgoing edges set `currentNodeId: null` and restart workflow on next message
  - **Validation Integrity:** All node types MUST have a corresponding Zod schema in `workflow.schemas.ts` and be registered in `WorkflowNodeSchema` to prevent runtime crashes.
- **Inline Logic Editor**: Complex graph structures (Workflow) are integrated directly into standard settings forms, sharing a single submission flow.
- **Theme-Aware Canvas**: Visual editors (React Flow) must explicitly subscribe to `useThemeStore` and pass `colorMode` to synchronize the canvas with the application theme.
- **System User for AI Actions**: A dedicated System user (`SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'`) exists in the database for auditable AI-driven mutations. When adding new AI tools in `AiToolExecutor` that call permission-protected services:
  1. Import `SYSTEM_USER_ID` from `@live-chat/shared-types`
  2. Pass `SYSTEM_USER_ID` as the `userId` parameter
  3. Update the target service to bypass membership check for this ID (see Backend Mandatory Rules)
     **Evidence:** `ai-tool.executor.ts:9,147-150`, `system-actor.ts:8`.
- **Global Tool Instructions**: Each global tool can have a custom instruction injected into the LLM system prompt via `GlobalToolConfig.instruction`.

## Critical Dependencies

- **`bullmq`**: Powering the asynchronous message persistence and webhook system.
- **`socket.io-client`**: Dual usage in both React dashboard and Preact widget.
- **`typeorm`**: Handling complex relations between Projects, Users, Conversations, and Visitors.
- **`puppeteer`**: Used specifically for capturing visitor page snapshots for agent context.
- **`lucide-react`**: Standard icon set used across the Dashboard and Public pages.
- **`openai`**: SDK used for interacting with both OpenAI and Groq (via baseURL) for LLM capabilities.
- **`@xyflow/react`**: React Flow library used for the visual workflow builder.
- **`tailwindcss-animate`**: Standard utility for enter/exit animations in dynamic UI sections.

## Verified Documentation (docs/)

Refer to the following for deep dives:

- `architecture.md`: Full system mermaid diagrams and data flow.
- `deep_investigation/user-authentication-flow.md`: Security implementation details.
- `deep_investigation/inbox-operations.md`: Real-time state synchronization logic.
