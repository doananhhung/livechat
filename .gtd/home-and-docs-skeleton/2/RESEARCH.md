# Research: Phase 2 (Documentation Skeleton)

## Findings

### 1. Layout & Navigation
- **Architecture**: `DocsLayout` should be a child route of `PublicLayout`. This inherits the main Header/Footer.
- **Desktop**: Split view. Left sidebar (fixed width, sticky), Right content (scrollable).
- **Mobile**: Use `packages/frontend/src/components/ui/sheet.tsx` for a slide-out drawer containing the sidebar navigation.
- **Icons**: `lucide-react` is available.
    - Security: `Lock` / `Shield`
    - Management: `Users` / `Settings`
    - Efficiency: `MessageSquare` / `Zap`
    - Automation: `Bot` / `Cpu`

### 2. Routing Structure
- **Path**: `/docs`
- **Sub-paths**:
    - `/docs/security`
    - `/docs/management`
    - `/docs/efficiency`
    - `/docs/automation`
- **Index**: `/docs` (Introduction)

### 3. Content Strategy
- **Skeleton Only**: Pages will contain a Title, a brief Description (from i18n), and a "Coming Soon" or simple steps list placeholder.
- **Translation Keys**: `docs.security.*`, `docs.management.*`, etc.

## Plan Structure
1.  **Layout**: `DocsLayout` with `SidebarNav`.
2.  **Pages**: Create 4 skeleton pages + Index page.
3.  **Integration**: Update `App.tsx` and Translation JSONs.
