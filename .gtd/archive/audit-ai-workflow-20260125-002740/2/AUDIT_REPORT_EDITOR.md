# Audit Report: Workflow Editor & Config Panels

**Source:** `packages/frontend/src/components/features/workflow/`

## Configuration Alignment Check

### 1. Node Types

- **Frontend Types:** `start`, `action`, `llm`, `condition`.
- **Backend Types:** `start`, `action`, `llm`, `condition`.
- **Alignment:** Excellent. The backend's unused `trigger` type mention is not present in frontend, confirming it's likely dead code on backend or legacy.

### 2. Tool Hardcoding Risk

- **Action Node Tools:** `NodeConfigPanel.tsx` (lines 66-82) hardcodes `send_form`, `change_status`, `add_visitor_note`.
- **Global Tools:** `GlobalToolsPanel.tsx` (lines 6-10) hardcodes the same list.
- **Risk:** If a new tool is added to backend `AiToolExecutor`, it won't appear here automatically. This "Manual Sync" pattern is brittle.
- **Inconsistency:** `Action` node allows configuring specific args (e.g., `templateId` for `send_form`), while `GlobalToolsPanel` only allows enabling/disabling and adding instructions. This is correct design (Global = automatic use by LLM, Action = forced execution), but the list of available tools is duplicated.

### 3. Theme Integration

- **Correctness:** `WorkflowEditor.tsx` correctly retrieves `theme` from `useThemeStore` and passes it to `<ReactFlow colorMode={theme} />` (line 176). This ensures canvas matches application mode.

### 4. Unused Props/State

- No significant unused props found in `NodeConfigPanel`.
- `WorkflowEditor` has duplication of `initialNodes` logic (lines 62-74) to provide a default Start node. This is safe.

## Recommendations

- **Centralize Tool Definitions:** Move the `AVAILABLE_TOOLS` list to a shared constant file (`@live-chat/shared-types` or `shared-constants`) so both frontend panels and backend validation usage stay in sync.
- **Dynamic Tool Loading:** Ideally, fetch available tools from a backend endpoint (`/api/ai/tools`) to populate the dropdowns dynamically.
