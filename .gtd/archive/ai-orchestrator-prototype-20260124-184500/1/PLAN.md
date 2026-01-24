---
phase: 1
created: 2026-01-24
---

# Plan: Phase 1 - AI Capability & Data Model

## Objective

Prepare the infrastructure for the AI Orchestrator by updating the database schema to support new configuration modes and upgrading the LLM service layer to handle function calling (tools).

## Context

- ./.gtd/ai-orchestrator-prototype/SPEC.md
- packages/backend/src/projects/entities/project.entity.ts
- packages/backend/src/ai-responder/interfaces/llm-provider.interface.ts
- packages/backend/src/ai-responder/providers/openai.provider.ts
- packages/backend/src/ai-responder/providers/groq.provider.ts

## Architecture Constraints

- **Single Source:** The `Project` entity determines if the AI runs in 'simple' or 'orchestrator' mode.
- **Invariants:** `aiMode` MUST default to 'simple' for existing projects to prevent regressions.
- **Type Safety:** `ChatMessage` and `LLMProvider` interfaces must strictly type tool calls to avoid runtime errors when parsing LLM responses.
- **Compatibility:** Both OpenAI and Groq providers must support the same `tools` interface.

## Tasks

<task id="1" type="auto">
  <name>Update Data Model and Migration</name>
  <files>
    packages/backend/src/projects/entities/project.entity.ts
    packages/backend/src/database/migrations/{timestamp}-AddAiOrchestratorConfig.ts
  </files>
  <action>
    1. Modify `Project` entity:
       - Add `aiMode`: 'simple' | 'orchestrator' (default 'simple').
       - Add `aiConfig`: JSONB column (nullable or default empty object).
    2. Generate a new TypeORM migration file using the backend script:
       - Run `npm run migration:generate --name=AddAiOrchestratorConfig` inside `packages/backend`.
       - Verify the generated file contains the correct UP and DOWN SQL.
  </action>
  <done>
    - `Project` entity has new columns.
    - Migration file exists and contains correct SQL for UP and DOWN.
  </done>
</task>

<task id="2" type="auto">
  <name>Upgrade LLM Interfaces</name>
  <files>
    packages/backend/src/ai-responder/interfaces/llm-provider.interface.ts
  </files>
  <action>
    1. Update `ChatMessage` interface to support OpenAI-compatible message types:
       - Add optional `tool_calls` property to 'assistant' messages.
       - Add optional `tool_call_id` and `name` to 'tool' messages (if 'tool' role is added).
       - Or simply adopt a type compatible with `OpenAI.Chat.Completions.ChatCompletionMessageParam`.
    2. Define `ToolDefinition` interface (name, description, parameters schema).
    3. Update `LLMProvider.generateResponse` signature:
       - Add optional `tools: ToolDefinition[]` parameter.
       - Change return type to `Promise<LLMResponse>` where `LLMResponse` contains `{ content: string | null, toolCalls?: ToolCall[] }`.
  </action>
  <done>
    - `llm-provider.interface.ts` exports updated `ChatMessage`, `ToolDefinition`, and `LLMProvider`.
    - Build will fail for providers (expected, fixed in next task).
  </done>
</task>

<task id="3" type="auto">
  <name>Update LLM Providers</name>
  <files>
    packages/backend/src/ai-responder/providers/openai.provider.ts
    packages/backend/src/ai-responder/providers/groq.provider.ts
  </files>
  <action>
    1. Update `OpenAIProvider`:
       - Implement new `generateResponse` signature.
       - Map internal `ToolDefinition` to OpenAI `ChatCompletionTool`.
       - Handle `tool_calls` in the response and map to `LLMResponse`.
    2. Update `GroqProvider`:
       - Apply identical logic (since Groq uses OpenAI SDK).
  </action>
  <done>
    - Providers compile against the new interface.
    - `tools` are correctly passed to the underlying SDK.
    - Responses are correctly parsed into `LLMResponse`.
  </done>
</task>

## Success Criteria

- [ ] `Project` entity supports orchestrator configuration.
- [ ] Database migration is ready (verified by file existence).
- [ ] `LLMProvider` interface supports function calling.
- [ ] OpenAI and Groq providers compile and handle the `tools` parameter.