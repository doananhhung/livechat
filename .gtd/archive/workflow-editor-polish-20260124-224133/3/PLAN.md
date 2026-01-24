---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Node i18n

## Objective

Internationalize all hardcoded English labels in the workflow node components (StartNode, ActionNode, LlmNode, ConditionNode) displayed on the canvas.

## Context

- ./.gtd/workflow-editor-polish/SPEC.md
- ./.gtd/workflow-editor-polish/ROADMAP.md
- packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
- packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
- packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
- packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** i18n keys in en.json/vi.json under `workflow.nodes` namespace
- **Invariants:** All user-visible text on nodes must use translation keys
- **Resilience:** N/A (UI only)
- **Testability:** N/A (UI only)

## Tasks

<task id="1" type="auto">
  <name>Add i18n keys for all node labels</name>
  <files>
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    Add keys under `workflow.nodes` namespace:
    ```json
    "nodes": {
      "start": "Start",
      "startDescription": "Entry Point",
      "action": "Action",
      "actionDescription": "Select Tool",
      "llm": "AI Responder",
      "llmDescription": "Default Prompt",
      "condition": "Router",
      "conditionDescription": "AI Decides Path",
      "handleYes": "Yes",
      "handleNo": "No"
    }
    ```
    Add corresponding Vietnamese translations.
  </action>
  <done>
    - en.json has workflow.nodes namespace with all keys
    - vi.json has Vietnamese translations for all keys
  </done>
</task>

<task id="2" type="auto">
  <name>Update node components to use i18n</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/nodes/StartNode.tsx
    - [MODIFY] packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
    - [MODIFY] packages/frontend/src/components/features/workflow/nodes/LlmNode.tsx
    - [MODIFY] packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
  </files>
  <action>
    1. Import `useTranslation` from react-i18next in each file
    2. Replace hardcoded strings with `t('workflow.nodes.xxx')` calls:
       - StartNode: "Start" → nodes.start, "Entry Point" → nodes.startDescription
       - ActionNode: "Action" → nodes.action, "Select Tool" or tool name display
       - LlmNode: "AI Responder" → nodes.llm, "Default Prompt" → nodes.llmDescription
       - ConditionNode: "Router" → nodes.condition, "AI Decides Path" → nodes.conditionDescription, "Yes"/"No" → handleYes/handleNo
  </action>
  <done>
    - All 4 node components use useTranslation hook
    - No hardcoded English strings remain in node components
    - TypeScript compiles without errors
  </done>
</task>

## Success Criteria

- [ ] All node labels translated (Start, Action, LLM, Condition)
- [ ] All node descriptions translated
- [ ] Yes/No handles on ConditionNode translated
- [ ] TypeScript compiles without errors
