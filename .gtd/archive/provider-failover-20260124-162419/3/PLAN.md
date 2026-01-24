---
phase: 3
created: Saturday, January 24, 2026
---

# Plan: Phase 3 - Integration & Switchover

## Objective

Replace the legacy direct OpenAI integration in `AiResponderService` with the new `LLMProviderManager`, enabling the full failover capability.

## Context

- ./.gtd/provider-failover/SPEC.md
- ./.gtd/provider-failover/3/RESEARCH.md
- `src/ai-responder/ai-responder.service.ts`

## Architecture Constraints

- **Single Source:** Service must rely solely on `LLMProviderManager` for generation.
- **Invariants:** Message history formatting must be preserved and compatible with `ChatMessage` interface.
- **Resilience:** Errors from the manager (all providers failed) must be caught and logged.
- **Testability:** Service logic becomes simpler and easier to test by mocking the manager.

## Tasks

<task id="1" type="auto">
  <name>Refactor AiResponderService</name>
  <files>src/ai-responder/ai-responder.service.ts</files>
  <action>
    Refactor `AiResponderService`:
    - Remove `OpenAI` import and private property.
    - Remove `GROQ_API_KEY` / `GROQ_MODEL` reading from constructor.
    - Inject `LLMProviderManager` in constructor.
    - Remove private `generateResponse` method.
    - In `handleVisitorMessage`:
      - Construct `ChatMessage[]` array (cast roles strictly if needed).
      - Call `this.llmProviderManager.generateResponse(messages, systemPrompt)`.
      - Handle errors gracefully (already done by existing try-catch).
  </action>
  <done>Service uses LLMProviderManager and no longer depends on direct OpenAI client.</done>
</task>

<task id="2" type="auto">
  <name>Verify Integration</name>
  <files>src/ai-responder/ai-responder.service.ts</files>
  <action>
    Review the file to ensure:
    - No direct keys are read.
    - Types are correct (`ChatMessage` casting).
    - Imports are clean.
  </action>
  <done>Code is clean and compiles without unused imports.</done>
</task>

## Success Criteria

- [ ] `AiResponderService` is fully decoupled from specific providers.
- [ ] Provider selection logic is delegated to `LLMProviderManager`.
- [ ] Application compiles successfully.
