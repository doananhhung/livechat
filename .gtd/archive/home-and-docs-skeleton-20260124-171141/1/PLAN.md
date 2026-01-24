---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Home Page & Foundation

## Objective

Create the public-facing foundation of the application, including a responsive Landing Page (`HomePage`), a reusable `PublicLayout` with global navigation (Theme/Language switchers), and the necessary routing updates. This establishes the "front door" of the app.

## Context

- **Spec**: `/.gtd/home-and-docs-skeleton/SPEC.md`
- **Research**: `/.gtd/home-and-docs-skeleton/1/RESEARCH.md`
- **Existing Files**:
  - `packages/frontend/src/App.tsx` (Routing)
  - `packages/frontend/src/components/ui/ThemeToggleButton.tsx` (Reuse)
  - `packages/frontend/src/i18n/*` (Translations)

## Architecture Constraints

- **Single Source of Truth**: `i18next` for all text content; `themeStore` for visual mode.
- **Resilience**: Public pages must not crash if auth state is loading; they should degrade gracefully or show a spinner.
- **Reusability**: `LanguageSwitcher` should mimic `ThemeToggleButton` for UI consistency.
- **Routing**: `/` and `/docs` are "Universal Routes" (accessible by all), whereas `/login` remains a "Guest Only" route.

## Tasks

<task id="1" type="auto">
  <name>Create Public Layout & Switchers</name>
  <files>
    packages/frontend/src/components/features/public/LanguageSwitcher.tsx
    packages/frontend/src/components/layout/PublicLayout.tsx
  </files>
  <action>
    1. Create `LanguageSwitcher.tsx` mirroring `ThemeToggleButton` (DropdownMenu with EN/VI options).
    2. Create `PublicLayout.tsx`:
       - Header: Logo (left), Nav Links (middle), Actions (right: Lang, Theme, Login/Dashboard Button).
       - Footer: Simple copyright and "Docs" link.
       - Use `useAuthStore` to conditionally render "Login" vs "Go to Inbox" button.
       - Wraps `<Outlet />` for child routes.
  </action>
  <done>
    - `PublicLayout` component exists and renders Header/Footer.
    - `LanguageSwitcher` allows toggling between 'en' and 'vi'.
    - Header adapts CTA based on auth state.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Home Page & Translations</name>
  <files>
    packages/frontend/src/pages/public/HomePage.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update translation files with keys for `home.*` (hero title, steps, buttons) and `nav.*`.
    2. Create `HomePage.tsx`:
       - **Hero Section**: Title, Subtitle, CTA.
       - **How it Works**: 4-step grid (Sign Up, Create Project, Widget, Message).
       - Use Tailwind for responsive design (mobile-first).
  </action>
  <done>
    - `HomePage` renders correctly with translated text.
    - JSON files contain valid JSON.
  </done>
</task>

<task id="3" type="auto">
  <name>Update Routing</name>
  <files>
    packages/frontend/src/App.tsx
  </files>
  <action>
    1. Lazy load `HomePage` and `PublicLayout`.
    2. Add a new Route group for public pages:
       - Path `/` uses `PublicLayout`.
       - Index route renders `HomePage`.
    3. Ensure this route is placed *before* the catch-all `*`.
  </action>
  <done>
    - Visiting `/` shows the new Landing Page.
    - Navigation works.
  </done>
</task>

## Success Criteria

- [ ] User can visit root URL `/` and see the landing page.
- [ ] User can switch languages (EN <-> VI) and content updates immediately.
- [ ] User can switch themes (Light <-> Dark) and UI adapts.
- [ ] "Login" button appears for guests; "Inbox" button appears for logged-in users.
