# Research: Phase 1 (Home Page & Foundation)

## Findings

### 1. Theme Management
- **Store**: `useThemeStore` in `packages/frontend/src/stores/themeStore.ts` handles `light`, `dark`, and `system` modes.
- **Component**: `ThemeToggleButton` already exists in `packages/frontend/src/components/ui/ThemeToggleButton.tsx`. It uses `DropdownMenu` and is fully functional.
- **Action**: Reuse `ThemeToggleButton` directly in the new public header.

### 2. Internationalization (i18n)
- **Config**: `packages/frontend/src/i18n/index.ts` loads `en` and `vi` resources.
- **Files**: `locales/en.json` and `locales/vi.json`.
- **Missing**: No reusable `LanguageSwitcher` component exists.
- **Action**: Create `LanguageSwitcher.tsx` using `useTranslation().i18n.changeLanguage()` and the same `DropdownMenu` pattern as `ThemeToggleButton`.

### 3. Routing Architecture
- **Router**: React Router v6 in `App.tsx`.
- **Guards**: `PublicRoute` (redirects to inbox if logged in) and `ProtectedRoute`.
- **New Requirement**: The Home Page (`/`) and Docs (`/docs`) must be *truly* public—accessible to everyone, but optionally redirecting logged-in users only if they try to access strictly auth pages (like `/login`).
- **Decision**: 
    - Keep `/` public.
    - If user is logged in, the "Login" button in header changes to "Dashboard" (or similar), or we just redirect them.
    - SPEC says: "Redirect unauthenticated users from / to /inbox if they are already logged in (optional but recommended)".
    - I will implement a `PublicOnlyRoute` vs `UniversalRoute`. Actually, for the Landing Page, usually you *want* logged-in users to be able to see it too (e.g. to read docs).
    - **Refined Approach**: `App.tsx` will have `/` as a standard `Route` (no guard), but `PublicLayout` will handle the header logic (show "Go to Inbox" if logged in).

### 4. Component Structure
- **Layouts**: Currently `MainLayout` (dashboard) and `AuthLayout` (implicit in auth pages).
- **New Layout**: `PublicLayout` needed.
    - Header: Logo, Nav Links, Lang Switcher, Theme Switcher, CTA (Login/Dashboard).
    - Content: `<Outlet />`.
    - Footer: Copyright, Links.

## Plan Structure
1.  **Foundation**: Create `PublicLayout`, `LanguageSwitcher`.
2.  **Page**: Create `HomePage`.
3.  **Routing**: Wire it all up in `App.tsx`.
4.  **Content**: Update `en.json` / `vi.json` with new keys.
