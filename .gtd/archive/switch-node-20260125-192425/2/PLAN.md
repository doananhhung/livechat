---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Backend Workflow Engine

## Objective

Integrate switch node into workflow execution. Add `handleSwitchNode()`, `processSwitchDecision()`, and `switch_decision` tool. The LLM will pick from user-defined cases.

## Context

- ./.gtd/switch-node/SPEC.md
- ./.gtd/switch-node/ROADMAP.md
- packages/shared-types/src/ai-tools.ts
- packages/backend/src/ai-responder/services/ai-tool.executor.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/backend/src/ai-responder/ai-responder.service.ts

## Architecture Constraints

- **Single Source:** `AiToolName` enum in shared-types is authoritative for tool names
- **Invariants:** LLM must return a case that exists in `cases` array or `default`
- **Resilience:** Invalid case falls back to `default` path
- **Testability:** Switch logic is pure function based on cases array

## Tasks

<task id="1" type="auto">
  <name>Add SWITCH_DECISION to AiToolName and create getSwitchTool()</name>
  <files>
    - packages/shared-types/src/ai-tools.ts
    - packages/backend/src/ai-responder/services/ai-tool.executor.ts
  </files>
  <action>
    1. In `ai-tools.ts`, add to AiToolName enum:
       ```typescript
       SWITCH_DECISION = "switch_decision",
       ```
    2. Add to AI_TOOL_LABEL_KEYS:
       ```typescript
       [AiToolName.SWITCH_DECISION]: "workflow.globalTools.switchDecision",
       ```

    3. In `ai-tool.executor.ts`, define SWITCH_DECISION_TOOL constant:
       ```typescript
       const SWITCH_DECISION_TOOL: ToolDefinition = {
         type: 'function',
         function: {
           name: AiToolName.SWITCH_DECISION,
           description: 'Choose which case to route to based on the defined conditions',
           parameters: {
             type: 'object',
             properties: {
               case: {
                 type: 'string',
                 description: 'The case name to route to',
               },
             },
             required: ['case'],
           },
         },
       };
       ```

    4. Add method to AiToolExecutor:
       ```typescript
       getSwitchTool(cases: string[]): ToolDefinition {
         return {
           ...SWITCH_DECISION_TOOL,
           function: {
             ...SWITCH_DECISION_TOOL.function,
             parameters: {
               type: 'object',
               properties: {
                 case: {
                   type: 'string',
                   enum: [...cases, 'default'],
                   description: 'The case name to route to',
                 },
               },
               required: ['case'],
             },
           },
         };
       }
       ```

  </action>
  <done>
    - `SWITCH_DECISION` exists in AiToolName enum
    - `getSwitchTool(['a', 'b'])` returns ToolDefinition with enum constraint
    - Backend compiles
  </done>
</task>

<task id="2" type="auto">
  <name>Add handleSwitchNode() and processSwitchDecision() to WorkflowEngineService</name>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    1. Import SwitchData from schemas:
       ```typescript
       import { SwitchData } from '../schemas/workflow.schemas';
       ```

    2. Add case to executeStep switch statement:
       ```typescript
       case 'switch':
         this.logger.debug(
           `[Workflow] Switch node ${validatedNode.id} requires routing decision`
         );
         return this.handleSwitchNode(validatedNode, context);
       ```

    3. Add handleSwitchNode method:
       ```typescript
       private handleSwitchNode(
         node: ValidatedWorkflowNode,
         context: WorkflowContext
       ): WorkflowStepResult {
         if (node.type !== 'switch') {
           throw new Error('handleSwitchNode called with non-switch node');
         }

         const data = node.data as SwitchData;
         const caseList = data.cases.map(c => `- "${c.route}": ${c.when}`).join('\n');
         const defaultCaseInfo = '\n- "default": If none of the above conditions match';

         const routingPrompt = data.prompt
           ? `${data.prompt}\n\nAvailable cases:\n${caseList}${defaultCaseInfo}`
           : `Choose the appropriate case based on the conversation.\n\nAvailable cases:\n${caseList}${defaultCaseInfo}\n\nUse the switch_decision tool with the case name.`;

         return {
           nextNodeId: null,
           output: null,
           requiresRouting: true,
           routingPrompt,
         };
       }
       ```

    4. Add processSwitchDecision method:
       ```typescript
       processSwitchDecision(
         node: WorkflowNode,
         workflow: WorkflowDefinition,
         caseName: string
       ): string | null {
         this.logger.debug(
           `[Workflow] Processing switch decision: ${caseName} for node ${node.id}`
         );

         // Try to find edge with matching case handle
         const nextNodeId = this.getNextNodeId(node, workflow, caseName);

         if (nextNodeId) {
           return nextNodeId;
         }

         // Fallback to default
         const defaultNodeId = this.getNextNodeId(node, workflow, 'default');
         if (defaultNodeId) {
           this.logger.debug(`[Workflow] Case "${caseName}" not found, using default`);
           return defaultNodeId;
         }

         // Last resort: find any edge from this node
         this.logger.warn(
           `[Workflow] No edge found for case "${caseName}" or default from node ${node.id}`
         );
         const fallbackEdge = workflow.edges.find((e) => e.source === node.id);
         return fallbackEdge ? fallbackEdge.target : null;
       }
       ```

    5. Update getNodeContext to handle switch node (add to the if statement):
       ```typescript
       if (node.type === 'condition' || node.type === 'llm' || node.type === 'switch') {
       ```

  </action>
  <done>
    - `switch` case handled in executeStep
    - handleSwitchNode returns prompt with all cases listed
    - processSwitchDecision routes to correct edge or falls back to default
    - Backend compiles
  </done>
