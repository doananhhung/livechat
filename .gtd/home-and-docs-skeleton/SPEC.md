# Specification

**Status:** UPDATED
**Last Updated:** 2026-01-24

## Goal

Create a professional public Landing Page and a structured Documentation Skeleton within the `packages/frontend` application. This will introduce users to the "Live Chat" platform, provide a high-level guide on getting started, and establish a foundation for detailed feature documentation, all while maintaining visual consistency with the existing dashboard.

## Requirements

### Must Have

- [ ] **Public Home Page (`/`)**:
    - Descriptive header explaining the platform (Live Chat/Support solution).
    - "How it works" section: Sign up → Create Project → Embed Widget → Start Messaging.
    - Navigation bar with:
        - Login and Register buttons.
        - **Language Switcher (EN/VI)**.
        - **Theme Switcher (Dark/Light)**.
    - Footer with basic site info and links to Docs.
    - Visual design consistent with the dashboard's Tailwind theme.
- [ ] **Documentation Skeleton (`/docs`)**:
    - Sidebar or navigation menu for doc categories.
    - Comprehensive skeleton structure including pages for:
        - **Security**: 2FA setup.
        - **Management**: Project settings, Adding users.
        - **Efficiency**: Canned responses.
        - **Automation**: AI Responder configuration.
    - Accurate, high-level descriptions for each feature based on current implementation.
- [ ] **Internationalization (i18n)**:
    - All text (Home & Docs) must use `i18next` translation keys.
    - Support both English (`en`) and Vietnamese (`vi`).
- [ ] **Theme Support**:
    - Fully respect the existing `themeStore` (Dark/Light modes).
    - UI components must be responsive to theme changes.
- [ ] **App Integration**:
    - Update `packages/frontend/src/App.tsx` with public routes for `/` and `/docs/*`.
    - Ensure public routes are accessible without authentication.
    - Redirect unauthenticated users from `/` to `/inbox` if they are already logged in (optional but recommended).

### Nice to Have

- [ ] Breadcrumbs for navigation within the documentation pages.
- [ ] Search bar placeholder in the documentation section.

### Won't Have

- [ ] Detailed "how-to" text for every edge case (focus is on the skeleton/foundation).
- [ ] New backend endpoints or database migrations.
- [ ] Image assets for docs (use placeholders).
- [ ] Hardcoded text strings (strictly forbidden).

## Constraints

- **Bilingual (EN/VI)**: All text must be translatable via `i18next`.
- **Styling**: Must use existing UI components from `packages/frontend/src/components/ui` (Radix UI/Tailwind) where possible.
- **Accuracy**: Content must reflect verified project features (e.g., AI Responder settings are found in Project Settings).
- **Theming**: Must adhere to the existing `themeStore` implementation for seamless dark/light switching.

## Open Questions

- Should the home page be served at `/` or should we keep `/login` as the entry and put the home page at `/welcome`? (Decided: Home page at `/`).