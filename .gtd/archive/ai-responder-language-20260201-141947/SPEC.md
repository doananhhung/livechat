# Specification

**Status:** FINALIZED
**Created:** 2026-01-26

## Goal

Add an "AI Language" setting to the Project configuration to force the AI Responder to operate consistently in a specific language (English or Vietnamese). This ensures reliable, native-language responses and internal reasoning.

## Requirements

### Must Have

- **Data Storage:**
  - Store the selected language (e.g., `language: 'en' | 'vi'`) inside the existing `project.aiConfig` JSON structure.
- **Configuration UI:**
  - Add a "Language" dropdown to the `AiResponderSettingsForm` in `ProjectSettingsPage`.
  - Values: `English` (default), `Vietnamese`.
  - On first load (if unset), default to the user's current interface language.

- **Backend Logic (The Core):**
  - **System Prompt Injection:** Append a strong instruction to the System Prompt:
    - If `vi`: _"Bạn phải trả lời và suy luận bằng Tiếng Việt."_
    - If `en`: _"You must reply and reason in English."_
  - **Dynamic Internal Prompts:** Ensure internal reasoning prompts (specifically for **Switch Node** and **Condition Node**) match the selected language.
    - _Current State:_ Switch/Condition nodes typically have default English prompts ("Based on conversation...").
    - _New Behavior:_ If `language === 'vi'`, substitute these defaults with Vietnamese equivalents before sending to the LLM.

### Nice to Have

- [ ] Visual indicator in the Workflow Editor showing which language is currently active.

### Won't Have

- Automatic per-message language detection (we rely on the explicit setting).
- User-customizable templates for the _internal_ routing prompts (we will hardcode high-quality defaults for EN/VI).

## Constraints

- Only 'en' and 'vi' supported initially.
- Must be backward compatible (existing projects default to 'en' or current behavior).

## Open Questions

- None. Both database location and prompt strategy are clarified.
