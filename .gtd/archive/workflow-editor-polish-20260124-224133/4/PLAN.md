---
phase: 4
created: 2026-01-24
---

# Plan: Phase 4 - Collapsible Global Tools Panel (Optional)

## Objective

Add expand/collapse functionality to the Global Tools panel to save screen space when not in use.

## Context

- ./.gtd/workflow-editor-polish/SPEC.md
- ./.gtd/workflow-editor-polish/ROADMAP.md
- packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** Collapse state is local UI state (useState)
- **Invariants:** Collapsed state persists only within session (no localStorage needed)
- **Resilience:** N/A (UI only)
- **Testability:** N/A (UI only)

## Tasks

<task id="1" type="auto">
  <name>Add collapse toggle to GlobalToolsPanel</name>
  <files>
    - [MODIFY] packages/frontend/src/components/features/workflow/GlobalToolsPanel.tsx
    - [MODIFY] packages/frontend/src/i18n/locales/en.json
    - [MODIFY] packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Add `isCollapsed` state with `useState(false)`
    2. Add a header row with:
       - Title "Global Tools"
       - ChevronDown/ChevronUp icon button to toggle collapse
    3. When collapsed:
       - Hide the description text
       - Hide the tool configuration cards
       - Show only the header with count badge (e.g., "3 tools" or "1 enabled")
    4. Add i18n key for "enabled" count text
  </action>
  <done>
    - GlobalToolsPanel has collapse/expand toggle button
    - Clicking toggle hides/shows tool cards
    - Collapsed state shows enabled tool count
    - TypeScript compiles without errors
  </done>
</task>

## Success Criteria

- [ ] GlobalToolsPanel has collapse toggle
- [ ] Collapsed state hides tool configuration
- [ ] Enabled tool count visible when collapsed
- [ ] i18n keys added for count text
