---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Condition Node Configuration & Routing

## Objective

Add prompt configuration to the Condition (Router) node UI and implement backend routing logic so the AI can decide between Yes/No paths based on a configurable prompt.

## Context

- ./.gtd/workflow-editor-polish/SPEC.md
- ./.gtd/workflow-editor-polish/ROADMAP.md
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/backend/src/ai-responder/ai-responder.service.ts

## Architecture Constraints

- **Single Source:** Condition node prompt stored in `node.data.prompt`
- **Invariants:** Routing must choose exactly one path (Yes or No). If LLM fails to decide, default to first available edge.
- **Resilience:** If LLM returns unexpected output, log warning and use default path
- **Routing Mechanism:** Use a dedicated `route_decision` tool that the LLM calls with its choice

## Tasks

<task id="1" type="auto">
  <name>Add prompt configuration to Condition node in NodeConfigPanel</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. In NodeConfigPanel, find the condition node section (currently just shows description)
    2. Add a prompt textarea similar to LLM node:
       - Label: "Routing Prompt" (i18n key: workflow.configPanel.routingPromptLabel)
       - Placeholder: "Describe how the AI should decide between Yes/No paths" (i18n key)
       - Store in node.data.prompt
    3. Keep existing description text as a helper above the textarea
    4. Add i18n keys for both locales
  </action>
  <done>
    - Condition node section in NodeConfigPanel has a textarea for prompt
    - Editing textarea updates node.data.prompt
    - All labels are i18n-ized
  </done>
</task>

<task id="2" type="auto">
  <name>Implement condition node routing in backend</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/services/workflow-engine.service.ts
    - [MODIFY] packages/backend/src/ai-responder/services/ai-tool.executor.ts
  </files>
  <action>
    1. In ai-tool.executor.ts, add a ROUTE_DECISION_TOOL:
       ```typescript
       const ROUTE_DECISION_TOOL: ToolDefinition = {
         type: 'function',
         function: {
           name: 'route_decision',
           description: 'Decide which path to take in the workflow',
           parameters: {
             type: 'object',
             properties: {
               path: {
                 type: 'string',
                 enum: ['yes', 'no'],
                 description: 'The path to take based on the routing prompt'
               }
             },
             required: ['path']
           }
         }
       };
       ```
    2. Add getRoutingTool() method that returns this tool
    3. In workflow-engine.service.ts:
       - Add handleConditionNode() method
       - Method should return: { nextNodeId: null, output: null, requiresRouting: true, routingPrompt: node.data.prompt }
       - The caller (AiResponderService) will use this to ask LLM with the routing tool
    4. Add processRouteDecision(node, workflow, decision: 'yes' | 'no') method:
       - Find edge where sourceHandle matches `${node.id}-yes` or `${node.id}-no`
       - Return the target node ID
  </action>
  <done>
    - ROUTE_DECISION_TOOL defined in ai-tool.executor.ts
    - handleConditionNode returns routing requirement
    - processRouteDecision finds correct edge based on decision
    - TypeScript compiles without errors
  </done>
</task>

## Success Criteria

- [ ] Condition node has configurable prompt field in UI
- [ ] Backend returns routing requirement for condition nodes
- [ ] Route decision tool defined for LLM to call
- [ ] processRouteDecision correctly maps decision to edge target
- [ ] All UI labels i18n-ized
