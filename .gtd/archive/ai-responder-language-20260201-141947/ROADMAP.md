# Roadmap

**Spec:** ./.gtd/ai-responder-language/SPEC.md
**Goal:** Implement forced AI Responder language (English/Vietnamese) to ensure reliable native-language responses.
**Created:** 2026-01-26

## Must-Haves

- [ ] Store language setting in `project.aiConfig`
- [ ] UI to select language in `ProjectSettingsPage` (AiResponderSettingsForm)
- [ ] Inject language instruction into System Prompt
- [ ] Dynamic internal prompt translation for Switch/Condition nodes

## Nice-To-Haves

- [ ] Visual indicator in Workflow Editor (Deferred)

## Phases

### Phase 1: Database & Frontend Configuration

**Status**: ✅ Complete
**Objective**: Allow project admins to select and save the AI language preference.

**Scope:**

- Modify frontend `AiResponderSettingsForm` to include a "Language" select input.
- Defaults to user's interface language for new configurations.
- Persist selection in existing `project.aiConfig` payload.
- Verify persistence via API.

---

### Phase 2: Backend Prompt Logic

**Status**: ⬜ Not Started
**Objective**: Enforce the selected language in the AI reasoning process.

**Scope:**

- Update `AiToolExecutor` or `AiResponderService` to read the project's language setting.
- Inject the specific "Must reply in {lang}" instruction into the System Prompt.
- implement dynamic localization for default routing prompts in `WorkflowEngineService`.
- Verify partial updates (e.g. switch nodes using default prompts get translated, custom prompts are left alone).
