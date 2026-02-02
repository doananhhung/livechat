# Specification

**Status:** FINALIZED
**Created:** 2026-02-02

## Synopsis

Restores the accessibility of the "Create Project" functionality. Currently, navigation items (Global Sidebar and Settings Sidebar) link directly to the first project's settings or hide completely if no projects exist. This change redirects navigation to the "Project List" page (`/settings/projects`), ensuring the "Create Project" button on that page is always reachable.

## Goal

Ensure all users (with 0 or N projects) can access the project list to create new projects.

## Requirements

### Must Have

- [ ] **Global Sidebar Updates (`GlobalSidebar.tsx`)**
  - Always render the "Projects" (Folder) icon, removing the conditional check `firstProjectId && ...`.
  - Update the link destination from `/settings/projects/${firstProjectId}` to `/settings/projects`.

- [ ] **Settings Layout Updates (`SettingsLayout.tsx`)**
  - Update the "Projects" sidebar item to link to `/settings/projects` instead of `/settings/projects/${firstProjectId}`.
  - Ensure the item is visible even if no projects exist (remove `if (firstProjectId)` check).

- [ ] **Routing Updates (`App.tsx`)**
  - Register the route `/settings/projects` to render the `ProjectsListPage` component.
  - This route should be a sibling to `/settings/projects/:projectId` or appropriately nested to avoid conflicts.

### Nice to Have

- [ ] None

### Won't Have

- [ ] Modifications to the `ProjectsListPage` UI or logic itself.

## Constraints

- Reuse the existing `ProjectsListPage` component.
- Maintain consistent styling with existing sidebars.

## Open Questions

- None.
