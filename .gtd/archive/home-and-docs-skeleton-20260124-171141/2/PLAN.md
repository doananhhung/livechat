---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Documentation Skeleton

## Objective

Build the structure for the documentation section (`/docs`). This includes a responsive sidebar navigation (using a Sheet for mobile), a layout that nests within the public site, and skeleton pages for key feature categories. All content will be internationalized.

## Context

- **Spec**: `/.gtd/home-and-docs-skeleton/SPEC.md`
- **Research**: `/.gtd/home-and-docs-skeleton/2/RESEARCH.md`
- **Existing Files**:
  - `packages/frontend/src/components/layout/PublicLayout.tsx` (Parent layout)
  - `packages/frontend/src/components/ui/sheet.tsx` (For mobile sidebar)
  - `packages/frontend/src/App.tsx` (Routing)

## Architecture Constraints

- **Nesting**: `DocsLayout` must render inside `PublicLayout` to share the header/footer.
- **Responsiveness**: Sidebar must be hidden on mobile and togglable via a hamburger menu (Sheet).
- **Active State**: Navigation links must highlight the current active page.
- **Scalability**: The sidebar structure should be array-driven to easily add more pages later.

## Tasks

<task id="1" type="auto">
  <name>Create Docs Layout & Sidebar</name>
  <files>
    packages/frontend/src/components/features/docs/DocsSidebar.tsx
    packages/frontend/src/components/layout/DocsLayout.tsx
  </files>
  <action>
    1. Create `DocsSidebar.tsx`:
       - Accepts `className` prop.
       - Renders a list of links (Security, Management, Efficiency, Automation).
       - Uses `useLocation` to apply active styles (bg-muted/foreground).
    2. Create `DocsLayout.tsx`:
       - **Desktop**: Renders `DocsSidebar` in a `aside` (hidden on mobile).
       - **Mobile**: Renders a "Menu" button that triggers a `Sheet` containing `DocsSidebar`.
       - Renders `<Outlet />` for page content.
  </action>
  <done>
    - `DocsLayout` displays sidebar on desktop.
    - `DocsLayout` displays hamburger menu on mobile which opens sidebar.
    - Links highlight when active.
  </done>
</task>

<task id="2" type="auto">
  <name>Create Skeleton Pages & Translations</name>
  <files>
    packages/frontend/src/pages/public/docs/DocsIndex.tsx
    packages/frontend/src/pages/public/docs/SecurityDocs.tsx
    packages/frontend/src/pages/public/docs/ManagementDocs.tsx
    packages/frontend/src/pages/public/docs/EfficiencyDocs.tsx
    packages/frontend/src/pages/public/docs/AutomationDocs.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update translation files with `docs.*` keys (titles, descriptions for each page).
    2. Create the 5 pages:
       - `DocsIndex`: Overview of documentation.
       - `SecurityDocs`: 2FA placeholders.
       - `ManagementDocs`: Project/User settings placeholders.
       - `EfficiencyDocs`: Canned responses placeholders.
       - `AutomationDocs`: AI Responder placeholders.
    3. Each page should have a unified header style (Title + Description).
  </action>
  <done>
    - All 5 pages exist and render translated content.
    - UI is consistent.
  </done>
</task>

<task id="3" type="auto">
  <name>Register Docs Routes</name>
  <files>
    packages/frontend/src/App.tsx
  </files>
  <action>
    1. Lazy load `DocsLayout` and all 5 docs pages.
    2. Add nested routes under `PublicLayout` -> `/docs` path.
    3. Map paths:
       - `/docs` -> `DocsIndex`
       - `/docs/security` -> `SecurityDocs`
       - `/docs/management` -> `ManagementDocs`
       - `/docs/efficiency` -> `EfficiencyDocs`
       - `/docs/automation` -> `AutomationDocs`
  </action>
  <done>
    - Navigating to `/docs` shows the index.
    - Sidebar links correctly navigate to sub-pages.
  </done>
</task>

## Success Criteria

- [ ] `/docs` renders with a sidebar.
- [ ] Mobile users can access navigation via the Sheet.
- [ ] All 4 feature pages are accessible and show correct internationalized titles.
- [ ] Navigation state persists (active link is highlighted).
