# Roadmap

**Spec:** ./.gtd/fix-ai-responder-sync-and-theming/SPEC.md
**Goal:** Fix AI Responder settings synchronization between backend and frontend, implement full light/dark theme support for the workflow editor, and refactor the workflow builder to be an inline component instead of a modal.
**Created:** 2026-01-24

## Must-Haves

- [ ] **Backend Sync**: Update `ProjectService.findAllForUser` to include AI responder fields.
- [ ] **Inline Editor**: Embed `WorkflowEditor.tsx` directly into `AiResponderSettingsForm.tsx`.
- [ ] **Theme Support - Canvas**: Pass `colorMode` to `ReactFlow` based on `useThemeStore`.
- [ ] **Theme Support - Components**: Themed `StartNode`, `ActionNode`, `LlmNode`, `ConditionNode`, and `NodeConfigPanel`.
- [ ] **Data Persistence**: Correct sync of workflow state with project settings form submission.

## Nice-To-Haves

- [ ] **Transitions**: Smooth mode switching transitions.

## Phases

<must-have>

### Phase 1: Backend Data Sync

**Status**: ✅ Complete
**Objective**: Ensure all AI-related project configuration fields are correctly returned by the backend API so the frontend can display the actual state.

### Phase 2: Workflow Editor Theming

**Status**: ✅ Complete
**Objective**: Implement full light/dark mode support for the workflow canvas, custom nodes, and configuration panel using semantic CSS variables.

### Phase 3: Inline Editor Refactor

**Status**: ✅ Complete
**Objective**: Remove the modal-based workflow builder and integrate the `WorkflowEditor` directly into the AI Responder settings form, ensuring seamless data persistence.

</must-have>

<nice-to-have>

### Phase 4: UI Refinement

**Status**: ✅ Complete
**Objective**: Add smooth transitions and polish the UI behavior when switching between AI operation modes.

</nice-to-have>
