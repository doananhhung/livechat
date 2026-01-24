# Research: Phase 2 (Resilience & Failover Logic)

**Status:** COMPLETE
**Created:** Saturday, January 24, 2026

## Findings

### 1. Requirements Recap
- **Circuit Breaker:** 5 failures → OPEN, 30s recovery window.
- **Failover:** Primary failed or OPEN → Try next provider.
- **Preference:** `LLM_PROVIDER_PREFERENCE` (e.g., "groq,openai").

### 2. Design Pattern: `ProviderManager`
- We need a central service `LLMProviderManager` that:
  1. Holds all registered providers.
  2. Manages the state of each provider (Circuit Breaker state).
  3. Orchestrates the request flow (Try P1 → Catch → Try P2).

### 3. Circuit Breaker State
- We can wrap each provider in a `CircuitBreaker` class or manage state within the manager.
- A dedicated `CircuitBreaker` class per provider instance is cleaner.
- State needed:
  - `failureCount`: number (0-5)
  - `state`: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  - `nextAttempt`: timestamp (when recovery window ends)

### 4. Reactive Health Check ("Half-Open")
- The spec calls for "reactive" health checks.
- Logic:
  - If state is OPEN and `now > nextAttempt`, enter HALF_OPEN.
  - In HALF_OPEN, allow 1 request.
  - If success → CLOSED (reset).
  - If fail → OPEN (reset timer).

### 5. Config Handling
- `ConfigService` provides `LLM_PROVIDER_PREFERENCE`.
- String split by comma to get order.

## Plan Recommendations

### Task 1: Circuit Breaker Class
- Create `src/ai-responder/utils/circuit-breaker.ts`.
- Encapsulate the state machine logic here.
- Methods: `execute(fn: () => Promise<T>)`.

### Task 2: Provider Manager Service
- Create `src/ai-responder/services/llm-provider.manager.ts`.
- Inject all providers (use `@InjectAll` or register specifically).
- Method: `generateResponse(messages, prompt)`.
- Logic: Iterate through preference list. Skip OPEN circuits unless ready for retry.

### Task 3: Integration in Module
- Update `AiResponderModule` to provide the new service.
