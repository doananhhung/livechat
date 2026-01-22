# Research: Phase 2

**Status:** Completed
**Date:** 2026-01-22

## Findings

### OpenAI SDK Integration
- **Library:** `openai` npm package works with Groq by changing `baseURL` to `https://api.groq.com/openai/v1` and using the Groq API key.
- **Env Var:** Need `GROQ_API_KEY` in `.env`.
- **Integration:** Initialize `OpenAI` client in `AiResponderService`.

### Conversation History
- **Source:** `MessageService.listByConversation` is designed for API/User context.
- **Direct Access:** For AI, we can use `this.entityManager.find(Message, { where: { conversationId }, order: { createdAt: 'DESC' }, take: 10 })` directly in `AiResponderService` (or a helper in `MessageService` if we want to be clean, but direct access is fine for internal service).
- **Format:** Need to map `Message` entities to OpenAI `chat.completions` format:
    - `fromCustomer: true` -> `role: 'user'`
    - `fromCustomer: false` -> `role: 'assistant'`

### Trigger Logic
- **Event:** `EventsGateway` emits `visitor.message.received` (Event name: `visitor.message.received` class `VisitorMessageReceivedEvent`).
- **Listener:** `AiResponderService` should listen to `visitor.message.received`.
- **Condition:**
    1.  Get Project config (Enabled?)
    2.  Get Online Agent Count (== 0?)
    3.  (Later) Check Visitor Preference (Toggle ON?) - *For now, assume ON or check DB if we add that state later.*
- **Action:**
    1.  Call Groq.
    2.  Create "Agent" message using `MessageService.sendAgentReply` (but we need to act as a system user or special "AI Agent" user).
    3.  *Problem:* `sendAgentReply` requires a `User` entity.
    4.  *Solution:* We might need a special "System Bot" user in the DB, or refactor `sendAgentReply` to accept a `senderType` or allow null `user` if it's a bot.
    5.  *Alternative:* Duplicate logic of `sendAgentReply` but for AI, setting `senderId` to a fixed negative ID or specific UUID for "AI Bot".

### sending the reply
- `MessageService.sendAgentReply` takes `User` object.
- It validates project membership.
- It creates message with `senderId: user.id`.
- **Refactor needed:** We should probably create a `sendAiReply` method in `MessageService` (or `AiResponderService` calling persistence directly) that:
    - Creates message with `senderId: null` or specific "AI" ID.
    - Sets `fromCustomer: false`.
    - Updates conversation last message.
    - Emits `agent.message.sent` (or a new `ai.message.sent` event if frontend needs to distinguish, but `agent.message.sent` might work if we just want it to show up).

## Plan Adjustments
- **Env:** Add `GROQ_API_KEY`.
- **Service:** Update `AiResponderService` to listen to events.
- **Sending:** Implement `sendAiReply` in `AiResponderService` (duplicating some `sendAgentReply` logic to avoid `User` dependency).

