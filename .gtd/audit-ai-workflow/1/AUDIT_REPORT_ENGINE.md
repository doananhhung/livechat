# Audit Report: Workflow Engine Service

**Source:** `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

## Execution Logic Check

### 1. Node Type Handlers

- **Consistent Handling:** `start`, `action`, `condition`, `llm` are handled in `executeStep` switch case.
- **Missing Handlers:** `trigger` node type is mentioned in `getNodeContext` (line 209) but does not have a case in `executeStep`. This is an inconsistency. The start node acts as a trigger in the current flow, but if a distinct `trigger` node type exists in definitions, it will hit `default` case and return null, potentially stopping execution silently.

### 2. Null Pointer Risks

- **`nextNodeId` Resolution:** `getNextNodeId` (lines 78-92) returns `null` if no edge is found.
- **`processRouteDecision` Fallback:** If `decision` ("yes"/"no") edge is missing, it falls back to _any_ edge from the node (lines 130-131). This handles the "null pointer" risk but might lead to unexpected logic flow (taking a generic exit when a specific decision was made).

### 3. Logic Gaps

- **Condition/Router Cycle:**
  - `handleConditionNode` correctly sets `requiresRouting: true` and returns `nextNodeId: null`.
  - Loop in `AiResponderService` handles this by calling `processRouteDecision`.
  - **Gap:** `processRouteDecision` only accepts 'yes'/'no'. If the LLM generates a different path (or `route_decision` tool schema allows others), this method hardcodes the `decision` type to `'yes' | 'no'` (line 117). If future conditions need other paths (e.g., "maybe", "refund"), this signature is restrictive.

### 4. Unused Methods/Constants

- **`handleSuffix` in `getNextNodeId`:** This parameter (line 81) is used correctly for condition routing (suffixing handles).
- **No obvious dead code** within this service file itself, but `trigger` type in `getNodeContext` is suspicious.

## Recommendations

- Add explicit case for `trigger` node type in `executeStep` or remove it from `getNodeContext` if it's legacy.
- Update `processRouteDecision` to support dynamic decision strings beyond yes/no if the tool definition allows it.
