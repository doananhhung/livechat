# Audit Report: Custom Node Components

**Source:** `packages/frontend/src/components/features/workflow/nodes/`

## Logic & compatibility Check

### 1. Handle Generation vs Backend Logic

- **Condition Node:** Uses `id={`${id}-yes`}` and `id={`${id}-no`}` for source handles.
- **Backend Alignment:** `WorkflowEngineService.ts` constructs handle IDs as `` `${currentNode.id}-${handleSuffix}` ``.
- **Verdict:** **Perfect match.** The frontend handles directly map to the backend's expected handle naming convention for `processRouteDecision` ('yes'/'no').

### 2. Data Binding

- **Action/LLM Nodes:** Correctly display data from `data` prop (`toolName`, `prompt`).
- **Condition Node:** Does _not_ display the configured routing prompt on the node itself, only the static description. The data is available in `NodeConfigPanel`, so functionality works, but observability on the canvas is lower than other nodes.

### 3. Prop Usage & Performance

- All nodes use `memo` to prevent unnecessary re-renders.
- Uses `React Flow`'s `NodeProps` correctly.
- Uses semantic theme classes (`bg-card`, `text-card-foreground`) ensuring Dark Mode compatibility.

## Recommendations

- **Improve Condition Node UI:** Display a snippet of the custom routing prompt on the Condition Node (similar to LLM Node) so users don't have to open the config panel to see it.
