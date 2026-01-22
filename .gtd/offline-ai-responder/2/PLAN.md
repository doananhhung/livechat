---
phase: 2
created: 2026-01-22
---

# Plan: Phase 2 - Intelligence Engine (Backend)

## Objective

Connect to Groq via OpenAI SDK and implement the logic to automatically respond to visitor messages when agents are offline.

## Context

- `packages/backend/src/ai-responder/ai-responder.service.ts`: Service to implement.
- `packages/backend/src/gateway/events.gateway.ts`: Emits `visitor.message.received`.
- `packages/backend/src/inbox/events/visitor-message-received.event.ts`: Event definition.
- `packages/backend/.env`: Needs `GROQ_API_KEY`.

## Tasks

<task id="1" type="auto">
  <name>Setup Groq Integration & Env</name>
  <files>
    packages/backend/.env.example
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/package.json
  </files>
  <action>
    1.  Add `GROQ_API_KEY` to `.env.example`.
    2.  Install `openai` package.
    3.  Initialize `OpenAI` client in `AiResponderService` constructor using `ConfigService`.
    4.  Implement private method `generateResponse(messages: any[], systemPrompt: string)` in `AiResponderService`.
  </action>
  <done>
    -   `openai` package installed.
    -   `AiResponderService` has `generateResponse` method that calls Groq.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement AI Response Workflow</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/ai-responder/ai-responder.module.ts
  </files>
  <action>
    1.  Import `TypeOrmModule.forFeature([Conversation, Message, Project])` in `AiResponderModule`.
    2.  Inject repositories and `EventEmitter2` in `AiResponderService`.
    3.  Create `@OnEvent('visitor.message.received') handleVisitorMessage(payload: VisitorMessageReceivedEvent)`.
    4.  Implement logic:
        -   Check `isAiActive(projectId)`.
        -   Fetch last 10 messages of conversation.
        -   Format for Groq (User vs Assistant).
        -   Call `generateResponse`.
        -   Save response to DB (Message entity, `senderId: 'AI_BOT'`, `fromCustomer: false`).
        -   Emit `agent.message.sent` (mocking the event payload so gateway broadcasts it).
        -   Update Conversation `lastMessage`.
  </action>
  <done>
    -   `handleVisitorMessage` exists and is listening.
    -   Workflow implemented: Check -> Generate -> Save -> Emit.
  </done>
</task>

## Success Criteria

- [ ] `GROQ_API_KEY` is supported.
- [ ] AI responds to `visitor.message.received` event when `isAiActive` is true.
- [ ] AI response is saved to DB and broadcast to visitor via WebSocket.
