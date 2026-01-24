---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Advanced Features

## Objective

Complete the documentation by populating the "Efficiency" and "Automation" sections. This content guides users on leveraging power-user features like Canned Responses, Action Templates, AI Responder, and Widget Customization, which are critical for scaling support operations.

## Context

- `/.gtd/populate-docs-content/SPEC.md`
- `packages/frontend/src/pages/public/docs/EfficiencyDocs.tsx`
- `packages/frontend/src/pages/public/docs/AutomationDocs.tsx`
- `packages/frontend/src/i18n/locales/*.json`

## Architecture Constraints

- **Single Source of Truth:** All text MUST be externalized to `en.json` and `vi.json`.
- **Formatting:** Use Tailwind Typography (`prose`) classes and existing UI components (Lucide icons, standard spacing).
- **Navigation:** Include "Deep Links" to relevant settings pages (e.g., `/settings/canned-responses`).

## Tasks

<task id="1" type="auto">
  <name>Populate Efficiency Docs (EN/VI)</name>
  <files>
    packages/frontend/src/pages/public/docs/EfficiencyDocs.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update `EfficiencyDocs.tsx` to cover:
       - Canned Responses: Usage (type `/`), creation, and management.
       - Action Templates: Automating forms and workflows.
       - Deep links to `/projects/:projectId/settings/canned-responses` (Note: Link will need to be generic or guide user to "Project Settings > Canned Responses" since projectId varies).
    2. Add new keys to `docs.efficiency.*` in `en.json` and `vi.json`.
  </action>
  <done>
    - EfficiencyDocs renders clear guides for Canned Responses and Action Templates.
    - Translation keys exist and are accurate in both languages.
  </done>
</task>

<task id="2" type="auto">
  <name>Populate Automation Docs (EN/VI)</name>
  <files>
    packages/frontend/src/pages/public/docs/AutomationDocs.tsx
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Update `AutomationDocs.tsx` to cover:
       - AI Responder: Setting up OpenAI key, fallback logic, and enabling it.
       - Widget Customization: Theme, color, position, and getting the embed code.
       - Deep links to "Project Settings > AI Responder" and "Project Settings > Widget".
    2. Add new keys to `docs.automation.*` in `en.json` and `vi.json`.
  </action>
  <done>
    - AutomationDocs renders clear guides for AI and Widget settings.
    - Translation keys exist and are accurate in both languages.
  </done>
</task>

## Success Criteria

- [ ] `/docs/efficiency` explains how to speed up responses using shortcuts and templates.
- [ ] `/docs/automation` explains how to set up the AI bot and customize the chat widget.
- [ ] All content is fully localized (EN/VI).
