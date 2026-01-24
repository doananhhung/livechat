---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Core Content & Essentials

## Objective

Populate the existing skeleton documentation pages with meaningful, user-centric guides for the most critical initial workflows: Platform Overview, Security (Authentication), and Management (Projects/Teams). This establishes the base "tone" of the documentation and helps new users get started immediately.

## Context

- `/.gtd/populate-docs-content/SPEC.md`
- `packages/frontend/src/pages/public/docs/DocsIndex.tsx`
- `packages/frontend/src/pages/public/docs/SecurityDocs.tsx`
- `packages/frontend/src/pages/public/docs/ManagementDocs.tsx`
- `packages/frontend/src/i18n/locales/*.json` (Must update both EN and VI)

## Architecture Constraints

- **Single Source of Truth:** All text content MUST reside in `en.json` and `vi.json`. No hardcoded strings in JSX.
- **Structure:** Content must fit within the existing `DocsLayout` structure using the `prose` (Tailwind Typography) class for formatting.
- **Navigation:** Use internal `<Link>` components for "Deep Links" to app settings (e.g., `/settings/security`).

## Tasks

<task id="1" type="auto">
  <name>Populate Overview & Security Docs (EN/VI)</name>
  <files>
    packages/frontend/src/pages/public/docs/DocsIndex.tsx
    packages/frontend/src/pages/public/docs/SecurityDocs.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update `DocsIndex.tsx` to include "Quick Start" steps (Register -> Create Project -> Embed).
    2. Update `SecurityDocs.tsx` to guide users through 2FA setup and Password management.
    3. Add "Deep Links" to `/register`, `/settings/security`, and `/settings/profile`.
    4. Add all new keys to `docs.overview.*` and `docs.security.*` namespaces in both JSON files.
  </action>
  <done>
    - DocsIndex renders "How it works" summary.
    - SecurityDocs renders 2FA/Password guides with working links to settings.
    - All text is translatable.
  </done>
</task>

<task id="2" type="auto">
  <name>Populate Management Docs (EN/VI)</name>
  <files>
    packages/frontend/src/pages/public/docs/ManagementDocs.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update `ManagementDocs.tsx` to cover:
       - Creating Projects (Deep Link: `/settings/projects`)
       - Inviting Members & Roles (Owner/Admin/Agent)
       - Viewing Audit Logs.
    2. Add all new keys to `docs.management.*` namespace in both JSON files.
  </action>
  <done>
    - ManagementDocs renders clear instructions for team/project ops.
    - Links to project settings work.
    - Vietnamese translations are accurate.
  </done>
</task>

## Success Criteria

- [ ] `/docs` (Index) clearly explains the platform value and 3-step start.
- [ ] `/docs/security` explains 2FA and links to the configuration page.
- [ ] `/docs/management` explains Roles and Project creation.
- [ ] Switching language to Vietnamese correctly translates all new content.
