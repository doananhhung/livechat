phase: 2
created: 2026-01-31
is_tdd: false

---

# Plan: Phase 2 - Content Migration

## Objective

Extract the monolithic content from `ProjectSettingsPage.tsx` into dedicated, focused pages (`ProjectGeneralSettingsPage`, `ProjectWidgetSettingsPage`, `ProjectAiSettingsPage`) while preserving all existing logic, permissions, and styles.

## Context

- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` (Source of logic to migrate)
- `packages/frontend/src/components/features/projects/ProjectBasicSettingsForm.tsx` (Used in General page)
- `packages/frontend/src/components/features/projects/ai-responder/AiResponderSettingsForm.tsx` (Used in AI page)
- `packages/frontend/src/services/projectApi.ts` (API methods used)

## Architecture Constraints

- **Logic Preservation:** Copy state management (e.g., widget form state) exactly as is into the new `ProjectWidgetSettingsPage`.
- **PermissionGate:** Ensure `PermissionGate` wraps the sensitive forms in the new pages, just as it did in the accordion.
- **Sticky Footer:** Ensure `StickyFooter` is used where applicable (it is already in the sub-forms).
- **No Refactoring:** Do not attempt to "clean up" the logic (e.g., changing how widget settings are fetched) unless strictly necessary for the split. We are moving code, not rewriting it.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Create ProjectGeneralSettingsPage</name>
  <risk>Ensure PermissionGate and Project fetching logic is correctly adapted from the parent page.</risk>
  <files>packages/frontend/src/pages/settings/ProjectGeneralSettingsPage.tsx</files>
  <action>
    Create `packages/frontend/src/pages/settings/ProjectGeneralSettingsPage.tsx`.
    - **Imports:** Copy necessary imports from `ProjectSettingsPage.tsx` (React, Query, UI components, `ProjectBasicSettingsForm`, etc.).
    - **Component Logic:**
      - Use `useParams` to get `projectId`.
      - Use `useQuery` to fetch `projects` and find current project (same as source).
      - Handle loading/not found states.
    - **Render:**
      - Render header "General Settings" / description.
      - **Section 1: Basic Info**: Wrap `ProjectBasicSettingsForm` in `PermissionGate` (Manager role).
      - **Section 2: Widget Snippet**: Copy the "Widget Snippet" section code (including the `getWidgetSnippet` logic and "Copy" button) from `ProjectSettingsPage.tsx`.
    - **Styles:** Use standard page container styling (max-w-6xl, spacing).
  </action>
  <done>
    - File exists.
    - Renders `ProjectBasicSettingsForm` for managers.
    - Renders Widget Snippet section.
    - Compiles without errors.
  </done>
</task>

<task id="2" type="auto" complexity="Medium">
  <name>Create ProjectWidgetSettingsPage</name>
  <risk>Complex state management for widget preview and form. Needs careful copy-paste.</risk>
  <files>packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx</files>
  <action>
    Create `packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx`.
    - **Imports:** Copy widget-related imports (enums, DTOs, `WidgetPreview`, `StickyFooter`, etc.).
    - **State & Effects:** Copy the `useState` hooks for theme, position, texts, etc., and the `useEffect` that initializes them from `currentProject`.
    - **Mutation:** Copy `updateWidgetMutation` and `handleWidgetSubmit`.
    - **Render:**
      - Render header "Widget Settings".
      - Wrap form in `PermissionGate`.
      - Render the 2-column layout (Form + Preview) exactly as in `ProjectSettingsPage.tsx`.
      - Ensure `WidgetPreview` receives the constructed `currentSettings` object.
  </action>
  <done>
    - File exists.
    - Contains full widget configuration form.
    - Preview updates in real-time (due to local state).
    - Save button triggers mutation.
  </done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Create ProjectAiSettingsPage</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectAiSettingsPage.tsx</files>
  <action>
    Create `packages/frontend/src/pages/settings/ProjectAiSettingsPage.tsx`.
    - **Logic:** Fetch project data similar to other pages.
    - **Render:**
      - Header "AI Responder".
      - Wrap `AiResponderSettingsForm` in `PermissionGate`.
  </action>
  <done>
    - File exists.
    - Renders `AiResponderSettingsForm`.
  </done>
</task>

## Success Criteria

- [ ] `ProjectGeneralSettingsPage.tsx` exists and mirrors General + Snippet sections.
- [ ] `ProjectWidgetSettingsPage.tsx` exists and mirrors Widget section + Preview.
- [ ] `ProjectAiSettingsPage.tsx` exists and mirrors AI section.
- [ ] All pages handle loading/project-not-found states gracefully.
