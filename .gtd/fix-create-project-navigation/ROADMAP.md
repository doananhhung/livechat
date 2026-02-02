# Roadmap

**Spec:** ./.gtd/fix-create-project-navigation/SPEC.md
**Goal:** Ensure all users (with 0 or N projects) can access the project list to create new projects.
**Created:** 2026-02-02

## Strategy

The strategy is straightforward: unify the navigation experience by always pointing "Projects" links to the list view, and ensure that list view is routed correctly. We will execute this in a single phase as the changes are atomic and interdependent.

## Must-Haves

- [ ] **Global Sidebar Updates (`GlobalSidebar.tsx`)**
- [ ] **Settings Layout Updates (`SettingsLayout.tsx`)**
- [ ] **Routing Updates (`App.tsx`)**

## Nice-To-Haves

- None

## Phases

### Phase 1: Navigation and Routing Restoration

**Status**: ✅ Complete
**Objective**: Update navigation components to link to `/settings/projects` and register the route to render `ProjectsListPage`.

**Criteria**:
- "Projects" icon in Global Sidebar is always visible.
- "Projects" icon in Global Sidebar links to `/settings/projects`.
- "Projects" item in Settings Layout Sidebar is always visible.
- "Projects" item in Settings Layout Sidebar links to `/settings/projects`.
- `/settings/projects` route renders `ProjectsListPage`.
