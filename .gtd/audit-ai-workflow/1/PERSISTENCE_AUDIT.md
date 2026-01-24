# Persistence Audit: AI Configuration

**Date:** 2026-01-25
**Scope:** `packages/backend/src/projects/entities/project.entity.ts` vs `1769253859605-AddAiOrchestratorConfig.ts`

## Findings

### 1. Synchronization Status: ✅ SYNCED

The `Project` entity correctly reflects the database schema changes introduced in migration `1769253859605`.

| Column | Migration Definition | Entity Definition | Status |
| :--- | :--- | :--- | :--- |
| `ai_mode` | `varchar NOT NULL DEFAULT 'simple'` | `@Column({ type: 'varchar', default: 'simple', name: 'ai_mode' })` | **MATCH** |
| `ai_config` | `jsonb` | `@Column({ type: 'jsonb', nullable: true, name: 'ai_config' })` | **MATCH** |

### 2. Type Safety Analysis

-   **`aiMode`:** Typed as `'simple' | 'orchestrator'`. This is good, restricts invalid strings at the TypeScript level.
-   **`aiConfig`:** Typed as `WorkflowDefinition | Record<string, any> | null`.
    -   **Pros:** Imports `WorkflowDefinition` from `@live-chat/shared-types`.
    -   **Cons:** The union with `Record<string, any>` loosens the type safety, allowing unstructured JSON to be assigned without validation. Ideally, this should be strictly `WorkflowDefinition`.

### 3. Legacy Fields

The entity still contains legacy AI fields which might be redundant if `aiMode` is 'orchestrator':
-   `aiResponderEnabled` (boolean)
-   `aiResponderPrompt` (text)

**Recommendation:** Clarify if `ai_mode='simple'` uses these legacy fields, or if they should be deprecated in favor of a unified `aiConfig`.
