<LayoutTitleContent title="The Streaming Engine">

### ⚡ The Challenge: Speed vs. Reliability

Building a bi-directional pipeline that delivers messages **instantly** (<50ms) while guaranteeing **Zero Data Loss** during traffic bursts.

**Core Architecture:**
- **Inbound**: Async Queues (BullMQ) & Outbox Pattern for durability.
- **Outbound**: Synchronous Redis Session routing for speed.
- **Bridge**: Decoupling Domain Events from WebSocket transport.

</LayoutTitleContent>

---

<LayoutDiagram title="The Handshake: Connection & Auth">

<!--
- **Domain Whitelisting**: `WsAuthService` validates the HTTP `Origin` header.
- **Visitor Identity**: Client-side generated UUID (`visitorUid`).
- **Session**: Stored in Redis (`session:visitor:${uid}`) with a 3-day TTL.
-->

```mermaid
flowchart LR
    A[Widget] -->|1. Connect + Query: projectId| B[Gateway]
    B -->|2. Validate Origin| C{Whitelisted?}
    C -->|No| D[Disconnect]
    C -->|Yes| E[WsAuthService]
    A -->|3. Identify: visitorUid| E
    E -->|4. Store Session| F[(Redis)]
    F -.->|Key: session:visitor:uid| G[SocketID]
```

</LayoutDiagram>

---


<LayoutDiagram title="Lazy Creation Strategy">

```mermaid
flowchart LR
    Visitor[Visitor]
    
    subgraph "Lightweight (Cheap)"
        Visitor -->|Identify| Redis[("Redis Session<br/>(3 Days TTL)")]
    end
    
    subgraph "Heavyweight (Expensive)"
        Visitor -.->|First Message| DB[("Postgres DB<br/>(Conversation)")]
    end
    
    Redis -->|Persist| DB
    style Redis fill:#efffef,stroke:#4caf50
    style DB fill:#fff0f0,stroke:#f44336
```

</LayoutDiagram>

---

<LayoutSection title="Message Pipelines">

Designing for Asymmetric Traffic: <br/> 10,000 Visitors vs 50 Agents

</LayoutSection>
---

<LayoutDiagram title="Inbound Pipeline: High traffic (Async)">

<!--
- **Async Flow**: `InboxEventHandler` -> `BullMQ` -> `EventConsumerService`.
- **Reliability**: Dual Write (DB + Outbox) guarantees zero data loss.
-->

```mermaid
flowchart LR
    Widget -->|Socket| GatewayIn
    GatewayIn -->|Event| Handler["InboxEventHandler"]
    Handler -->|Producer| Queue{BullMQ}
    
    subgraph Worker["EventConsumerService"]
        Queue --> Consumer["Process Job"]
        Consumer -->|Transaction| DB[(DB + Outbox)]
    end
    
    DB -.->|PG Notify| Listener["OutboxListener"]
    Listener -->|Pub| Redis{Redis Pub/Sub}
    Redis -->|Sub| Handler
    Handler -->|Event| GatewayOut
    GatewayOut -->|Emit| Dashboard
```

<div class="absolute bottom-10 left-10 p-4 bg-red-100 dark:bg-red-900 rounded-lg shadow-lg">
  <strong>Challenge:</strong> 10k Concurrent Visitors<br/>
  <strong>Solution:</strong> Queue Buffering (BullMQ)
</div>

</LayoutDiagram>

---

<LayoutDiagram title="Outbound Pipeline: Instant Feedback (Sync)">

<!--
- **Sync Flow**: REST API -> `MessageService`.
- **Routing**: `RealtimeSessionService` looks up Redis for specific socket.
-->

```mermaid
flowchart LR
    subgraph Synchronous["Sync Transaction"]
        API[Controller] --> Service[MessageService]
        Service -->|Persist| DB[(PostgreSQL)]
    end

    Service -->|emit: agent.message.sent| Bus((EventBus))
    
    subgraph Routing["GatewayEventListener"]
        Bus --> Listener[EventHandler]
        Listener -->|Lookup via UID| Sess[(Redis Session)]
    end

    Listener -->|Unicast| Visitor[Visitor Socket]
    Listener -->|Broadcast| Room[Project Room]
```

