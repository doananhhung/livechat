---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Global Tools Data Model & UI

## Objective

Update the `globalTools` type from `string[]` to `GlobalToolConfig[]` to allow per-tool configuration (enabled + instruction). Create a new UI that replaces the simple checkboxes with expandable tool cards.

## Context

- ./.gtd/workflow-editor-polish/SPEC.md
- ./.gtd/workflow-editor-polish/ROADMAP.md
- packages/shared-types/src/workflow.types.ts (type definition)
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx (Global Tools panel)
- packages/backend/src/ai-responder/services/workflow-engine.service.ts (consumes globalTools)

## Architecture Constraints

- **Single Source:** `WorkflowDefinition.globalTools` in shared-types
- **Invariants:** Each tool config must have `name`, `enabled` (boolean), `instruction` (string)
- **Backward Compatibility:** Backend must handle both old `string[]` and new `GlobalToolConfig[]` during migration
- **Testability:** N/A — UI changes only

## Tasks

<task id="1" type="auto">
  <name>Update shared-types and add GlobalToolConfig interface</name>
  <files>
    - [MODIFY] packages/shared-types/src/workflow.types.ts
  </files>
  <action>
    1. Add new interface:
       ```typescript
       export interface GlobalToolConfig {
         name: string;
         enabled: boolean;
         instruction: string;
       }
       ```
    2. Update WorkflowDefinition:
       ```typescript
       globalTools?: GlobalToolConfig[];
       ```
    3. Export the new interface in the package index
  </action>
  <done>
    - GlobalToolConfig interface exists and is exported
    - WorkflowDefinition.globalTools uses new type
    - TypeScript compiles without errors
  </done>
</task>

<task id="2" type="auto">
  <name>Create GlobalToolsPanel component and integrate into WorkflowEditor</name>
  <files>
    - [NEW] packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx
    - [MODIFY] packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Create GlobalToolsPanel component with:
       - Props: `tools: GlobalToolConfig[]`, `onChange: (tools: GlobalToolConfig[]) => void`
       - For each tool: checkbox (enabled) + textarea (instruction)
       - Use i18n for labels (workflow.globalTools.title, .addVisitorNote, .changeStatus, .instructionPlaceholder)
    2. Update WorkflowEditor:
       - Change `globalTools` state from `string[]` to `GlobalToolConfig[]`
       - Initialize with default config for each tool (enabled: false, instruction: '')
       - Replace inline Global Tools div with GlobalToolsPanel component
       - Update onChange callback signature
    3. Add i18n keys for both locales
  </action>
  <done>
    - GlobalToolsPanel component renders with checkboxes and textareas
    - WorkflowEditor uses GlobalToolConfig[] internally
    - All labels are i18n-ized
    - TypeScript compiles without errors
  </done>
</task>

<task id="3" type="auto">
  <name>Update backend to use new GlobalToolConfig structure</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    1. Update `getNodeContext` method (lines 164-176) to:
       - Check if globalTools is array of objects (new format) or strings (old format)
       - For new format: filter by `enabled === true`, then map to tool definitions
       - Inject tool instructions into system prompt or tool descriptions
    2. Maintain backward compatibility: if globalTools is string[], treat as enabled with no instruction
  </action>
  <done>
    - Backend handles new GlobalToolConfig[] format
    - Backend still works with old string[] format (backward compat)
    - Tool instructions are injected into LLM context
  </done>
</task>

## Success Criteria

- [ ] GlobalToolConfig interface defined in shared-types
- [ ] GlobalToolsPanel component with enable toggle + instruction textarea per tool
- [ ] WorkflowEditor uses new data structure
- [ ] Backend injects instructions into LLM prompts
- [ ] All UI labels are i18n-ized
