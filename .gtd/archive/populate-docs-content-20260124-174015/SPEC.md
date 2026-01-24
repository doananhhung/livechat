# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Populate the public documentation (`/docs`) with practical, user-centric guides that explain how to use the application's key features. The content should be concise, actionable, and fully internationalized (English & Vietnamese), targeting support agents and end-users.

## Requirements

### Must Have

- [ ] **Overview Page Content:**
  - Introduction to the platform's core value: Real-time support, AI automation, and team collaboration.
  - "Quick Start" guide or feature highlights.
- [ ] **Security Page Content:**
  - Step-by-step guide to enabling Two-Factor Authentication (2FA).
  - Instructions for changing/resetting passwords.
  - Links to `/settings/security` and `/settings/profile`.
- [ ] **Management Page Content:**
  - How to create and switch between Projects.
  - How to invite members and manage roles (Owner, Admin, Agent).
  - How to view Audit Logs to track team activity.
  - Links to Project Settings and Audit Logs.
- [ ] **Efficiency Page Content:**
  - Explanation of Canned Responses (what they are, how to create/use them).
  - Explanation of Action Templates (automating repetitive workflows).
  - Links to the respective configuration pages.
- [ ] **Automation Page Content:**
  - Guide to configuring the AI Responder (OpenAI integration, fallback logic).
  - Instructions for customizing the Chat Widget (Theme, Position, Welcome Message).
  - Instructions for getting the Embed Code.
- [ ] **Internationalization:**
  - All text must be externalized to `en.json` and `vi.json`.
  - No hardcoded strings in components.

### Nice to Have

- [ ] "Deep Links" that take the user directly to the relevant settings page within the app (e.g., `<Link to="/settings/security">Configure 2FA</Link>`).

### Won't Have

- Developer documentation (API docs, Architecture diagrams).
- Image/Screenshot hosting or embedding (text-only descriptions for now).

## Constraints

- **Format:** User-friendly, concise language (not technical jargon).
- **Structure:** Must fit within the existing 5 skeleton pages.
- **Tech:** React components utilizing `i18n` keys.

## Open Questions

- None.
