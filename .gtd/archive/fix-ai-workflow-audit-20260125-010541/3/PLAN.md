---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Centralize Tool Definitions

## Objective

Move AI workflow tool names and definitions to `@live-chat/shared-types` as a Single Source of Truth. Eliminates the "Manual Sync" maintenance risk identified in the audit where tool lists were duplicated across backend and frontend.

## Context

- ./.gtd/fix-ai-workflow-audit/SPEC.md
- ./.gtd/fix-ai-workflow-audit/ROADMAP.md
- packages/shared-types/src/workflow.types.ts
- packages/backend/src/ai-responder/services/ai-tool.executor.ts
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx

## Architecture Constraints

- **Single Source:** Tool names/metadata defined in `@live-chat/shared-types`.
- **Invariants:** Frontend and backend MUST import from shared package. No hardcoded tool lists.
- **Resilience:** N/A (static definitions, no runtime failure modes).
- **Testability:** N/A (type-only change).

## Tasks

<task id="1" type="auto">
  <name>Create Shared Tool Definitions</name>
  <files>
    packages/shared-types/src/ai-tools.ts
    packages/shared-types/src/index.ts
  </files>
  <action>
    Create a new file `ai-tools.ts` in shared-types with:
    
    1. Define `AiToolName` enum with values:
       - `ADD_VISITOR_NOTE = "add_visitor_note"`
       - `CHANGE_STATUS = "change_status"`
       - `SEND_FORM = "send_form"`
       - `ROUTE_DECISION = "route_decision"` (internal, used by workflow engine)
    
    2. Define `AVAILABLE_ACTION_TOOLS` array (tools selectable in workflow UI):
       ```
       [AiToolName.ADD_VISITOR_NOTE, AiToolName.CHANGE_STATUS, AiToolName.SEND_FORM]
       ```
    
    3. Define `AI_TOOL_LABEL_KEYS` mapping for frontend i18n:
       ```
       { [AiToolName.ADD_VISITOR_NOTE]: "workflow.globalTools.addVisitorNote", ... }
       ```
    
    4. Export from `index.ts`.
  </action>
  <done>
    - `AiToolName` enum exists in shared-types.
    - `AVAILABLE_ACTION_TOOLS` array exists.
    - Exports available from `@live-chat/shared-types`.
    - `npm run build` in shared-types succeeds.
  </done>
</task>

<task id="2" type="auto">
  <name>Update Backend and Frontend to Use Shared Definitions</name>
  <files>
    packages/backend/src/ai-responder/services/ai-tool.executor.ts
    packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
    packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx
  </files>
  <action>
    1. **ai-tool.executor.ts:**
       - Import `AiToolName` from `@live-chat/shared-types`.
       - Replace hardcoded string `'add_visitor_note'`, `'change_status'`, etc. with `AiToolName.ADD_VISITOR_NOTE`, etc.
       - Keep `ToolDefinition` objects local (they contain runtime logic).
    
    2. **GlobalToolsPanel.tsx:**
       - Import `AVAILABLE_ACTION_TOOLS`, `AiToolName`, `AI_TOOL_LABEL_KEYS` from `@live-chat/shared-types`.
       - Replace local `AVAILABLE_TOOLS` array with mapping over `AVAILABLE_ACTION_TOOLS`.
    
    3. **NodeConfigPanel.tsx:**
       - Import `AVAILABLE_ACTION_TOOLS`, `AiToolName` from `@live-chat/shared-types`.
       - Replace hardcoded `<option>` values with dynamic generation from `AVAILABLE_ACTION_TOOLS`.
       - Update conditional checks (`selectedNode.data.toolName === "send_form"`) to use `AiToolName.SEND_FORM`.
  </action>
  <done>
    - No hardcoded tool name strings remain in the updated files.
    - All tool references use `AiToolName` enum or `AVAILABLE_ACTION_TOOLS`.
    - TypeScript compiles without errors in both packages.
  </done>
</task>

## Success Criteria

- [ ] `AiToolName` enum is defined in `@live-chat/shared-types`.
- [ ] `AVAILABLE_ACTION_TOOLS` array is exported from shared-types.
- [ ] `ai-tool.executor.ts` uses `AiToolName` enum values.
- [ ] `GlobalToolsPanel.tsx` uses shared definitions.
- [ ] `NodeConfigPanel.tsx` uses shared definitions.
- [ ] Both backend and frontend compile without errors.
