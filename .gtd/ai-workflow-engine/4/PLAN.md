---
phase: 4
created: 2026-01-24
---

# Plan: Phase 4 - Advanced Features

## Objective

Enhance the workflow engine with variable injection support and global tools. This allows dynamic content in LLM prompts (e.g., "Hello {{visitor.name}}") and persistent tools that are available across all steps of the workflow.

## Context

- ./.gtd/ai-workflow-engine/SPEC.md
- packages/backend/src/ai-responder/services/workflow-engine.service.ts
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx

## Architecture Constraints

- **Variable Syntax:** Use `{{variable}}` format.
- **Scope:** Variables should resolve from `Visitor`, `Conversation`, and `Project` entities.
- **Global Tools:** Defined in the workflow root, merged with node-specific tools at runtime.

## Tasks

<task id="1" type="auto">
  <name>Implement Variable Injection</name>
  <files>
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    1. Update `WorkflowEngineService.getNodeContext` to accept `context` (containing visitor/conversation entities).
    2. Implement a `replaceVariables(text, context)` utility.
    3. Apply variable replacement to `systemPrompt` before returning it.
    4. Support keys: `visitor.name`, `visitor.email`, `conversation.id`, `project.name`.
  </action>
  <done>
    - System prompts with `{{visitor.name}}` are correctly interpolated.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Global Tools</name>
  <files>
    packages/shared-types/src/workflow.types.ts
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
    packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
  </files>
  <action>
    1. Update `WorkflowDefinition` to include `globalTools: string[]` (list of tool names).
    2. Update `WorkflowEngineService.getNodeContext` to append global tools to the node-specific tools list.
    3. Update Frontend `WorkflowEditor` (or settings panel) to allow selecting global tools (e.g., "Always allow 'Add Note'").
  </action>
  <done>
    - Tools defined globally are available to the AI at every step.
  </done>
</task>

## Success Criteria

- [ ] AI prompts effectively use visitor names/data.
- [ ] Global tools (like Add Note) work even in nodes that don't explicitly define them.
