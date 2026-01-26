---
transition: slide-up
---

<LayoutDiagram title="System Architecture Overview">

```mermaid
flowchart LR
 subgraph Frontend["Frontend (React)"]
        Dashboard["Agent Dashboard"]
        Widget["Embeddable Widget (Preact)"]
  end
 subgraph Gateway["WebSocket Layer"]
        SIO["Socket.IO Gateway"]
        Rooms["Project Rooms"]
  end
 subgraph Backend["Backend (NestJS)"]
        API["REST Controllers"]
        Services["Domain Services"]
        Guards["Auth Guards + RBAC"]
        Decorators["@Auditable Interceptor"]
  end
 subgraph Workers["Background Processing"]
        BullMQ["BullMQ Consumer"]
        Outbox["Outbox Listener"]
        Webhooks["Webhook Processor"]
  end
 subgraph Infrastructure["Infrastructure"]
        PG[("PostgreSQL")]
        Redis[("Redis")]
        SMTP["SMTP Server"]
  end
    Dashboard --> API
    Dashboard <--> SIO
    Widget <--> SIO
    API --> Guards
    Guards --> Services
    Services --> Decorators & PG & Redis & SMTP
    SIO --> Rooms
    Services -. emit .-> SIO
    Services -- enqueue --> BullMQ
    BullMQ --> PG & Outbox
    Outbox -- NOTIFY --> Redis
    Redis -- Pub/Sub --> Webhooks
```

</LayoutDiagram>

---

<LayoutTitleContent title="Product Features & Workflow">

<!--
Presenter: Member 4 (Product Owner)
-->

- **Agent Workspace**: Daily operations
- **Productivity**: Canned responses, Macros
- **Collaboration**: Assignments and Notes

</LayoutTitleContent>
