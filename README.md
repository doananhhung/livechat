# Live Chat System

A scalable, real-time customer support chat platform built with **NestJS**, **React**, **PostgreSQL**, and **Redis**.

## 🚀 Quick Start

### 1. Infrastructure

Start PostgreSQL and Redis:

```bash
cd packages/backend
docker-compose up -d
```

### 2. Backend

Install dependencies and run migrations:

```bash
cd packages/backend
npm install
npm run migration:run
```

Start the API and Worker:

```bash
# Terminal 1 - API
npm run start:dev

# Terminal 2 - Worker
npm run start:worker
```

### 3. Frontend

Install dependencies and start the dev server:

```bash
cd packages/frontend
npm install
npm run dev
```

## 📚 Documentation

| Document                                      | Description                                  |
| --------------------------------------------- | -------------------------------------------- |
| [Architecture Overview](docs/architecture.md) | System components, data flows, key patterns  |
| [Getting Started](docs/getting-started.md)    | Setup guide, project structure, common tasks |
| [Feature Index](docs/features/index.md)       | All features with summaries and links        |

### Detailed Investigations

All per-feature technical documentation is in `agent_workspace/*/investigations/`:

| Area          | Key Investigations                                                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**      | [user-authentication-flow.md](docs/user-authentication-flow.md)                                                                                                  |
| **Projects**  | [projects-feature.md](docs/projects-feature.md), [project-event-flow.md](docs/project-event-flow.md)                                                             |
| **Inbox**     | [inbox-operations.md](docs/inbox-operations.md), [conversation-assignments.md](docs/conversation-assignments.md)                                                 |
| **Messaging** | [dashboard_to_widget_message_flow.md](docs/dashboard_to_widget_message_flow.md), [widget_to_dashboard_message_flow.md](docs/widget_to_dashboard_message_flow.md) |
| **Widget**    | [widget_connection_flow.md](docs/widget_connection_flow.md), [visitor_session_management.md](docs/visitor_session_management.md)                                 |
| **Features**  | [actions_template_flow.md](docs/actions_template_flow.md), [canned-responses-flow.md](docs/canned-responses-flow.md), [webhooks-flow.md](docs/webhooks-flow.md)  |

## 🌟 Key Features

- **Multi-Tenancy**: Project-based isolation with RBAC (Manager/Agent)
- **Real-time Messaging**: Socket.IO gateway with Redis adapter
- **Event-Driven**: BullMQ for async processing + Transactional Outbox
- **Security**: 2FA, JWT with refresh rotation, OAuth, SSRF protection
- **Embeddable Widget**: Lightweight Preact widget with Shadow DOM

## 🛠 Tech Stack

- **Backend**: NestJS, TypeORM, BullMQ, Passport, Socket.IO
- **Frontend**: React, Vite, Tailwind CSS, Zustand, TanStack Query
- **Widget**: Preact, Shadow DOM
- **Infrastructure**: PostgreSQL, Redis
