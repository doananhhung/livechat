---
phase: 1
created: Saturday, January 24, 2026
---

# Plan: Phase 1 - Provider Abstraction & Implementations

## Objective

Decouple the AI generation logic from `AiResponderService` by introducing a `LLMProvider` interface and implementing specific providers for Groq and OpenAI. This sets the foundation for the failover mechanism.

## Context

- ./.gtd/provider-failover/SPEC.md
- ./.gtd/provider-failover/ROADMAP.md
- ./.gtd/provider-failover/1/RESEARCH.md
- `src/ai-responder/ai-responder.service.ts`

## Architecture Constraints

- **Single Source:** Configuration (keys, models) comes strictly from `ConfigService`.
- **Invariants:** All providers must implement `generateResponse` with the same signature.
- **Resilience:** Providers should bubble up errors to be handled by the future Circuit Breaker.
- **Testability:** Providers should be individually testable.

## Tasks

<task id="1" type="auto">
  <name>Define LLMProvider Interface</name>
  <files>src/ai-responder/interfaces/llm-provider.interface.ts</files>
  <action>
    Define the `LLMProvider` interface and the `ChatMessage` type.
    - `name`: string (e.g., 'groq', 'openai')
    - `generateResponse(messages: ChatMessage[], systemPrompt: string): Promise<string>`
  </action>
  <done>Interface file exists and exports the required types.</done>
</task>

<task id="2" type="auto">
  <name>Implement GroqProvider</name>
  <files>src/ai-responder/providers/groq.provider.ts</files>
  <action>
    Implement `GroqProvider` implementing `LLMProvider`.
    - Inject `ConfigService`.
    - Initialize `OpenAI` client with `GROQ_API_KEY` and Groq base URL in constructor/onModuleInit.
    - Read `GROQ_MODEL` for the model.
    - Implement `generateResponse` using the client.
    - Log warnings if keys are missing (but don't crash).
  </action>
  <done>GroqProvider class is implemented and compiles.</done>
</task>

<task id="3" type="auto">
  <name>Implement OpenAIProvider</name>
  <files>src/ai-responder/providers/openai.provider.ts</files>
  <action>
    Implement `OpenAIProvider` implementing `LLMProvider`.
    - Inject `ConfigService`.
    - Initialize `OpenAI` client with `OPENAI_API_KEY` (standard URL).
    - Read `OPENAI_MODEL` for the model (default to 'gpt-4o' or similar if missing).
    - Implement `generateResponse`.
  </action>
  <done>OpenAIProvider class is implemented and compiles.</done>
</task>

## Success Criteria

- [ ] `LLMProvider` interface is defined.
- [ ] `GroqProvider` is implemented with proper config reading.
- [ ] `OpenAIProvider` is implemented with proper config reading.