<div class="absolute bottom-10 left-10 p-4 bg-green-100 dark:bg-green-900 rounded-lg shadow-lg">
  <strong>Challenge:</strong> Agent UX Latency<br/>
  <strong>Solution:</strong> Direct Sync Write
</div>

</LayoutDiagram>

---

<LayoutSection title="The AI Orchestrator">

AI Workflow Engine & Decision Trees

</LayoutSection>

---

<LayoutTitleContent title="The AI Orchestrator">

### Beyond Q&A: Stateful Workflows

We built an engine that allows Agents to design **Decision Trees** that the AI executes statefully.

**Key Capabilities:**
- **LLM-Driven**: All routing nodes (Condition, Switch, Action) are handled by the LLM.
- **Recursive Chaining**: Handling multiple logic steps in a single turn.
- **Scope Isolation**: Condition nodes only see the **last message** to avoid sticky history.

</LayoutTitleContent>

---


<LayoutDiagram title="The Execution Loop">

<!--
1. **Lock**: VisitorLockService ensures sequential processing.
2. **State**: Loaded from `conversation.metadata`.
3. **Think**: LLM receives context. If "Text", it replies. if "Tool/Decision", it executes & recurses.
4. **Recurse**: The loop starts over for the NEXT node immediately.
-->

```mermaid
flowchart TD
    Msg[Visitor Message] --> Lock{Visitor Lock}
    Lock --> Load[Load Workflow State]
    Load --> Engine["Engine.executeStep()"]
    
    Engine -- "requiresLlmDecision: true" --> Brain[LLM Provider]
    
    Brain -- "Tool / Routing" --> Action[Execute & Update State]
    Action --> Recurse[Recursive Call]
    
    Brain -- "Text Response" --> Reply[Send Message & End]
    
    Recurse --> Load
```

</LayoutDiagram>

---


<LayoutDiagram title="Recursive Intelligence">

<!--
**The Power of Recursion**:
If the AI decides to "Route" (e.g., "Yes, refund"), the engine:
1. Updates the State to the new Node.
2. **IMMEDIATELY** re-executes `_processMessage()` (Recursion).
3. The next node (e.g., "Ask for Order ID") runs instantly.

**Condition Node Scope:** Only the LAST user message is sent.
-->

```mermaid
sequenceDiagram
    participant Viewer as Visitor
    participant Engine as Workflow Engine
    participant LLM as LLM

    Viewer->>Engine: "My email is test@gmail.com"
    Engine->>Engine: Load Node: [Condition: Has Email?]
    
    Engine->>LLM: "Does user provide email? Yes/No"
    LLM-->>Engine: ToolCall: route("yes")
    
    Note right of Engine: RECURSIVE CALL 1
    Engine->>Engine: Move to: [Action: Add Note]
    Engine->>LLM: "Use add_visitor_note tool to save user email address"
    LLM-->>Engine: ToolCall: tool("add_visitor_note, params: "user email is....")
    Engine->>Engine: Execute Tool (Side Effect)
    
    Note right of Engine: RECURSIVE CALL 2
    Engine->>Engine: Move to: [LLM: Thanks]
    Engine->>LLM: "Thank user"
    LLM-->>Engine: "Thank you, I saved your email!"
    Engine-->>Viewer: Send Message
```

</LayoutDiagram>

---
transition: slide-up
---


<LayoutTwoCol title="Seamless Integration">
<template #left>

### The Hook
We reuse the existing event pipeline.

1. **Inbound**: Listens to `ai.process.message` (Triggered **after** message persistence).
2. **Outbound**: Emits `agent.message.sent` (Just like a Human Agent).

No race conditions. The AI always sees the full context.
</template>

<template #right>

### System Actor
AI needs to perform actions (Add visistor note, Send Form,...) without being a "Member".

**The Trick**: `SYSTEM_USER_ID`

- A dedicated UUID in the database.
- Bypasses project membership checks in `ActionsService`.
- Ensures Audit Logs show "AI System" as the actor.
</template>
</LayoutTwoCol>
