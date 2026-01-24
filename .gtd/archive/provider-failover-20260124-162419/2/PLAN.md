---
phase: 2
created: Saturday, January 24, 2026
---

# Plan: Phase 2 - Resilience & Failover Logic

## Objective

Implement the resilience layer with a Circuit Breaker and a Provider Manager that orchestrates failover between multiple LLM providers based on health and preference.

## Context

- ./.gtd/provider-failover/SPEC.md
- ./.gtd/provider-failover/2/RESEARCH.md
- `src/ai-responder/interfaces/llm-provider.interface.ts`

## Architecture Constraints

- **Single Source:** `LLM_PROVIDER_PREFERENCE` defines the authoritative order.
- **Invariants:** Failed requests must trigger the next provider unless all are exhausted.
- **Resilience:** Circuit state must reset after success (CLOSED) and trip after 5 failures (OPEN).
- **Testability:** `CircuitBreaker` logic should be isolated from network calls.

## Tasks

<task id="1" type="auto">
  <name>Implement Circuit Breaker</name>
  <files>src/ai-responder/utils/circuit-breaker.ts</files>
  <action>
    Implement a generic `CircuitBreaker` class.
    - Props: `failureThreshold` (5), `recoveryTimeout` (30000ms).
    - State: `failures`, `state` ('CLOSED' | 'OPEN' | 'HALF_OPEN'), `nextAttempt`.
    - Method `execute<T>(fn: () => Promise<T>): Promise<T>`:
      - If OPEN and `now < nextAttempt`, throw error immediately.
      - If OPEN and `now > nextAttempt`, transition to HALF_OPEN (allow execution).
      - Execute `fn()`.
      - On success: Reset state to CLOSED, failures to 0.
      - On error: Increment failures. If failures >= threshold, trip to OPEN and set `nextAttempt`. Rethrow error.
  </action>
  <done>Class implemented with correct state transitions.</done>
</task>

<task id="2" type="auto">
  <name>Implement LLMProviderManager</name>
  <files>src/ai-responder/services/llm-provider.manager.ts</files>
  <action>
    Create `LLMProviderManager` service.
    - Inject `ConfigService`, `GroqProvider`, `OpenAIProvider`.
    - Wrap each provider in a `CircuitBreaker` instance (map: name -> breaker).
    - Implement `generateResponse(messages, systemPrompt)`:
      - Read `LLM_PROVIDER_PREFERENCE` (default: 'groq,openai').
      - Loop through providers in order.
      - Call `breaker.execute(() => provider.generateResponse(...))`.
      - If successful, return result.
      - If error, log warning and continue to next provider.
      - If all fail, throw error.
  </action>
  <done>Service implemented handling failover logic.</done>
</task>

<task id="3" type="auto">
  <name>Register Services in Module</name>
  <files>src/ai-responder/ai-responder.module.ts</files>
  <action>
    Update `AiResponderModule`.
    - Add `GroqProvider`, `OpenAIProvider`, `LLMProviderManager` to providers and exports.
  </action>
  <done>Module compiles and services are available for injection.</done>
</task>

## Success Criteria

- [ ] `CircuitBreaker` correctly trips after 5 failures.
- [ ] `LLMProviderManager` respects `LLM_PROVIDER_PREFERENCE`.
- [ ] Failover occurs automatically when a provider fails.
