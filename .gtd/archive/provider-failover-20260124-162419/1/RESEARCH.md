# Research: Phase 1 (Provider Abstraction)

**Status:** COMPLETE
**Created:** Saturday, January 24, 2026

## Findings

### 1. Existing Implementation
- `AiResponderService` (src/ai-responder/ai-responder.service.ts) currently hardcodes `OpenAI` client usage.
- It initializes `OpenAI` with `GROQ_API_KEY` and `https://api.groq.com/openai/v1`.
- It reads `GROQ_MODEL` (defaults to `openai/gpt-oss-120b`).
- The `generateResponse` method takes `messages` and `systemPrompt`.

### 2. Interface Design
- We need an interface `LLMProvider` that mirrors the core functionality of `generateResponse`.
- The interface should look like:
  ```typescript
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export interface LLMProvider {
    name: string;
    generateResponse(messages: ChatMessage[], systemPrompt: string): Promise<string>;
  }
  ```
- This fits the existing data flow perfectly.

### 3. Implementations
- **GroqProvider:** Will wrap the existing `OpenAI` client logic but configured for Groq.
- **OpenAIProvider:** Will wrap `OpenAI` client logic configured for OpenAI (official).
- Both will need `ConfigService` injected to read their specific keys/models.

### 4. Dependency Injection
- We should register these providers in `AiResponderModule`.
- We can export them so the future `ProviderManager` can inject them.

## Plan Recommendations
- Create `src/ai-responder/providers/` directory.
- Define `llm-provider.interface.ts`.
- Create `groq.provider.ts` and `openai.provider.ts`.
- Ensure strict typing for `ChatMessage`.
