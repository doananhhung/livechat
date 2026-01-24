# AI Workflow Audit Report

**Date:** 2026-01-25
**Scope:** Full Stack (Backend `ai-responder` + Frontend `workflow` editor)
**Status:** Audit Complete

## Executive Summary

The AI Workflow system is architecturally sound with a functional state machine, robust failover mechanisms for LLM providers, and exact alignment between frontend node handles and backend routing logic. However, a **critical race condition** in state persistence puts workflow transitions at risk of corruption under concurrent load. Additionally, maintenance overhead is high due to **distributed tool definitions** that must be manually synced across three codebase locations.

## Critical Flaws (Logic & Reliability)

### 1. State Persistence Race Condition

- **Severity:** High
- **Location:** `AiResponderService.ts` (Backend)
- **Issue:** The service reads `conversation.metadata` at the start of execution and effectively overwrites it at the end. If a visitor sends multiple messages rapidly, parallel execution threads will race. The last thread to finish will overwrite the `workflowState` of the first, potentially causing the workflow to "forget" a step transition or loop infinitely.
- **Impact:** Flaky workflow behavior, lost conversation context.

### 2. Missing Handler for `trigger` Node

- **Severity:** Medium
- **Location:** `WorkflowEngineService.ts` (Backend)
- **Issue:** The backend logic references a `trigger` node type in context generation but lacks a handler in the main `executeStep` switch block.
- **Impact:** If a `trigger` node is ever introduced to a workflow, execution will silently stall.

## Maintenance Risks

### 1. Distributed Tool Definitions ("Manual Sync")

- **Severity:** Medium
- **Location:** `AiToolExecutor.ts` (Backend), `NodeConfigPanel.tsx` (Frontend), `GlobalToolsPanel.tsx` (Frontend)
- **Issue:** The list of available tools (`send_form`, `change_status`, `add_visitor_note`) is hardcoded in three separate places.
- **Impact:** Adding a new tool requires flawless memory to update all three files. Forgetting one leads to runtime errors ("Tool not found") or UI inability to configure valid tools.

### 2. Fragile System User Logic

- **Severity:** Low
- **Location:** `AiToolExecutor.ts` (Backend)
- **Issue:** `change_status` tool execution relies on passing the string `'system'` to `conversationService.updateStatus`. This relies on implicit service behavior rather than an explicit system actor pattern.

## Code Quality & Orphans

- **Orphan Code:** The `trigger` node type reference in backend is effectively dead code.
- **Code Quality:**
  - **Frontend:** Excellent alignment. Handle IDs match backend routing logic perfectly. Theme integration is correct.
  - **Backend:** Robust Circuit Breaker pattern implementation for LLM resiliency.

## Recommendations

1. **Implement Locking:** Add a per-visitor mutex/lock in `AiResponderService` to serialize message processing and prevent metadata overwrite.
2. **Shared Tool Constants:** Move tool names and definitions to `@live-chat/shared-types` to act as a Single Source of Truth for both frontend and backend.
3. **Explicit System Actor:** Define a constant system user ID for automated actions to ensure DB integrity.
