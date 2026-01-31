# Roadmap

**Spec:** ./.gtd/project-settings-layout-refactor/SPEC.md
**Goal:** Refactor the `/projects/<project-id>/settings` page to use a persistent sidebar layout, unified with the visual style of the global `/settings` page.
**Created:** 2026-01-31

## Must-Haves

- [ ] **ProjectSettingsLayout Component**
- [ ] Sidebar Items & Mobile Drawer
- [ ] Back Navigation to Inbox
- [ ] **Content Refactoring** (General, Widget, AI pages)
- [ ] Reuse existing pages (Canned Responses, Action Templates, Audit Logs)
- [ ] **Routing Updates** (Nested structure, Redirects)

## Nice-To-Haves

- [ ] Maintain the "sticky" save button behavior

## Phases

### Phase 1: Layout Infrastructure

**Status**: ✅ Complete
**Objective**: Create the `ProjectSettingsLayout` component that mirrors the global settings layout, including the sidebar, mobile drawer, and back navigation logic.

- [ ] Create `packages/frontend/src/pages/settings/ProjectSettingsLayout.tsx` matching `SettingsLayout.tsx` style.
- [ ] Implement Sidebar navigation items (General, Widget, AI, Canned Responses, etc.).
- [ ] Implement Mobile Drawer functionality.
- [ ] Implement "Back to Inbox" navigation.

### Phase 2: Content Migration

**Status**: ✅ Complete
**Objective**: Extract content from the monolithic `ProjectSettingsPage` into dedicated sub-page components, preserving logic, permissions, and sticky footers.

- [ ] Create `packages/frontend/src/pages/settings/ProjectGeneralSettingsPage.tsx` (Basic Info + Snippet).
- [ ] Create `packages/frontend/src/pages/settings/ProjectWidgetSettingsPage.tsx` (Widget Form + Preview).
- [ ] Create `packages/frontend/src/pages/settings/ProjectAiSettingsPage.tsx` (AI Responder Form).
- [ ] Ensure `PermissionGate` checks are moved to respective pages.
- [ ] Ensure `StickyFooter` is implemented in new pages.

### Phase 3: Routing Switch & Cleanup

**Status**: ✅ Complete
**Objective**: Update the application routing to use the new layout and sub-pages, verify existing sub-pages work in the new context, and remove legacy code.

- [ ] Update `App.tsx` / `routes.tsx` to define nested routes under `/projects/:projectId/settings`.
- [ ] Configure redirect from `/settings` root to `/settings/general`.
- [ ] Verify `CannedResponsesPage`, `ActionTemplatesPage`, and `AuditLogsPage` render correctly in the new layout.
- [ ] Remove `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`.
