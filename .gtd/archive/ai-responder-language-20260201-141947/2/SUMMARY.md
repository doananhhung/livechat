# Phase 2 Summary

**Status:** Complete
**Executed:** 2026-01-26

## What Was Done

Updated the backend AI engine to respect the `aiConfig.language` setting. This included system-level language enrichment and localization of internal routing prompts.

## Behaviour

**Before:** The AI received no specific language instruction and used English defaults for internal Switch/Condition routing prompts regardless of project context.
**After:**

- The System Prompt now contains a directive: "Bạn phải trả lời và suy luận bằng Tiếng Việt" (VI) or "You must reply and reason in English" (EN).
- **Condition Nodes:** Default routing prompts are automatically served in Vietnamese when the project language is set to 'vi'.
- **Switch Nodes:** Default instruction and available case lists are dynamically localized to Vietnamese when the project language is set to 'vi'.

## Tasks Completed

1. ✓ Process Language Config
   - Injected language directive into `systemPrompt` in `getNodeContext`.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

2. ✓ Localize Internal Prompts
   - Localized `handleConditionNode` and `handleSwitchNode` default messages.
   - Files: `packages/backend/src/ai-responder/services/workflow-engine.service.ts`

## Deviations

None.

## Success Criteria

- [x] System prompt includes language enforcement instruction.
- [x] Default routing prompts (Switch/Condition) are in Vietnamese when `language='vi'`.
- [x] Default routing prompts remain in English when `language='en'` or unset.

## Files Changed

- `packages/backend/src/ai-responder/services/workflow-engine.service.ts` — Implemented prompt localization and injection logic.

## Proposed Commit Message

feat(ai-lang): implement backend language enforcement and localization

- Inject strict language instruction into system prompt based on project config
- Localize default routing prompts for Switch and Condition nodes
- Support English and Vietnamese reasoning paths
