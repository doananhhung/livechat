---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Interactive States

## Objective

Add interactive controls to the Widget Preview to simulate different states (Online/Offline) and viewports (Desktop/Mobile) without affecting the actual saved settings.

## Context

-   `packages/frontend/src/components/features/projects/WidgetPreview.tsx`
-   `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`

## Architecture Constraints

-   **State Isolation:** The toggle state (`isOnline`, `viewMode`) must be local to the `ProjectWidgetSettingsDialog` and NOT saved to the backend.
-   **Component Purity:** `WidgetPreview` should remain a controlled component, receiving these states as props.
-   **CSS Fidelity:** Mobile view should simulate a full-screen mobile widget experience (100% width/height, no radius), while Desktop simulates the floating window.

## Tasks

<task id="1" type="auto">
  <name>Update WidgetPreview for State Overrides</name>
  <files>packages/frontend/src/components/features/projects/WidgetPreview.tsx</files>
  <action>
    -   Update `WidgetPreviewProps` to accept optional `forceOffline` (boolean) and `viewMode` ('desktop' | 'mobile').
    -   Update the rendered `<Composer>` to use `connectionStatus={forceOffline ? "disconnected" : "connected"}`.
    -   Update the root container styles based on `viewMode`:
        -   **Desktop (default):** `w-full max-w-[380px] h-[600px] max-h-full` with rounded corners (existing logic).
        -   **Mobile:** `w-full h-full rounded-none` (simulating full-screen mobile view).
    -   Update message list container to ensure it stretches correctly in mobile mode.
  </action>
  <done>
    -   Component compiles.
    -   Passing `forceOffline={true}` shows the offline state (verified via inspection or if Composer shows offline text).
    -   Passing `viewMode="mobile"` makes the widget fill the parent container with no border radius.
  </done>
</task>

<task id="2" type="auto">
  <name>Add Preview Controls to Settings Dialog</name>
  <files>packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx</files>
  <action>
    -   Add local state: `const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')`.
    -   Add local state: `const [isOnline, setIsOnline] = useState(true)`.
    -   In the Right Column (Preview area), add a toolbar above the `WidgetPreview`.
    -   **Toolbar Content:**
        -   Toggle Group (or Buttons) for "Desktop" vs "Mobile" (use Icons if available, or text).
        -   Toggle Switch (or Checkbox/Button) for "Online" vs "Offline".
    -   Pass `viewMode={previewMode}` and `forceOffline={!isOnline}` to `WidgetPreview`.
    -   Wrap the `WidgetPreview` container in a way that handles the mobile size change gracefully (center it).
  </action>
  <done>
    -   Toolbar appears above the preview.
    -   Clicking "Mobile" expands the widget preview.
    -   Clicking "Offline" simulates the offline state.
  </done>
</task>

## Success Criteria

- [ ] User can toggle between Desktop and Mobile views.
- [ ] User can toggle between Online and Offline states.
- [ ] Mobile view takes up full available space in the preview container.
- [ ] Offline state renders the offline message/composer state.
