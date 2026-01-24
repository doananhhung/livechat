# Audit Report: Supplemental Backend

**Source:** `packages/backend/src/ai-responder/services/`

## Tool Executor Analysis

**File:** `ai-tool.executor.ts`

### 1. Tool Definition Management

- **Manual Sync Risk Confirmed:** Tools (`ADD_NOTE_TOOL`, `CHANGE_STATUS_TOOL`, `SEND_FORM_TOOL`) are defined as `const` objects at the top of the file. This creates a distributed truth problem when combined with the frontend's hardcoded lists (`NodeConfigPanel.tsx`, `GlobalToolsPanel.tsx`).
- **No Dead Code:** All defined tools are used in the `getTools` array method (line 105).

### 2. Execution Logic

- **Direct Repository Usage:** `change_status` logic (lines 139-169) comments mention needing to bypass permission checks or assuming a system user. It currently calls `conversationService.updateStatus` with `'system'` as userId.
- **Risk:** This relies on `conversationService` accepting `'system'` as a valid user ID or failing gracefully. This is a fragile implicit contract.

## LLM Provider Manager Analysis

**File:** `llm-provider.manager.ts`

### 1. Provider Logic

- **Circuit Breaker:** Implements a robust circuit breaker pattern (lines 72-103) with failover events.
- **Config Driven:** Uses `LLM_PROVIDER_PREFERENCE` env var.
- **Dead Code:** None found. Both Groq and OpenAI providers are injected and registered.

## Recommendations

- **Centralize Tool Definitions:** Create a `SharedToolDefinitions` constant in `@live-chat/shared-types` that BOTH backend (`AiToolExecutor`) and frontend (`NodeConfigPanel`) import.
- **System User:** Create a dedicated "AI System" user in the database with a known ID (e.g., -1) instead of using string 'system', to ensure foreign key integrity if `userId` is a relation.
