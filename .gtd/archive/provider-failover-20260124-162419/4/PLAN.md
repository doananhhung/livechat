---
phase: 4
created: Saturday, January 24, 2026
---

# Plan: Phase 4 - Enhanced Observability

## Objective

Improve system observability by emitting structured events for circuit breaker state changes and provider failovers. This enables future monitoring and alerting integration.

## Context

- ./.gtd/provider-failover/SPEC.md
- ./.gtd/provider-failover/ROADMAP.md
- ./.gtd/provider-failover/4/RESEARCH.md
- `src/ai-responder/utils/circuit-breaker.ts`
- `src/ai-responder/services/llm-provider.manager.ts`

## Architecture Constraints

- **Decoupling:** `CircuitBreaker` should remain a generic utility and not depend directly on NestJS `EventEmitter`. It should use callbacks.
- **Events:** Use standard `EventEmitter2` patterns.
- **Payloads:** Events must include sufficient context (provider name, old state, new state, error reason).

## Tasks

<task id="1" type="auto">
  <name>Enhance Circuit Breaker with Callbacks</name>
  <files>src/ai-responder/utils/circuit-breaker.ts</files>
  <action>
    Update `CircuitBreaker`:
    - Add `onStateChange` optional callback to constructor: `(name: string, from: CircuitState, to: CircuitState) => void`.
    - In `transitionTo`, invoke this callback if it exists.
  </action>
  <done>CircuitBreaker invokes the callback on state transitions.</done>
</task>

<task id="2" type="auto">
  <name>Emit Events in LLMProviderManager</name>
  <files>src/ai-responder/services/llm-provider.manager.ts</files>
  <action>
    Update `LLMProviderManager`:
    - Inject `EventEmitter2`.
    - In `registerProvider`, pass a callback to `CircuitBreaker` that emits `ai.circuit.state_change` with payload `{ provider: string, from: string, to: string }`.
    - In `generateResponse`, emit `ai.provider.failover` when a provider fails, with payload `{ failedProvider: string, error: string, nextProvider: string | null }`.
  </action>
  <done>Manager emits structured events for monitoring.</done>
</task>

## Success Criteria

- [ ] `CircuitBreaker` notifies state changes via callback.
- [ ] `ai.circuit.state_change` event is emitted.
- [ ] `ai.provider.failover` event is emitted.
