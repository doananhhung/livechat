# Specification

**Status:** FINALIZED
**Created:** Saturday, January 24, 2026

## Goal

Implement a resilient AI provider architecture using the Provider pattern, Circuit Breaker, and Automatic Failover. This ensures the AI Responder remains functional even if the primary provider (e.g., Groq) experience outages.

## Requirements

### Must Have

- [ ] **Provider Abstraction:** Define a standard interface/abstract class for AI providers.
- [ ] **Multi-Provider Support:** Implement both `GroqProvider` and `OpenAIProvider`.
- [ ] **Configurable Priority:** Support `LLM_PROVIDER_PREFERENCE` environment variable to define the failover order.
- [ ] **Circuit Breaker Logic:** 
    - [ ] Track consecutive failures per provider.
    - [ ] Trip circuit (OPEN) after 5 failures.
    - [ ] Recovery window of 30 seconds (reactive).
- [ ] **Automatic Failover:** Seamlessly switch to the next available provider in the preference list upon failure or if the current provider's circuit is OPEN.
- [ ] **Model Configuration:** Support independent model strings for each provider via env vars.

### Nice to Have

- [ ] **Logging:** Explicit logs for circuit state transitions and failover triggers.

### Won't Have

- [ ] Persistent circuit breaker state (restarts with the application).
- [ ] Database-stored provider configurations.
- [ ] Load balancing or round-robin distribution.

## Constraints

- **Infrastructure:** Must use NestJS DI and `ConfigService`.
- **Memory:** State must be managed in-memory (acceptable for this scope).
- **Environment:** All secrets and preferences must come from `.env`.

## Open Questions

- None.
