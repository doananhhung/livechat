---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - Content Foundation (i18n)

## Objective

Define all marketing copy for the new "Advantages" section in both English and Vietnamese. This ensures the content is finalized and localized before the UI components are built.

## Context

- `/.gtd/homepage-advantages-section/SPEC.md`
- `packages/frontend/src/i18n/locales/en.json`
- `packages/frontend/src/i18n/locales/vi.json`

## Architecture Constraints

- **Single Source of Truth:** All marketing text MUST be stored in the i18n JSON files. No hardcoded strings in JSX.
- **Naming Convention:** Use `home.advantages.{feature}.{title|desc}` structure.

## Tasks

<task id="1" type="auto">
  <name>Add Advantage Translations (EN/VI)</name>
  <files>
    packages/frontend/src/i18n/locales/en.json
    packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. Add the `advantages` object under the `home` namespace in `en.json` with 7 features (AI, Widget, Management, Context, Canned, Notes, Templates).
    2. Add the corresponding translated `advantages` object to `vi.json`.
    3. Ensure descriptions are concise and benefit-driven.
  </action>
  <done>
    - `en.json` contains `home.advantages` with 14 keys (7 titles, 7 descriptions).
    - `vi.json` contains the same keys translated into Vietnamese.
  </done>
</task>

## Success Criteria

- [ ] All 7 advantages have professional titles and descriptions in both languages.
- [ ] JSON structure is valid and consistent across files.
