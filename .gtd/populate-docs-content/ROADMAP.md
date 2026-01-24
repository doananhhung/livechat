# Roadmap

**Spec:** ./.gtd/populate-docs-content/SPEC.md
**Goal:** Populate the public documentation (`/docs`) with practical, user-centric guides.
**Created:** 2026-01-24

## Must-Haves

- [ ] Overview Page Content (Intro + Quick Start)
- [ ] Security Page Content (2FA, Password + Deep Links)
- [ ] Management Page Content (Projects, Members, Audit Logs + Deep Links)
- [ ] Efficiency Page Content (Canned Responses, Action Templates + Deep Links)
- [ ] Automation Page Content (AI Responder, Widget Customization + Deep Links)
- [ ] Internationalization (EN/VI for all content)

## Nice-To-Haves

- [ ] "Deep Links" that take the user directly to the relevant settings page within the app (Integrated into Must-Have content for better UX).

## Phases

<must-have>

### Phase 1: Core Content & Essentials
**Status**: ✅ Complete
**Objective**: Populate the primary entry point (Overview) and critical Security/Management guides. This establishes the "tone" and covers the most essential administrative tasks.
**Criteria**:
- `DocsIndex.tsx` populated with Platform Intro & Feature Highlights.
- `SecurityDocs.tsx` populated with 2FA & Password guides + Links.
- `ManagementDocs.tsx` populated with Project/Member/Audit guides + Links.
- `en.json` and `vi.json` updated with all corresponding keys.

### Phase 2: Advanced Features
**Status**: ✅ Complete
**Objective**: Document the power-user features: Efficiency tools (Canned Responses, Action Templates) and Automation (AI, Widget).
**Criteria**:
- `EfficiencyDocs.tsx` populated with Canned Responses & Action Templates guides + Links.
- `AutomationDocs.tsx` populated with AI Responder & Widget Customization guides + Links.
- `en.json` and `vi.json` updated with all corresponding keys.

</must-have>
