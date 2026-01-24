# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Enhance the Home Page to clearly communicate the platform's professional advantages over standard messaging apps. This involves adding a "Features" or "Why Choose Us" section that highlights specific business-centric tools like AI automation, visitor context, and team collaboration.

## Requirements

### Must Have

- [ ] **Advantages Section:**
  - A responsive grid layout (1 col mobile, 2-3 columns desktop) following the "How it works" section.
  - 7 Feature Cards, each with an icon, title, and concise description:
    1. **AI Automation:** 24/7 bot support when agents are offline.
    2. **Embedded Widget:** One-line integration for any website.
    3. **Centralized Management:** Manage multiple projects and teams in one place.
    4. **Visitor Context:** Real-time visibility into visitor's page and history.
    5. **Canned Responses:** Rapid shortcuts for common inquiries.
    6. **Internal Notes:** Private collaboration context for agents.
    7. **Action Templates:** Custom forms sent directly to visitors.
- [ ] **Visuals:**
  - Integrated **Lucide React** icons for each advantage.
  - Consistent styling with existing card patterns (hover effects, rounded corners).
- [ ] **Internationalization:**
  - All copy externalized to `en.json` and `vi.json` under `home.advantages.*` namespace.

### Nice to Have

- [ ] Subtle animation (e.g., slide-in) for the cards as they enter the viewport.

### Won't Have

- Comparison table with specific competitors.
- Custom illustrations or external image assets (icons only).

## Constraints

- **Framework:** Must use React + Tailwind CSS.
- **Tone:** Professional, benefit-driven marketing language.

## Open Questions

- None.
