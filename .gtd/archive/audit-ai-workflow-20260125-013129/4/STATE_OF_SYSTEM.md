# State of the System: AI & Workflow Subsystems

**Date:** 2026-01-25
**Scope:** AI Responder, Status Automation, Workflow Engine

## 1. Health Scorecard

| Area | Score | Trend | Rationale |
| :--- | :---: | :---: | :--- |
| **Reliability** | **D** | 📉 | Critical "Stale Save" race condition guarantees data loss in concurrent scenarios. |
| **Maintainability** | **C+** | ➡️ | Code is clean but suffers from significant terminology confusion ("Two Workflows"). |
| **Security** | **B** | ➡️ | Robust locking mechanisms prevent parallel AI executions, but loose typing allows potential runtime exploits via config. |
| **Architecture** | **B-** | ➡️ | Good separation of concerns (Providers, Engine), but marred by the persistence strategy flaw. |

---

## 2. Critical Risk Registry

### 🚨 Risk-001: Data Loss via Stale Save
- **Severity:** **CRITICAL** (Data Loss, Customer Impact)
- **Likelihood:** **HIGH** (In active conversations)
- **Description:** The `AiResponderService` performs a "Check-Then-Act" operation spanning 5-30 seconds (LLM latency). It saves a stale snapshot of the `Conversation` entity, silently overwriting any changes (messages, assignments, status updates) that occurred during the interval.
- **Affected Component:** `packages/backend/src/ai-responder/ai-responder.service.ts`
- **Mitigation:** Requires immediate refactoring to Atomic Updates or Optimistic Locking.

---

## 3. Technical Debt Radar

### ⚠️ Debt-001: The "Workflow" Homonym
- **Type:** Cognitive Debt
- **Description:** Two unrelated systems share the name "Workflow":
  1. `AiResponderModule` (The actual Node/Edge Workflow Engine)
  2. `WorkflowModule` (Legacy Background Job / Status Automation)
- **Impact:** High confusion for new developers; potential for dangerous misconfiguration.

### ⚠️ Debt-002: Runtime Type Safety
- **Type:** Reliability Debt
- **Description:** The `WorkflowEngineService` blindly casts `node.data` properties (e.g., `toolName`).
- **Impact:** Malformed `ai_config` JSON can crash the application at runtime.

---

## 4. Architecture Summary
- **AI Engine:** Stateless, traverse-based execution. **Solid.**
- **Persistence:** Uses TypeORM `save()` on stale entities. **Broken.**
- **Concurrency:** Visitor-based locking (Redis). **Good.**
- **Integration:** Event-driven (`visitor.message.received`). **Standard.**
