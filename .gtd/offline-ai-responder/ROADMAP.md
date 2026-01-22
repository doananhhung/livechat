# Roadmap

**Spec:** ./.gtd/offline-ai-responder/SPEC.md
**Goal:** Implement Groq-powered AI auto-responder for offline hours.
**Created:** 2026-01-22

## Must-Haves

- [ ] Agent Presence Logic
- [ ] Groq/OpenAI Integration
- [ ] Conversation Context
- [ ] PM Configuration (API & UI)
- [ ] Visitor Toggle UI
- [ ] Trigger Mechanism
- [ ] Visual Differentiation

## Nice-To-Haves

- [ ] Typing Indicators
- [ ] Intent Detection

## Phases

### Phase 1: Foundation & Detection (Backend)

**Status**: ✅ Complete
**Objective**: Establish the configuration schema and the logic to detect when human agents are offline.

- [ ] **Agent Presence Service**: Implement logic to track and check if agents are currently online (WebSocket connection/Status).
- [ ] **Configuration Schema**: Create DB migrations and API endpoints for PMs to configure AI settings (enabled/disabled, system prompt).
- [ ] **Service Skeleton**: Setup the basic `AiResponderService` structure in `packages/backend`.

### Phase 2: Intelligence Engine (Backend)

**Status**: ✅ Complete
**Objective**: Connect to Groq and implement the auto-response trigger logic with context.

- [ ] **Groq Integration**: Implement the service to send prompts to Groq via OpenAI SDK.
- [ ] **Context Injection**: Fetch recent conversation history and format it for the LLM.
- [ ] **Trigger Logic**: Hook into the message pipeline to invoke the AI when (No Agents) AND (AI Enabled) AND (Visitor Opt-in).
- [ ] **Intent Detection**: (Nice to have) Add system prompt logic to handle "talk to human" requests.

### Phase 3: User Experience (Frontend)

**Status**: ✅ Complete
**Objective**: Build the user-facing controls for Visitors and Project Managers.

- [ ] **PM Config UI**: Build the settings page in the Dashboard for enabling AI and editing prompts.
- [ ] **Visitor Toggle**: Update the Chat Widget to show AI status and allow visitors to "Turn Off AI / Wait for Human".
- [ ] **Visual Differentiation**: Style AI messages distinctly (e.g., Robot avatar, "AI" label).
- [ ] **Typing Indicators**: (Nice to have) Simulate typing events while the AI is generating.
