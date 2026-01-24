# Roadmap

**Spec:** ./.gtd/home-and-docs-skeleton/SPEC.md
**Goal:** Create a public Landing Page and Documentation Skeleton with full i18n and Theme support.
**Created:** 2026-01-24

## Must-Haves

- [ ] Public Home Page (`/`) with Header, "How it works", Nav, Footer.
- [ ] Language Switcher (EN/VI) in Navigation.
- [ ] Theme Switcher (Dark/Light) in Navigation.
- [ ] Documentation Skeleton (`/docs`) with Sidebar and category pages.
- [ ] Internationalization (i18n) applied to all new content.
- [ ] App Integration (Public Routes in `App.tsx`).

## Nice-To-Haves

- [ ] Breadcrumbs for navigation within documentation.
- [ ] Search bar placeholder in documentation.

## Phases

### Phase 1: Home Page & Foundation

**Status**: ✅ Complete
**Objective**: Establish the public route structure, implement the landing page with global navigation (Theme/Lang switchers), and ensure basic i18n setup.

**Deliverables**:
- Updated `App.tsx` with public routes.
- `HomePage` component with "How it works" section.
- `PublicLayout` component including Header (with Login/Register/Theme/Lang controls) and Footer.
- Translation JSONs updated for Home page content.

### Phase 2: Documentation Skeleton

**Status**: ✅ Complete
**Objective**: Build the documentation structure (`/docs`), sidebar navigation, and placeholder pages for key features.

**Deliverables**:
- `DocsLayout` with Sidebar navigation.
- Skeleton pages for: Security (2FA), Management (Projects/Users), Efficiency (Canned), Automation (AI).
- Translation JSONs updated for Documentation content.
- Navigation links between Home and Docs.
- Breadcrumbs and Search placeholder (Nice-to-have).