</task>

<task id="3" type="auto">
  <name>Integrate switch node handling in AiResponderService</name>
  <files>packages/backend/src/ai-responder/ai-responder.service.ts</files>
  <action>
    1. Add switch node detection alongside condition (around line 235):
       ```typescript
       } else if (currentNode.type === 'switch') {
         isSwitchRouting = true;
         switchNode = currentNode;
         
         const switchData = currentNode.data as { cases: { route: string; when: string }[] };
         const caseNames = switchData.cases.map(c => c.route);
         
         const routingPrompt =
           (currentNode.data?.prompt as string) ||
           `Choose the appropriate case based on the conversation. Available cases: ${caseNames.join(', ')}, default`;
         systemPrompt = routingPrompt;
         tools = [this.aiToolExecutor.getSwitchTool(caseNames)];
         
         this.logger.debug(
           `[Workflow] Switch node ${currentNode.id} - using switch_decision tool`
         );
       }
       ```

    2. Add variables at the top of workflow logic block:
       ```typescript
       let isSwitchRouting = false;
       let switchNode: { id: string; type: string; data: unknown } | null = null;
       ```

    3. Add switch_decision tool handling in the tool call loop (after route_decision handling):
       ```typescript
       if (toolCall.function.name === 'switch_decision') {
         const args = JSON.parse(toolCall.function.arguments) as { case: string };
         switchDecisionMade = args.case;
         this.logger.debug(`[Workflow] Switch decision: ${args.case}`);

         messages.push({
           role: 'tool',
           tool_call_id: toolCall.id,
           name: toolCall.function.name,
           content: `Routing to case: ${args.case}`,
         });
         continue;
       }
       ```

    4. Add switchDecisionMade variable:
       ```typescript
       let switchDecisionMade: string | null = null;
       ```

    5. Add switch routing handling (after condition routing block):
       ```typescript
       if (isSwitchRouting && switchDecisionMade && workflowCtx && switchNode) {
         const workflow = workflowCtx.workflow;
         const nextNodeId = this.workflowEngine.processSwitchDecision(
           switchNode as Parameters<typeof this.workflowEngine.processSwitchDecision>[0],
           workflow,
           switchDecisionMade
         );

         // ... same metadata update pattern as condition routing ...
         return this._processMessage(payload);
       }
       ```

    6. Add break for switchDecisionMade in the loop:
       ```typescript
       if (routeDecisionMade || switchDecisionMade) {
         break;
       }
       ```

  </action>
  <done>
    - Switch node detected and uses getSwitchTool()
    - switch_decision tool call parsed correctly
    - processSwitchDecision called with case name
    - Workflow advances to correct node
    - Backend compiles
  </done>
</task>

## Success Criteria

- [ ] `SWITCH_DECISION` exists in AiToolName enum
- [ ] `getSwitchTool()` returns ToolDefinition with dynamic case enum
- [ ] `handleSwitchNode()` returns routing prompt listing all cases
- [ ] `processSwitchDecision()` routes to case edge or falls back to default
- [ ] AiResponderService handles switch node and switch_decision tool
- [ ] Backend compiles without TypeScript errors
