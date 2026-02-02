phase: 1
created: 2026-02-02
is_tdd: false

---

# Plan: Phase 1 - Navigation and Routing Restoration

## Objective

Make the "Create Project" functionality accessible to all users by redirecting the "Projects" navigation items to the main Project List page (`/settings/projects`) and ensuring this page is properly routed.

## Verification Strategy

- **Manual Verification:**
  1.  Log in as a user with 0 projects.
  2.  Verify "Projects" icon is visible in the global sidebar.
  3.  Click "Projects" -> Verify redirection to `/settings/projects`.
  4.  Verify "Create Project" form is visible.
  5.  Log in as a user with existing projects.
  6.  Verify "Projects" link in Settings sidebar points to `/settings/projects`.

## Context

- ./.gtd/fix-create-project-navigation/SPEC.md
- packages/frontend/src/components/layout/GlobalSidebar.tsx
- packages/frontend/src/pages/settings/SettingsLayout.tsx
- packages/frontend/src/App.tsx

## Architecture Constraints

- **Single Source:** `ProjectsListPage` is the canonical entry point for project management and creation.
- **Invariants:** The "Projects" navigation item must **always** be visible in both sidebars, regardless of project count.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Update Navigation Components</name>
  <risk>None</risk>
  <files>
    packages/frontend/src/components/layout/GlobalSidebar.tsx
    packages/frontend/src/pages/settings/SettingsLayout.tsx
  </files>
  <action>
    1.  **GlobalSidebar.tsx**:
        -   Remove the `firstProjectId` conditional check wrapping the "Projects" `NavItem`.
        -   Update the `to` prop of the "Projects" `NavItem` to point to `/settings/projects`.
    2.  **SettingsLayout.tsx**:
        -   Remove the `firstProjectId` conditional check for adding the "Projects" item to `navItems`.
        -   Update the `href` of the "Projects" item to `/settings/projects`.
  </action>
  <done>
    -   GlobalSidebar always renders the Projects icon linking to /settings/projects.
    -   SettingsLayout always renders the Projects link pointing to /settings/projects.
  </done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Register Project List Route</name>
  <risk>None</risk>
  <files>
    packages/frontend/src/App.tsx
  </files>
  <action>
    1.  Locate the `/settings` route block in `App.tsx`.
    2.  Add a new child `Route` for path `projects` (matching `/settings/projects`).
    3.  Set its element to `<ProjectsListPage />` (ensure `ProjectsListPage` is imported/lazy-loaded).
    4.  Ensure it does not conflict with the existing `/settings/projects/:projectId` route (specific project settings).
        -   *Note:* Routes are matched in order or by specificity. `/settings/projects` is distinct from `/settings/projects/:projectId`.
  </action>
  <done>
    -   Navigating to `/settings/projects` renders the Project List page.
  </done>
</task>

## Success Criteria

- [ ] Users with 0 projects see the "Projects" icon in the global sidebar.
- [ ] Users can navigate to `/settings/projects`.
- [ ] Users with existing projects can navigate to `/settings/projects` via the Settings sidebar.
