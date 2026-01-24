---
phase: 5
created: 2026-01-25
---

# Plan: Phase 5 (optional) - Concurrency Tests

## Objective

Add integration tests for the `VisitorLockService` to verify that Redis locking prevents race conditions in concurrent message processing. This provides regression protection for the critical fix in Phase 2.

## Context

- ./.gtd/fix-ai-workflow-audit/SPEC.md
- ./.gtd/fix-ai-workflow-audit/ROADMAP.md
- packages/backend/src/ai-responder/services/visitor-lock.service.ts
- packages/backend/test/utils/e2e-test.module.ts

## Architecture Constraints

- **Single Source:** Redis is the lock authority.
- **Invariants:** Only one lock can exist per visitor at a time. Lock must auto-expire.
- **Resilience:** Tests must clean up locks after each test.
- **Testability:** Tests require real Redis connection (integration test, not unit).

## Tasks

<task id="1" type="auto">
  <name>Create VisitorLockService Integration Test</name>
  <files>
    packages/backend/test/visitor-lock.e2e-spec.ts
  </files>
  <action>
    Create an E2E test file that:
    
    1. Set up test module with `VisitorLockService` and `RedisModule`.
    2. Test: `acquireLock` returns lockId on success.
    3. Test: `acquireLock` returns null when lock already held.
    4. Test: `releaseLock` returns true when lockId matches.
    5. Test: `releaseLock` returns false when lockId doesn't match.
    6. Test: Lock auto-expires after TTL.
    7. Clean up: Release all test locks in afterEach.
    
    Use real Redis connection (same as e2e tests).
  </action>
  <done>
    - Test file exists at `packages/backend/test/visitor-lock.e2e-spec.ts`.
    - Running `npm run test:e2e -- visitor-lock` passes all tests.
  </done>
</task>

## Success Criteria

- [ ] `visitor-lock.e2e-spec.ts` exists with 5+ test cases.
- [ ] All tests pass when running `npm run test:e2e -- visitor-lock`.
- [ ] Tests verify lock acquisition, release, and TTL expiry.
