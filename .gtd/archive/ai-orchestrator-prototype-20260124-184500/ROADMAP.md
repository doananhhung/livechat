# Roadmap

**Spec:** ./.gtd/ai-orchestrator-prototype/SPEC.md
**Goal:** Upgrade the AI Responder to an "Orchestrator" capable of executing tool-based workflows (e.g., adding notes) via a node-based configuration.
**Created:** 2026-01-24

## Must-Haves

- [ ] Data model updates (`aiMode`, `aiConfig` in Project entity)
- [ ] AI Function Calling support in Backend (OpenAI/Groq providers)
- [ ] `add_visitor_note` tool implementation
- [ ] Orchestration logic to process tool calls in `AiResponderService`
- [ ] Node-based configuration UI in Frontend

## Nice-To-Haves

- [ ] `change_status` tool support
- [ ] Real-time UI updates for AI-generated notes

## Phases

<must-have>

### Phase 1: AI Capability & Data Model

**Status**: ✅ Complete
**Objective**: Prepare the infrastructure. Update the `Project` entity to support orchestrator settings and modify LLM providers to handle function calling schemas.

### Phase 2: Tool Execution Engine

**Status**: ✅ Complete
**Objective**: Implement the `add_visitor_note` tool and the backend logic to handle tool calls from the AI. The AI should now be able to add notes during conversations.

### Phase 3: Configuration Interface

**Status**: ✅ Complete
**Objective**: Build the "AI Orchestrator" settings page in the frontend, allowing users to define "If/Then" logic pairs for the AI.

</must-have>

<nice-to-have>

<!-- Phase 4 removed as per user request. Project complete. -->

</nice-to-have>
