# Research: Phase 3 (Integration & Switchover)

**Status:** COMPLETE
**Created:** Saturday, January 24, 2026

## Findings

### 1. Goal
- Replace the legacy direct `OpenAI` client usage in `AiResponderService` with the new `LLMProviderManager`.
- Ensure all functionality (system prompt, message history formatting) remains intact.

### 2. Current State (`AiResponderService`)
- Imports `OpenAI` directly.
- Initializes it in constructor with `GROQ_API_KEY`.
- `generateResponse` method uses `this.openai.chat.completions.create`.
- Formats messages as `{ role: string, content: string }`.

### 3. Migration Plan
- **Dependency:** Remove `OpenAI` from imports and constructor. Inject `LLMProviderManager`.
- **Method:** `generateResponse(messages, systemPrompt)` in `AiResponderService` is private. We can remove it and call `this.llmProviderManager.generateResponse(...)` directly inside `handleVisitorMessage`.
- **Data Transformation:**
  - `AiResponderService` maps existing messages to `{ role: string, content: string }`.
  - `LLMProviderManager` expects `ChatMessage[]`.
  - The shapes are compatible (`role`: 'system' | 'user' | 'assistant').
  - Need to ensure strict type compatibility or cast safely.

### 4. Cleanup
- Remove `GROQ_API_KEY` and `GROQ_MODEL` reading from `AiResponderService` (now handled by providers).
- Remove `openai` property.

## Plan Recommendations

### Task 1: Refactor AiResponderService
- Modify `src/ai-responder/ai-responder.service.ts`.
- Remove legacy OpenAI logic.
- Inject `LLMProviderManager`.
- Update `handleVisitorMessage` to use the manager.

### Task 2: Verify & Cleanup
- Ensure no residual "Groq" specific code exists in the service (it should be provider-agnostic).
