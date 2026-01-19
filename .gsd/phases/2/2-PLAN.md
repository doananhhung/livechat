---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Submission UI Polish & Smart Formatting

## Objective

Enhance the visual presentation of form submissions in the dashboard to be more premium, readable, and useful. Implement smart formatting for data fields (dates, URLs) and improve the overall card aesthetic.

## Context

- packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx
- packages/frontend/src/components/features/inbox/MessagePane.tsx

## Tasks

<task type="auto">
  <name>Implement Smart Data Formatting</name>
  <files>
    packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx
  </files>
  <action>
    - Update `formatValue` function to detect and format:
      - **Dates**: Convert ISO date strings to localized readable format (e.g., "Jan 19, 2026, 10:30 AM").
      - **URLs**: Render as clickable `<a href="..." target="_blank">` links (truncated if long).
      - **Email**: Render as `mailto:` links.
    - Add "No data submitted" state if `entries` is empty.
  </action>
  <verify>
    npm run build --workspace=@live-chat/frontend
  </verify>
  <done>
    Visual verification: Date strings appear as readable text, links are clickable.
  </done>
</task>

<task type="auto">
  <name>Enhance Visual Styling</name>
  <files>
    packages/frontend/src/components/features/inbox/FormSubmissionBubble.tsx
  </files>
  <action>
    - Update container styling:
      - Use a cleaner, "premium" card design (e.g., bg-card, subtle border, shadow-sm).
      - Distinguish it from regular messages using a colored top border accent (e.g., `border-t-4 border-t-success`).
    - Improve field layout:
      - Use a grid layout for better density if many fields exist.
      - Add copy-to-clipboard button for specific field values (optional, but nice).
  </action>
  <verify>
    npm run build --workspace=@live-chat/frontend
  </verify>
  <done>
    Manual verification: Components look polished and aligned with design system.
  </done>
</task>

## Success Criteria

- [ ] Dates and emails are automatically formatted for readability.
- [ ] Submission bubble has a distinct, premium "card" look.
- [ ] Empty submissions show a clear state.
- [ ] Edit/Delete actions remain accessible.
