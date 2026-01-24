---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Feature Section UI

## Objective

Build and integrate the "Advantages" section into the Home Page. This section will use a responsive grid to showcase the platform's key business features using Lucide icons and the localized text defined in Phase 1.

## Context

- `/.gtd/homepage-advantages-section/SPEC.md`
- `packages/frontend/src/pages/public/HomePage.tsx`
- `packages/frontend/src/i18n/locales/en.json`

## Architecture Constraints

- **Consistency:** Use the same `bg-card`, `border`, and `shadow` patterns as the "Steps" section.
- **Responsiveness:** Grid must transition from 1 column (mobile) to 2 columns (tablet) to 3 columns (desktop).
- **Icons:** Use Lucide React icons with a consistent size and color (e.g., `primary` color).

## Tasks

<task id="1" type="auto">
  <name>Implement Advantages Section in HomePage.tsx</name>
  <files>packages/frontend/src/pages/public/HomePage.tsx</files>
  <action>
    1. Import Lucide icons: `Bot`, `Puzzle`, `Layers`, `UserSearch`, `Quote`, `ShieldCheck`, `ClipboardList`.
    2. Define an array of advantage objects (icon, title key, desc key) to keep JSX clean.
    3. Create a new `<section>` after the "Steps" section.
    4. Implement the grid layout and map through the advantages to render cards.
    5. Ensure each card has a hover shadow effect for a professional feel.
  </action>
  <done>
    - `HomePage.tsx` contains the new "Advantages" section.
    - 7 feature cards are rendered with correct icons and localized text.
    - Section title and subtitle are localized.
  </done>
</task>

<task id="2" type="auto">
  <name>Responsive & Visual Refinement</name>
  <files>packages/frontend/src/pages/public/HomePage.tsx</files>
  <action>
    1. Verify grid behavior across breakpoints (sm, md, lg).
    2. Add subtle `group-hover` transitions to icons or cards if it enhances the UX.
    3. Ensure spacing (padding/margins) is consistent with the rest of the page.
  </action>
  <done>
    - Grid looks correct on mobile, tablet, and desktop.
    - Visual transitions are smooth and consistent.
  </done>
</task>

## Success Criteria

- [ ] "Advantages" section is visible below "How it works".
- [ ] 7 distinct feature cards are displayed with appropriate Lucide icons.
- [ ] All text is correctly translated when switching languages.
- [ ] Layout is responsive and preserves readability on small screens.
