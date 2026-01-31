phase: 3
created: 2026-01-31
is_tdd: false

---

# Plan: Phase 3 - Routing Switch & Cleanup

## Objective

Switch the application to use the new `ProjectSettingsLayout` and nested routing structure, verify all sub-pages work correctly, and remove the legacy monolithic `ProjectSettingsPage`.

## Context

- `packages/frontend/src/App.tsx` (Defines the routing structure)
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` (Legacy file to remove)
- New files: `ProjectSettingsLayout`, `ProjectGeneralSettingsPage`, `ProjectWidgetSettingsPage`, `ProjectAiSettingsPage`.

## Architecture Constraints

- **Nested Routing:** The `ProjectSettingsLayout` must be the parent route for `/projects/:projectId/settings`, with `Outlet` rendering the sub-pages.
- **Redirects:** Accessing the root `/projects/:projectId/settings` must automatically redirect to `/general`.
- **Lazy Loading:** New pages should be lazy-loaded to maintain performance.

## Tasks

<task id="1" type="auto" complexity="Medium">
  <name>Update App.tsx with new routes</name>
  <risk>Routing changes can break navigation if paths don't match exactly.</risk>
  <files>packages/frontend/src/App.tsx</files>
  <action>
    Modify `packages/frontend/src/App.tsx`:
    1. Import the new pages using `lazy()`:
       - `ProjectSettingsLayout`
       - `ProjectGeneralSettingsPage`
       - `ProjectWidgetSettingsPage`
       - `ProjectAiSettingsPage`
    2. Replace the existing standalone `ProjectSettingsPage` route definition:
       ```tsx
       <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
       ```
       with a nested route structure:
       ```tsx
       <Route path="/projects/:projectId/settings" element={<ProjectSettingsLayout />}>
         <Route index element={<Navigate to="general" replace />} />
         <Route path="general" element={<ProjectGeneralSettingsPage />} />
         <Route path="widget" element={<ProjectWidgetSettingsPage />} />
         <Route path="ai" element={<ProjectAiSettingsPage />} />
         {/* Move existing sub-routes here as children */}
         <Route path="canned-responses" element={<CannedResponsesPage />} />
         <Route path="action-templates" element={<ActionTemplatesPage />} />
         <Route path="audit-logs" element={<AuditLogsPage />} />
       </Route>
       ```
    3. Remove the old standalone routes for `audit-logs`, `canned-responses`, and `action-templates` since they are now children.
  </action>
  <done>
    - `App.tsx` updated with nested routes.
    - `ProjectSettingsLayout` wraps all project settings pages.
    - Default redirect to `general` is in place.
  </done>
</task>

<task id="2" type="auto" complexity="Low">
  <name>Update internal links</name>
  <risk>Broken links in other parts of the app.</risk>
  <files>packages/frontend/src/pages/settings/ProjectsListPage.tsx, packages/frontend/src/pages/public/docs/AutomationDocs.tsx</files>
  <action>
    Search for links pointing to `/projects/${id}/settings` and update them to point to specific sub-pages if necessary (usually `/general` or just `/settings` which now redirects).
    - `ProjectsListPage.tsx`: Update the "Settings" button link to `/projects/${project.id}/settings/general`.
    - `AutomationDocs.tsx`: Check if links need updating (likely just `/settings` is fine due to redirect, but explicit `/settings/general` is safer).
    - Any other occurrences found via `grep`.
  </action>
  <done>
    - All links verified and updated to point to the new structure.
  </done>
</task>

<task id="3" type="auto" complexity="Low">
  <name>Delete legacy ProjectSettingsPage</name>
  <risk>None, if previous tasks are verified.</risk>
  <files>packages/frontend/src/pages/settings/ProjectSettingsPage.tsx</files>
  <action>
    Delete `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`.
    Remove its lazy import from `App.tsx` (if not already replaced in Task 1).
  </action>
  <done>
    - File deleted.
    - No build errors.
  </done>
</task>

## Success Criteria

- [ ] navigating to `/projects/1/settings` redirects to `/projects/1/settings/general`.
- [ ] Sidebar appears on all project settings pages.
- [ ] All sub-pages (General, Widget, AI, Canned, Actions, Audit) render correctly within the layout.
- [ ] "Back to Inbox" button works.
