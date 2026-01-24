# Research: Phase 4 (Enhanced Observability)

**Status:** COMPLETE
**Created:** Saturday, January 24, 2026

## Findings

### 1. Goal
- Enhance observability beyond basic logs.
- The roadmap specifies "Detailed logging for circuit state transitions and failover events".
- While basic logging was implemented in Phase 2, hooking into the application's event bus (`EventEmitter2`) would allow for decoupled monitoring and alerting.

### 2. Existing Infrastructure
- `EventEmitter2` is available and used in `AiResponderService`.
- `CircuitBreaker` is currently a standalone utility class, not a provider, so it doesn't have `EventEmitter` injected.
- `LLMProviderManager` is a provider and can inject `EventEmitter2`.

### 3. Strategy
- **Circuit Breaker:** Modify `CircuitBreaker` to accept an optional `onStateChange` callback or emit events if we inject an emitter. Passing a callback from the Manager is cleaner for a utility class to keep it decoupled from NestJS specifics if desired, OR we can just inject `EventEmitter2` into the Manager and have the Manager handle the events.
- **Provider Manager:**
  - Emit `ai.provider.failover` when switching providers.
  - Emit `ai.circuit.state_change` when a breaker changes state.

## Plan Recommendations

### Task 1: Add Event Emission to Circuit Breaker
- Modify `CircuitBreaker` constructor to accept an `onStateChange` callback: `(name: string, from: CircuitState, to: CircuitState) => void`.
- Call this callback in `transitionTo`.

### Task 2: Wire Events in LLMProviderManager
- Inject `EventEmitter2` into `LLMProviderManager`.
- In `registerProvider`, pass a callback to `CircuitBreaker` that emits `ai.circuit.state_change`.
- In `generateResponse`, emit `ai.provider.failover` when catching an error and trying the next provider.

### Task 3: Verify Logs/Events
- Review code to ensure events contain useful payloads (provider name, error message, timestamp).
