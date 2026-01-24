---
phase: 3
created: 2026-01-24
---

# Plan: Phase 3 - Condition Routing & Action Execution

## Objective

Handle the `requiresRouting` flag by injecting the `route_decision` tool for Condition nodes and processing the LLM's path choice. Also auto-execute Action nodes without waiting for user input.

## Context

- ./.gtd/workflow-orchestrator-integration/SPEC.md
- ./.gtd/workflow-orchestrator-integration/ROADMAP.md
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/backend/src/ai-responder/services/ai-tool.executor.ts

## Architecture Constraints

- **Single Source:** Routing decision comes from LLM calling `route_decision` tool with `{path: "yes"|"no"}`
- **Invariants:** Condition node MUST receive only the `route_decision` tool; Action nodes MUST auto-execute before responding
- **Resilience:** If LLM doesn't call route_decision, fallback to first available edge
- **Testability:** Tool calls are already mockable via LLMProviderManager

## Tasks

<task id="1" type="auto">
  <name>Handle Condition node routing in AiResponderService</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. Before LLM generation, check if current node is type 'condition':
       - If yes, call `executeStep()` which returns `{requiresRouting: true, routingPrompt}`
       - Override `systemPrompt` with the condition node's routing prompt
       - Override `tools` with ONLY `aiToolExecutor.getRoutingTool()` (not getTools())
    2. In the tool call handling loop (lines ~202-216):
       - Detect if `route_decision` tool was called
       - Extract `path` ('yes' or 'no') from tool arguments
       - Call `workflowEngine.processRouteDecision(node, workflow, decision)`
       - Set `nextNodeIdForPersistence` to the result
       - Skip regular tool execution for route_decision (it's handled specially)
    3. For Condition nodes, after routing is resolved:
       - Persist the next node and continue (no text response needed from routing)
  </action>
  <done>
    - Condition nodes trigger routing flow with route_decision tool only
    - LLM calls route_decision tool and workflow advances via processRouteDecision()
    - TypeScript compiles without errors
  </done>
</task>

<task id="2" type="auto">
  <name>Auto-execute Action nodes before responding</name>
  <files>
    - [MODIFY] packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. After determining `currentNodeId`, check if current node is type 'action':
       - If yes, call `executeStep()` to execute the tool automatically
       - The stepResult will contain the tool output and nextNodeId
       - Advance to nextNodeId and repeat until we hit a non-action node (LLM or condition)
    2. Use a loop to chain through multiple consecutive Action nodes:
       ```typescript
       while (currentNode && currentNode.type === 'action') {
         const result = await this.workflowEngine.executeStep(ctx);
         currentNodeId = result.nextNodeId;
         currentNode = workflow.nodes.find(n => n.id === currentNodeId);
       }
       ```
    3. Only after reaching an LLM or condition node, proceed with LLM generation
  </action>
  <done>
    - Action nodes are auto-executed without LLM call
    - Workflow chains through multiple Action nodes until hitting LLM/condition
    - TypeScript compiles without errors
  </done>
</task>

## Success Criteria

- [ ] Condition nodes trigger route_decision tool injection
- [ ] LLM's route_decision call advances workflow to correct path
- [ ] Action nodes auto-execute their tools without user prompt
- [ ] Workflow chains through multiple Action nodes correctly
- [ ] TypeScript compiles without errors
