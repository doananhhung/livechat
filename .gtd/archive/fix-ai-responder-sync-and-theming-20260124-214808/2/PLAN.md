---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Workflow Editor Theming

## Objective

Implement full light/dark mode support for the visual workflow editor components. This involves updating the `WorkflowEditor` canvas to react to theme changes and refactoring custom nodes and panels to use semantic Tailwind classes.

## Context

- ./.gtd/fix-ai-responder-sync-and-theming/SPEC.md
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
- packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
- packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
- packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/stores/themeStore.ts

## Architecture Constraints

- **Single Source:** Theme state must be read from `useThemeStore`.
- **Invariants:** Components must use semantic CSS classes (e.g., `bg-card`, `text-foreground`, `border-border`) to ensure automatic theme switching.
- **Library Compatibility:** `@xyflow/react`'s `colorMode` prop should be synchronized with the app's theme.

## Tasks

<task id="1" type="auto">
  <name>Theme Workflow Canvas</name>
  <files>
    packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
  </files>
  <action>
    1. Import `useThemeStore` in `WorkflowEditor.tsx`.
    2. Determine `colorMode` for `ReactFlow` ('light' | 'dark'). Note: if app theme is 'system', calculate the actual mode.
    3. Pass `colorMode` to the `ReactFlow` component.
    4. Update the container `div` to use semantic background classes if necessary.
  </action>
  <done>
    - `WorkflowEditor` reacts to theme changes.
    - `ReactFlow` receives correct `colorMode`.
  </done>
</task>

<task id="2" type="auto">
  <name>Theme Custom Nodes & Config Panel</name>
  <files>
    packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
    packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
    packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
    packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
  </files>
  <action>
    1. Refactor `StartNode`, `ActionNode`, `LlmNode`, and `ConditionNode`:
       - Replace `bg-white` with `bg-card`.
       - Replace `text-gray-500` or similar with `text-muted-foreground`.
       - Ensure `text-foreground` is used for main labels.
       - Use `border-border` where applicable.
    2. Refactor `NodeConfigPanel`:
       - Replace `bg-white` with `bg-card`.
       - Replace `bg-gray-50` with `bg-muted/50`.
       - Replace hardcoded text colors with semantic counterparts.
       - Use `border-border` for the side panel container.
  </action>
  <done>
    - All custom workflow components look correct in both light and dark modes.
    - Hardcoded `bg-white` and `text-gray-*` are removed.
  </done>
</task>

## Success Criteria

- [ ] `WorkflowEditor` canvas background and controls adapt to theme.
- [ ] All custom nodes (`Start`, `Action`, `LLM`, `Router`) adapt to theme.
- [ ] `NodeConfigPanel` adapts to theme.
- [ ] No hardcoded colors that break in dark mode remain in these components.
