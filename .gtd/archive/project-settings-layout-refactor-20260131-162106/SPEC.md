# Specification

**Status:** FINALIZED
**Created:** 2026-01-31

## Goal

Refactor the `/projects/<project-id>/settings` page to use a persistent sidebar layout, unified with the visual style of the global `/settings` page. This replaces the current accordion-style `ProjectSettingsPage` with a `ProjectSettingsLayout` and dedicated sub-pages.

## Requirements

### Must Have

- [ ] **ProjectSettingsLayout Component**
  - Implement a layout wrapper similar to `SettingsLayout.tsx` (sidebar on desktop, drawer on mobile).
  - Sidebar Items:
    - **General** (`/settings/general`): Basic Info, Embed Code.
    - **Widget** (`/settings/widget`): Widget Theme, Position, Visibility.
    - **AI Responder** (`/settings/ai`): AI Configuration.
    - **Canned Responses** (`/settings/canned-responses`): Existing functionality.
    - **Action Templates** (`/settings/action-templates`): Existing functionality.
    - **Audit Logs** (`/settings/audit-logs`): Existing functionality.
  - **Back Navigation**: A dedicated "Back" link at the top of the sidebar/drawer that exits the settings area and returns to the project dashboard (`/projects/:projectId/inbox`).

- [ ] **Content Refactoring**
  - Extract sections from `ProjectSettingsPage.tsx` into standalone page components:
    - `ProjectGeneralSettingsPage.tsx`: Contains `ProjectBasicSettingsForm` and the "Widget Snippet" section.
    - `ProjectWidgetSettingsPage.tsx`: Contains the widget settings form and preview.
    - `ProjectAiSettingsPage.tsx`: Contains `AiResponderSettingsForm`.
  - Reuse existing pages: `CannedResponsesPage`, `ActionTemplatesPage`, `AuditLogsPage`.

- [ ] **Routing Updates**
  - Update `packages/frontend/src/routes.tsx` (or `App.tsx`) to implement the nested routing structure.
  - Redirect `/projects/:id/settings` (root) to `/projects/:id/settings/general`.

### Nice to Have

- [ ] Maintain the "sticky" save button behavior in the new individual forms.

### Won't Have

- New functional features (e.g., adding member management if not already present).
- Changes to the internal logic of `ProjectBasicSettingsForm` or `AiResponderSettingsForm`.

## Constraints

- Must use existing UI components (`Sidebar`, `Button`, `Avatar`, etc.) to match `SettingsLayout` exactly.
- Must ensure `PermissionGate` logic is preserved for each section (e.g., Managers only for sensitive settings).
- Mobile responsiveness must be identical to global settings (hamburger menu, slide-out drawer).

## Open Questions

- None.
