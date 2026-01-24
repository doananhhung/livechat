---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Node Toolbar & Add Logic

## Objective

Add a toolbar component to `WorkflowEditor` that allows users to add new nodes (Start, Action, LLM, Condition) to the canvas. This addresses the core usability gap where users currently cannot add nodes.

## Context

- ./.gtd/workflow-editor-complete/SPEC.md
- ./.gtd/workflow-editor-complete/ROADMAP.md
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/ui/Button.tsx
- packages/shared-types/src/workflow.types.ts
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** `nodes` state in `WorkflowEditor` is the authoritative source
- **Invariants:** New node IDs must be unique (use timestamp-based generation)
- **Resilience:** If no room for new node, place at default offset from last node
- **Testability:** `addNode` function should be pure, taking current nodes and returning new array

## Tasks

<task id="1" type="auto">
  <name>Create NodeToolbar component</name>
  <files>
    - [NEW] packages/frontend/src/components/features/workflow/NodeToolbar.tsx
  </files>
  <action>
    Create a toolbar component with buttons for each node type:
    - Start (green), Action (blue), LLM (purple), Condition (orange)
    - Use lucide-react icons matching existing nodes (Play, Zap, Brain, GitFork)
    - Use Button component from ui/
    - Use semantic colors (bg-card, text-card-foreground, border-border)
    - Use i18n keys for labels: workflow.toolbar.addStart, addAction, addLlm, addCondition
    - Props: onAddNode(type: string) callback
  </action>
  <done>
    - NodeToolbar.tsx exists with 4 buttons
    - Each button calls onAddNode with correct type
    - Component uses design system colors
    - Component uses i18n for labels
  </done>
</task>

<task id="2" type="auto">
  <name>Integrate toolbar and add logic into WorkflowEditor</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Import and render NodeToolbar (positioned top-right, below existing Global Tools panel)
    2. Implement addNode function:
       - Generate unique ID: `${type}-${Date.now()}`
       - Calculate position: offset 50px down-right from last node, or (250, 150) if empty
       - Create node object matching WorkflowNode type
       - Call setNodes with new array
    3. Add i18n keys to en.json and vi.json under "workflow.toolbar" namespace
  </action>
  <done>
    - NodeToolbar visible in editor
    - Clicking button adds node to canvas at calculated position
    - New nodes are selectable and configurable
    - Console shows no errors
  </done>
</task>

## Success Criteria

- [ ] User can add all 4 node types via toolbar buttons
- [ ] New nodes appear at reasonable positions (not overlapping)
- [ ] New nodes use unique IDs
- [ ] Labels are translated (en/vi)
- [ ] Styling matches existing design system
