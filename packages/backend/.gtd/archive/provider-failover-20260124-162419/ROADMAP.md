# Roadmap

**Spec:** ./.gtd/provider-failover/SPEC.md
**Goal:** Implement a resilient AI provider architecture using the Provider pattern, Circuit Breaker, and Automatic Failover.
**Created:** Saturday, January 24, 2026

## Must-Haves

- [ ] **Provider Abstraction:** Define a standard interface/abstract class for AI providers.
- [ ] **Multi-Provider Support:** Implement both `GroqProvider` and `OpenAIProvider`.
- [ ] **Configurable Priority:** Support `LLM_PROVIDER_PREFERENCE` environment variable to define the failover order.
- [ ] **Circuit Breaker Logic:** Track consecutive failures per provider, trip circuit (OPEN) after 5 failures, recovery window of 30 seconds (reactive).
- [ ] **Automatic Failover:** Seamlessly switch to the next available provider in the preference list upon failure or if the current provider's circuit is OPEN.
- [ ] **Model Configuration:** Support independent model strings for each provider via env vars.

## Nice-To-Haves

- [ ] **Logging:** Explicit logs for circuit state transitions and failover triggers.

## Phases

<must-have>

### Phase 1: Provider Abstraction & Implementations

**Status**: ✅ Complete
**Objective**: Create the core interface and implement both Groq and OpenAI providers with independent configuration.

### Phase 2: Resilience & Failover Logic

**Status**: ✅ Complete
**Objective**: Implement the Circuit Breaker logic and the Manager service that orchestrates failover based on preference and provider health.

### Phase 3: Integration & Switchover

**Status**: ✅ Complete
**Objective**: Replace the direct OpenAI usage in `AiResponderService` with the new Manager service, fully enabling the new architecture.

</must-have>

<nice-to-have>

### Phase 4 (optional): Enhanced Observability

**Status**: ✅ Complete
**Objective**: Add detailed logging for circuit state transitions and failover events to aid debugging and monitoring.

</nice-to-have>
