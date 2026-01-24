# Roadmap

**Spec:** ./.gtd/ai-workflow-engine/SPEC.md
**Goal:** Transform the AI Responder into a visual, graph-based Workflow Engine capable of navigating complex consulting scenarios.
**Created:** 2026-01-24

## Must-Haves

- [ ] `Workflow` data structure & persistence
- [ ] `WorkflowEngine` logic (State Machine, Node Traversal)
- [ ] `send_form` & `change_status` tools in Backend
- [ ] React Flow-based Visual Editor in Frontend
- [ ] Integration of Engine with `AiResponderService`

## Nice-To-Haves

- [ ] Variable Injection ({{visitor.name}})
- [ ] Global Tools

## Phases

<must-have>

### Phase 1: Engine Core & Toolset

**Status**: ✅ Complete
**Objective**: Build the backend foundation. Define the Workflow schema, implement the execution engine (state machine), and add the missing tools (`send_form`, `change_status`). By the end of this phase, we can manually define a JSON graph and have the AI execute it.

### Phase 2: Visual Editor (Frontend)

**Status**: ✅ Complete
**Objective**: Create the user interface for building workflows. Implement the React Flow canvas, node configuration panels (Start, LLM, Action, Router), and the persistence logic to save the graph to the backend.

### Phase 3: Integration & Testing

**Status**: ✅ Complete
**Objective**: Connect the Frontend Editor to the Backend Engine. Ensure the `AiResponderService` correctly loads the active workflow, persists state between turns, and handles edge cases (invalid graphs, API failures).

</must-have>

<nice-to-have>

### Phase 4: Advanced Features

**Status**: ✅ Complete
**Objective**: Implement variable injection and global tools to make the workflows more dynamic and flexible.

</nice-to-have>
