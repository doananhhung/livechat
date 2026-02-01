phase: 2
created: 2026-02-01
is_tdd: false

---

# Plan: Phase 2 - Frontend UI & Integration

## Objective

Update the Workflow Editor UI to support dual execution modes for Action Nodes. Users will be able to toggle between "LLM-Driven" (AI decides arguments) and "Static" (User values) modes. The UI will conditionally render the appropriate input fields based on the selected mode.

## Context

- ./.gtd/action-node-execution-modes/SPEC.md
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **i18n:** All new labels/text MUST use translation keys. No hardcoded strings.
- **Theme Support:** Use standard UI components and CSS variables for light/dark mode compatibility.
- **Data Persistence:** The mode selection is implicit based on which data fields are populated (`toolArgs.content` vs `prompt`), but the UI needs a state to manage this toggling cleanly.

## Tasks

<task id="1" type="auto" complexity="Low">
  <name>Update i18n Locales</name>
  <risk>Missed translations cause UI bugs.</risk>
  <files>packages/frontend/src/i18n/locales/en.json, packages/frontend/src/i18n/locales/vi.json</files>
  <action>
    Add the following keys to `workflow.configPanel`:
    - `executionModeLabel`: "Execution Mode" / "Chế độ thực thi"
    - `modeLlm`: "AI Decides" / "AI Tự Quyết Định"
    - `modeStatic`: "Static Value" / "Giá Trị Cố Định"
    - `llmPromptPlaceholder2`: "Describe how the AI should generate the value..." / "Mô tả cách AI nên tạo giá trị..."
  </action>
  <done>Keys present in both JSON files.</done>
</task>

<task id="2" type="auto" complexity="Medium">
  <name>Implement NodeConfigPanel Mode Toggle</name>
  <risk>State management for switching modes needs to clear/restore data correctly to avoid invalid states (e.g., both prompt and content existing).</risk>
  <files>packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx</files>
  <action>
    1. In `NodeConfigPanel` for Action Nodes:
       - Determine current mode: If `toolArgs.content` has value -> 'static'. Else -> 'llm'. (Default to 'llm' for empty).
       - Add a generic `Select` or Radio Group for "Execution Mode".
    2. Add conditional rendering:
       - If Mode == 'static': Show `content` input (save to `data.toolArgs.content`). Clear `data.prompt` on switch or keep it hidden? *Decision: Keep simple. If they switch to static, we use content. If they switch to LLM, we use prompt.*
       - If Mode == 'llm': Show `prompt` textarea (save to `data.prompt`). Clear `data.toolArgs.content`? *Decision: To avoid backend confusion, if user selects LLM mode, we should probably clear `toolArgs.content` so backend sees it as LLM mode.*
    3. Update `handleChange` logic to handle mode switching:
       - When switching to Static: Ensure `toolArgs` is initialized.
       - When switching to LLM: Ensure `toolArgs` is cleared (or specifically `toolArgs.content` is cleared).
  </action>
  <done>UI shows toggle. Switching modes updates the node data structure correctly (clearing conflicting fields).</done>
</task>


## Success Criteria

- [ ] "Execution Mode" dropdown/toggle appears for Action Nodes.
- [ ] Selecting "Static" shows the input field and hides the prompt field.
- [ ] Selecting "AI Decides" (LLM) shows the prompt field and hides the input field.
- [ ] All text is localized.
