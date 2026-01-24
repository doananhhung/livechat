---
phase: 2
created: 2026-01-25
---

# Plan: Phase 2 - Fix Race Condition

## Objective

Implement Redis-based per-visitor locking in `AiResponderService` to serialize message processing for the same visitor. This prevents `conversation.metadata.workflowState` overwrites during concurrent message bursts.

## Context

- ./.gtd/fix-ai-workflow-audit/SPEC.md
- ./.gtd/fix-ai-workflow-audit/ROADMAP.md
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/ai-responder.module.ts
- packages/backend/src/redis/redis.module.ts

## Architecture Constraints

- **Single Source:** Redis is the lock authority. `REDIS_PUBLISHER_CLIENT` is already available globally.
- **Invariants:** Only one `handleVisitorMessage` can execute per visitor at a time.
- **Resilience:** Lock has TTL (30s) to prevent deadlock if process crashes. Failed lock acquisition logs warning and drops message.
- **Testability:** Lock service can be mocked for unit tests.

## Tasks

<task id="1" type="auto">
  <name>Create VisitorLockService</name>
  <files>
    packages/backend/src/ai-responder/services/visitor-lock.service.ts
  </files>
  <action>
    Create a new service that wraps Redis locking logic:
    
    1. Inject `REDIS_PUBLISHER_CLIENT` (ioredis instance).
    2. Implement `acquireLock(visitorUid: string, ttlSeconds = 30): Promise<string | null>`:
       - Key: `ai:lock:visitor:{visitorUid}`
       - Use `SET key lockId NX EX ttlSeconds`
       - `lockId` = random UUID to identify lock owner
       - Returns `lockId` on success, `null` if lock held by another
    3. Implement `releaseLock(visitorUid: string, lockId: string): Promise<boolean>`:
       - Use Lua script to atomically check lockId matches before DEL
       - Returns true if released, false if not owner
    4. Add Logger for lock acquisition/release events.
  </action>
  <done>
    - `VisitorLockService` exists with `acquireLock()` and `releaseLock()` methods.
    - TypeScript compiles without errors.
  </done>
</task>

<task id="2" type="auto">
  <name>Integrate Lock into AiResponderService</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/ai-responder/ai-responder.module.ts
  </files>
  <action>
    1. Add `VisitorLockService` to `ai-responder.module.ts` providers.
    2. Import `RedisModule` in `ai-responder.module.ts`.
    3. Inject `VisitorLockService` into `AiResponderService` constructor.
    4. In `handleVisitorMessage()`:
       - At start: Call `acquireLock(payload.visitorUid)`.
       - If `null`: Log warning "Message processing skipped, lock held for visitor {visitorUid}" and return early.
       - Wrap entire processing in try/finally block.
       - In `finally`: Call `releaseLock(payload.visitorUid, lockId)`.
    5. Do NOT catch errors in finally - let them propagate.
  </action>
  <done>
    - `AiResponderService.handleVisitorMessage()` acquires lock at start.
    - Lock is always released in `finally` block.
    - Concurrent messages for same visitor are serialized or dropped.
  </done>
</task>

## Success Criteria

- [ ] `VisitorLockService` with `acquireLock()` and `releaseLock()` is implemented.
- [ ] `handleVisitorMessage()` uses lock to serialize processing per visitor.
- [ ] Lock has 30-second TTL to prevent deadlocks.
- [ ] TypeScript compiles without errors.
- [ ] Backend restarts successfully with new code.
