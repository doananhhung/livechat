---
phase: 2
created: 2026-01-26
---

# Plan: Phase 2 - Backend Prompt Logic

## Objective

Update the backend AI services to respect the `aiConfig.language` setting. This involves injecting a strict language instruction into the System Prompt and localizing dynamic internal prompts (specifically for Switch and Condition nodes) to match the selected language.

## Context

- ./.gtd/ai-responder-language/SPEC.md
- ./.gtd/ai-responder-language/ROADMAP.md
- packages/backend/src/ai-responder/services/ai-tool.executor.ts
- packages/backend/src/ai-responder/services/workflow-engine.service.ts

## Architecture Constraints

- **Single Source:** `Project.aiConfig.language` is the configuration truth.
- **Invariants:** Internal prompts (Switch/Condition routing) must match the system instruction language to prevent LLM confusion.
- **Resilience:** Fallback to English if language is missing or invalid.
- **Testability:** Verified by inspecting logs or observing LLM output language.

## Tasks

<task id="1" type="auto">
  <name>Process Language Config</name>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    1. Update `getNodeContext` to accept the `Project` entity (or aiConfig) to access the language setting.
    2. Inject "You must reply in {Language}" instruction into the System Prompt based on the setting.
     - EN: "You must reply and reason in English."
     - VI: "Bạn phải trả lời và suy luận bằng Tiếng Việt."
  </action>
  <done>System Prompt now contains the enforced language instruction.</done>
</task>

<task id="2" type="auto">
  <name>Localize Internal Prompts</name>
  <files>packages/backend/src/ai-responder/services/workflow-engine.service.ts</files>
  <action>
    1. Update `handleConditionNode` to use Vietnamese default prompt if `language === 'vi'` and no custom prompt is set.
    2. Update `handleSwitchNode` to use Vietnamese default prompt if `language === 'vi'` and no custom prompt is set.
      - EN: "Choose the appropriate case..."
      - VI: "Chọn trường hợp phù hợp dựa trên cuộc trò chuyện..."
  </action>
  <done>Internal routing prompts match the selected project language.</done>
</task>

## Success Criteria

- [ ] System prompt includes language enforcement instruction.
- [ ] Default routing prompts (Switch/Condition) are in Vietnamese when `language='vi'`.
- [ ] Default routing prompts remain in English when `language='en'` or unset.
