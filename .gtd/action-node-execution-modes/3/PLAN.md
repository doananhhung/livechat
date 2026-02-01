phase: 3
created: 2026-02-01
is_tdd: false

---

# Plan: Phase 3 - Visual Polish

## Objective

Enhance the visual representation of Action Nodes in the workflow graph to indicate their execution mode. A small badge will display "Static" or "AI" depending on the configuration.

## Context

- packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Type Safety:** Update local `ActionNodeData` interface to match the actual data structure (include `prompt`).
- **Visuals:** Use existing Tailwind utility classes and color schemes (blue for Action).
- **i18n:** Use translations for badge text.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Update i18n for Badges</name>
  <risk>None</risk>
  <files>packages/frontend/src/i18n/locales/en.json, packages/frontend/src/i18n/locales/vi.json</files>
  <action>
    Add `badgeStatic` and `badgeAi` to `workflow.nodes`:
    - EN: "Static", "AI"
    - VI: "Tĩnh", "AI"
  </action>
  <done>Keys added to JSON files.</done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Implement Badge in ActionNode</name>
  <risk>None</risk>
  <files>packages/frontend/src/components/features/workflow/nodes/ActionNode.tsx</files>
  <action>
    1. Update `ActionNodeData` type:
       ```typescript
       type ActionNodeData = {
         toolName?: string;
         toolArgs?: Record<string, unknown>;
         prompt?: string;
       };
       ```
    2. Logic to determine badge:
       - If `toolArgs?.content` (length > 0) -> Static.
       - Else -> AI.
    3. Render Badge:
       - Small text/pill top-right or inside the card.
       - "Static": Gray/Muted styling.
       - "AI": Blue/Primary styling.
  </action>
  <done>Badge rendered conditionally on the node.</done>
</task>

## Success Criteria

- [ ] Action nodes with static content show "Static" badge.
- [ ] Action nodes without static content show "AI" badge.
- [ ] Badge text is localized.
