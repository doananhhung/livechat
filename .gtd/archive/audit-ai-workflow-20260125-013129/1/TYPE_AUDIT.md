# Type Safety Audit: AI Workflow Engine

**Date:** 2026-01-25
**Scope:** `WorkflowEngineService` and `Shared Types`

## Findings

### 1. `WorkflowNode.data` Typing
-   **Definition:** `Record<string, unknown>` in `workflow.types.ts`.
-   **Usage:** `WorkflowEngineService` performs loose casting without runtime validation.
    -   `const toolName = node.data.toolName as string | undefined;`
    -   `const routingPrompt = (node.data.prompt as string) || ...`
-   **Risk:** If the frontend sends malformed data (e.g. `toolName` is a number), the runtime might crash or behave unexpectedly.
-   **Recommendation:** Introduce Zod schemas or type guards to validate `node.data` based on `node.type`.

### 2. Backward Compatibility
-   `getNodeContext` logic handles both `GlobalToolConfig[]` (new object format) and `string[]` (old format).
-   This defensive coding is good, but indicates technical debt in the data model.

### 3. Tool Argument Safety
-   `handleActionNode` stringifies `toolArgs` blindly: `JSON.stringify(toolArgs)`.
-   If `toolArgs` is missing or malformed, the tool execution might fail inside `AiToolExecutor`.
-   **Risk:** No validation that `toolArgs` matches the schema required by `toolName`.

### 4. Route Decision Safety
-   `processRouteDecision` strictly checks for `yes` / `no`.
-   It includes a fallback mechanism: `workflow.edges.find((e) => e.source === node.id)`.
-   This is robust against LLM hallucinations (returning "maybe" instead of "yes/no").

## Score: B-
The typing is adequate for a prototype but lacks the strict runtime validation required for a production reliability engineer.
