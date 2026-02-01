# Live Chat System: Team Presentation Plan

## Objective

Deliver a comprehensive technical deep-dive into the Live Chat system. Each member acts as a subject matter expert (SME) for a specific domain.

**Total Documents Covered:** 21 (3 High-Level + 18 Deep Investigation)
**Team Size:** 4 Members

---

## Team Assignments

### Member 1: The System Architect

**Persona:** Focuses on the high-level structure, infrastructure, scalability, external integrations, and security compliance. Sets the stage for the system.

**Responsibilities:**

- Explain the overall system design and microservices approach.
- Detail how the system connects with the outside world (Webhooks).
- Explain the event-driven backbone that powers all other features.
- Cover security auditing and compliance.
- **Academic Requirement:** Explain the SDLC methodology (Agile/Scrum), Tools (Git, Jira), and CI/CD pipeline.

**Assigned Documentation (5):**

1.  [`docs/architecture.md`](docs/architecture.md) - **KEYNOTE**: System components, data flows, and design patterns.
2.  [`docs/getting-started.md`](docs/getting-started.md) - Deployment, Docker setup, and developer experience.
3.  [`docs/deep_investigation/project-event-flow.md`](docs/deep_investigation/project-event-flow.md) - The central nervous system (Event Bus & Socket Rooms).
4.  [`docs/deep_investigation/webhooks-flow.md`](docs/deep_investigation/webhooks-flow.md) - External integration patterns & SSRF protection.
5.  [`docs/deep_investigation/audit-logs-flow.md`](docs/deep_investigation/audit-logs-flow.md) - Security tracking, interceptors, and decorators.

---

### Member 2: The Core Developer

**Persona:** Focuses on identity, authentication, multi-tenancy, and core utility services. Ensures the "business" side of the platform works securely.

**Responsibilities:**

- Deep dive into how we handle users, security, and access control.
- Explain the multi-tenancy model (Projects).
- Detail critical utility services (Mail, Screenshots).
- **Academic Requirement:** Show the Database Schema (ERD) and explain complex entity relationships.

**Assigned Documentation (5):**

1.  [`docs/deep_investigation/user-authentication-flow.md`](docs/deep_investigation/user-authentication-flow.md) - **CORE**: Auth flow, JWTs, OAuth, 2FA.
2.  [`docs/deep_investigation/projects-feature.md`](docs/deep_investigation/projects-feature.md) - Multi-tenancy isolation and role-based access.
3.  [`docs/deep_investigation/user-profile-settings.md`](docs/deep_investigation/user-profile-settings.md) - Self-service account management & secure email changes.
4.  [`docs/deep_investigation/mail-service.md`](docs/deep_investigation/mail-service.md) - Transactional email infrastructure & i18n.
5.  [`docs/deep_investigation/screenshot-service.md`](docs/deep_investigation/screenshot-service.md) - Puppeteer integration & security hardening.

---

### Member 3: The Streaming Engineer

**Persona:** Focuses on the real-time websocket engine. Explains "how it works fast". Owns the message pipeline from visitor to agent.

**Responsibilities:**

- Explain the lifecycle of a WebSocket connection.
- Trace the exact path of a message (Inbound/Outbound).
- Detail how visitor state is managed across page loads.

**Assigned Documentation (5):**

1.  [`docs/deep_investigation/widget_connection_flow.md`](docs/deep_investigation/widget_connection_flow.md) - **CORE**: Handshake, authentication, and connection establishment.
2.  [`docs/deep_investigation/visitor_session_management.md`](docs/deep_investigation/visitor_session_management.md) - State preservation, Redis sessions, and lazy creation.
3.  [`docs/deep_investigation/widget_to_dashboard_message_flow.md`](docs/deep_investigation/widget_to_dashboard_message_flow.md) - Inbound pipeline (Queueing, Persistence).
4.  [`docs/deep_investigation/dashboard_to_widget_message_flow.md`](docs/deep_investigation/dashboard_to_widget_message_flow.md) - Outbound pipeline (Optimistic UI, Ack).
5.  [`docs/deep_investigation/agent-message-broadcast-flow.md`](docs/deep_investigation/agent-message-broadcast-flow.md) - Internal real-time synchronization between agents.

---

### Member 4: The Product Owner

**Persona:** Focuses on features, agent workflow, and user experience. Demos "what the system does" and the value it provides.

**Responsibilities:**

- Showcase the agent workspace and daily operations.
- Explain productivity tools (Canned Responses, Macros).
- Detail team collaboration features.
- **Academic Requirement:** Present the Testing Strategy (Unit, Integration, E2E) and Traceability (Lab 6).

**Assigned Documentation (6):**

1.  [`docs/features/index.md`](docs/features/index.md) - **OVERVIEW**: High-level feature catalog.
2.  [`docs/deep_investigation/inbox-operations.md`](docs/deep_investigation/inbox-operations.md) - Core workflow: Listing, filtering, and status management.
3.  [`docs/deep_investigation/conversation-assignments.md`](docs/deep_investigation/conversation-assignments.md) - Team workload distribution.
4.  [`docs/deep_investigation/actions_template_flow.md`](docs/deep_investigation/actions_template_flow.md) - Advanced custom forms feature.
5.  [`docs/deep_investigation/canned-responses-flow.md`](docs/deep_investigation/canned-responses-flow.md) - Productivity boosters.
6.  [`docs/deep_investigation/visitor-notes-flow.md`](docs/deep_investigation/visitor-notes-flow.md) - CRM-lite capabilities.

---

## Recommended Presentation Flow

1.  **Intro (Architect):** "What are we building?" (Architecture, Tech Stack, & **SDLC Process**)
2.  **Foundation (Core Dev):** "How do we secure & store it?" (Auth, Projects, & **DB Schema**)
3.  **The Engine (Streaming):** "How does it talk?" (Real-time Message Pipelines)
4.  **The Experience (Product):** "How do agents use & test it?" (Features, Workflow, & **Testing Strategy**)
5.  **Closing (Architect):** "How do we monitor & extend it?" (Auditing & Webhooks)
