# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Fix AI Responder settings synchronization between backend and frontend, implement full light/dark theme support for the workflow editor, and refactor the workflow builder to be an inline component instead of a modal.

## Requirements

### Must Have

- [ ] **Backend Sync**: Update `ProjectService.findAllForUser` in `packages/backend/src/projects/project.service.ts` to include `aiResponderEnabled`, `aiResponderPrompt`, `aiMode`, and `aiConfig` in the returned project objects.
- [ ] **Inline Editor**: Refactor `AiResponderSettingsForm.tsx` to embed `WorkflowEditor.tsx` directly in the form when "Orchestrator" mode is active. Remove `WorkflowBuilderModal.tsx`.
- [ ] **Theme Support - Canvas**: Update `WorkflowEditor.tsx` to subscribe to `useThemeStore` and pass the appropriate `colorMode` to the `ReactFlow` component.
- [ ] **Theme Support - Components**: Refactor all workflow nodes (`StartNode`, `ActionNode`, `LlmNode`, `ConditionNode`) and the `NodeConfigPanel` to use semantic CSS classes (`bg-card`, `text-foreground`, `border-border`) for automatic light/dark mode adaptation.
- [ ] **Data Persistence**: Ensure inline workflow modifications are correctly synchronized with the project settings save action.

### Nice to Have

- [ ] Clean transitions when toggling between "Simple" and "Orchestrator" modes.

### Won't Have

- [ ] New AI capabilities or tools.
- [ ] Changes to graph execution logic.

## Constraints

- **Theming**: Colors must strictly follow the CSS variables defined in `packages/frontend/src/index.css`.
- **I18n**: All user-facing strings must use translation keys via `i18next`.

## Open Questions

- None.
