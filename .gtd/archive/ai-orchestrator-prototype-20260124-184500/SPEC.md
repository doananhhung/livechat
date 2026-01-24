# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Upgrade the AI Responder from a simple chat bot to an "Orchestrator" capable of executing tool-based workflows. The prototype will focus on enabling the AI to automatically add internal notes about visitors based on conversation triggers and providing a user-friendly "If/Then" configuration interface.

## Requirements

### Must Have

- [ ] **AI Function Calling (Backend):**
    - Modify `AiResponderService` and `LLMProvider` interfaces to support tool definitions and tool execution.
    - Implement the first tool: `add_visitor_note(content: string)`.
    - Ensure AI can call tools while still generating a text response to the visitor.
- [ ] **Orchestrator Logic (Backend):**
    - Update `Project` entity to store `aiMode` ('simple' | 'orchestrator') and `aiConfig` (JSON representing the If/Then nodes).
    - Implement an engine that injects relevant "If/Then" instructions into the AI's system prompt or tool instructions.
    - Create an "AI Orchestrator" settings page.
    - Implement a "Node List" where users can add "Trigger -> Action" pairs.
    - Example: "If visitor mentions 'budget' -> Action: Add note 'Discussing finances'".
    - Automation Roadmap: Maintain and update `.gtd/TODOS.md` with the full automation vision.

### Nice to Have

<!-- Removed as per user request -->

### Won't Have

- [ ] Complex drag-and-drop canvas (nodes will be a linear or simple nested list).
- [ ] External API/Webhook tool calling in this prototype.
- [ ] Multi-step state management (AI will evaluate per-message for now).

## Constraints

- **LLM Compatibility:** Groq and OpenAI providers must both be updated to handle function calling schemas.
- **Reliability:** Tool execution must be auditable and failure-resistant.

## Open Questions

- Should the AI be able to call multiple tools in a single turn? (Prototype will target single tool call for simplicity).
- How do we handle AI "hallucinating" tool calls? (Strict JSON validation/Schema enforcement).
