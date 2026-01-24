# Specification

**Status:** UPDATED
**Last Updated:** 2026-01-24

## Goal

Transform the AI Responder into a powerful **AI Workflow Engine**. This system allows admins to visually define consulting workflows (using nodes and edges) that guide the AI's behavior. The AI acts as an autonomous agent within this structure, capable of making decisions, executing tools (Sending Forms, Changing Status), and navigating complex multi-step interactions.

## Requirements

### Must Have

- [ ] **Visual Workflow Builder (Frontend):**
    - Implement a node-based editor using `React Flow`.
    - Nodes:
        - **Start Node:** Entry point.
        - **LLM Node:** AI generates text or calls tools based on specific instructions for this step.
        - **Tool Node:** System executes a specific action (e.g., "Send Form #123").
        - **Condition/Router Node:** AI classifies intent to branch to different paths.
    - Save/Load workflow configuration as JSON in `Project` entity (replacing simple `aiConfig`).

- [ ] **Expanded Toolset (Backend):**
    - **`change_status`**: Update conversation status (Open/Pending/Solved).
    - **`send_form`**: Trigger the existing `ActionsService` to send a specific form template.
    - **`add_visitor_note`**: (Existing) Ensure it works within the workflow context.

- [ ] **Workflow Engine (Backend):**
    - State Machine: Track which "Node" a conversation is currently in.
    - Execution Logic:
        - If **Action Node**: Execute immediately, move to next.
        - If **LLM Node**: Inject node-specific prompts/tools into `AiResponderService`.
    - Persistence: Store `workflowState` (currentNodeId, variables) in `Conversation` or Redis.

### Nice to Have

- [ ] **Variable Injection:** Allow nodes to reference previous step outputs (e.g., "Hello {{visitor.name}}").
- [ ] **Global Tools:** Tools available at *any* step (e.g., "Always allow adding a note").

### Won't Have

- [ ] **AI Form Filling:** The AI will NOT fill or submit forms on behalf of the visitor (safety constraint).
- [ ] Complex coding logic inside nodes (Python/JS execution) - sticking to pre-defined tools.
- [ ] Multi-graph management (One active workflow per project for now).

## Constraints

- **Compatibility:** Must degrade gracefully if the graph is invalid (fallback to simple prompt).
- **Performance:** State transitions must be fast; graph traversal shouldn't block the chat significantly.

## Open Questions

- **State Persistence:** Should the workflow state persist across sessions (days)? *Assumption: Yes, stored in DB/Redis linked to Conversation.*
- **LLM Context:** Does the AI see the *entire* history, or just context since the workflow started? *Assumption: Entire history + specific node instructions.*