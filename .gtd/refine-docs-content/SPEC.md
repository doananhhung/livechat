# Specification

**Status:** FINALIZED
**Created:** 2026-01-24

## Goal

Refine the public documentation for "Action Templates" and "AI Responder" to accurately reflect the application's implementation based on codebase research.

## Requirements

### Must Have

- [ ] **Action Templates Refinement:**
  - Clarify that these are forms sent by agents for visitors to fill out.
  - Remove descriptions implying they are purely internal/backend automation.
- [ ] **AI Responder Rewrite:**
  - Correct the trigger condition: It only activates when no agents are online (`agentCount === 0`).
  - Correct the configuration: Driven by "System Prompt", no per-project API key or fallback message required in the UI.
- [ ] **Internationalization:**
  - Update `en.json` and `vi.json` with corrected text.
  - Add `docs.automation.ai.persona` key for explaining the System Prompt.

### Nice to Have

- None.

### Won't Have

- Technical architecture details.
- Image/Screenshot hosting.

## Constraints

- Must fit within existing `EfficiencyDocs.tsx` and `AutomationDocs.tsx` pages.

## Open Questions

- None.
