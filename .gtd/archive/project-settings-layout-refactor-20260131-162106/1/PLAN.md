phase: 1
created: 2026-01-31
is_tdd: false

---

# Plan: Phase 1 - Layout Infrastructure

## Objective

Create the `ProjectSettingsLayout` component that mirrors the global settings layout, providing a persistent sidebar, mobile navigation, and correct routing context for project-specific settings.

## Context

- `packages/frontend/src/pages/settings/SettingsLayout.tsx` (Reference implementation)
- `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx` (Data source for project details and icons)

## Architecture Constraints

- **Consistency:** Must match `SettingsLayout.tsx` visual style (classes, sidebar width, mobile behavior).
- **Navigation:** Must use `NavLink` for active states.
- **Context:** Must rely on `useParams` to extract `projectId` and `useQuery` to fetch project details for the sidebar header.
- **Responsiveness:** Must include the mobile drawer logic.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Create ProjectSettingsLayout component</name>
  <risk>None</risk>
  <files>packages/frontend/src/pages/settings/ProjectSettingsLayout.tsx</files>
  <action>
    Create a new file `packages/frontend/src/pages/settings/ProjectSettingsLayout.tsx`.
    - Adapt the code from `SettingsLayout.tsx`.
    - **Sidebar Header**: Fetch project list using `projectApi.getProjects` and find the current project by `projectId` (from `useParams`). Display Project Name and an Avatar (use `p.name`).
    - **Back Link**: "Back to Inbox" pointing to `/projects/:id/dashboard`. (Note: Existing `SettingsLayout` points to `/dashboard`, confirm `InboxLayout` route is usually `/projects/:id/inbox` or `/projects/:id/dashboard` - sticking to `/projects/:id/inbox` or whatever the "Inbox" route is known as. *Self-Correction: Route is usually `/projects/:id/inbox` or just `/projects/:id`? I will check `routes.tsx` or just use `/projects/:id` which likely redirects to inbox.*)
    - **Navigation Items**:
      - General: `Info` icon → `/projects/:id/settings/general`
      - Widget: `Palette` icon → `/projects/:id/settings/widget`
      - AI Responder: `Zap` icon → `/projects/:id/settings/ai`
      - Canned Responses: `MessageSquarePlus` icon → `/projects/:id/settings/canned-responses`
      - Action Templates: `Workflow` (or `FileJson`) icon → `/projects/:id/settings/action-templates`
      - Audit Logs: `ShieldAlert` icon → `/projects/:id/settings/audit-logs`
    - **Mobile Drawer**: Replicate the `isMobileMenuOpen` state and drawer UI.
  </action>
  <done>
    - File exists.
    - Exports `ProjectSettingsLayout` component.
    - Contains Sidebar and Outlet.
    - NavLinks are dynamic based on `projectId`.
  </done>
</task>

## Success Criteria

- [ ] `ProjectSettingsLayout.tsx` created and syntactically correct.
- [ ] Sidebar includes all 6 required sections with icons.
- [ ] "Back to Inbox" link correctly targets the project root.
