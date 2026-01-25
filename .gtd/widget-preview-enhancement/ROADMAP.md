# Roadmap

**Spec:** ./.gtd/widget-preview-enhancement/SPEC.md
**Goal:** Enhance the Widget Settings Preview to display the entire chat widget interface (WYSIWYG).
**Created:** 2026-01-25

## Must-Haves

- [ ] **Full Component Rendering:** Preview renders `Header`, `MessageList`, `Composer`, `Launcher` using shared components.
- [ ] **Real-time Configuration Sync:** Updates `theme`, `headerText`, `welcomeMessage`, `offlineMessage`, `companyLogoUrl`, `agentDisplayName`, `position` instantly.
- [ ] **Theme Isolation:** CSS variables applied locally, respecting selected theme independent of Dashboard theme.
- [ ] **Mock Data:** Static mock conversation display.

## Nice-To-Haves

- [ ] **Interactive Toggle:** Switch between Online/Offline preview states.
- [ ] **Mobile/Desktop Toggle:** Responsive preview sizing.

## Phases

<must-have>

### Phase 1: WYSIWYG Container & Theme Isolation

**Status**: ⬜ Not Started
**Objective**: Create the new `WidgetPreview` container that reuses widget components and correctly scopes CSS variables for theme isolation.
**Deliverables**:
- A new `WidgetPreview.tsx` component that imports `ChatWindow` components (`Header`, `MessageList`, `Composer`).
- CSS Variable scoping mechanism (mirroring the fix from `unified-theme-optimistic-ui`) applied to this specific container.
- Static mock data setup.

### Phase 2: Configuration Binding & Layout

**Status**: ⬜ Not Started
**Objective**: Connect the preview components to the `ProjectWidgetSettingsDialog` form state and handle layout positioning.
**Deliverables**:
- Real-time binding of all form fields (`headerText`, `theme`, etc.) to the preview props.
- Visualizing `position` (Bottom-Left vs Bottom-Right) within the preview container.
- Integration into the `ProjectWidgetSettingsDialog` UI (replacing the old bubble-only preview).

</must-have>

<nice-to-have>

### Phase 3: Interactive States (Optional)

**Status**: ⬜ Not Started
**Objective**: Add controls to toggle preview states without changing actual settings.
**Deliverables**:
- Online/Offline toggle.
- Mobile/Desktop view toggle.

</nice-to-have>
