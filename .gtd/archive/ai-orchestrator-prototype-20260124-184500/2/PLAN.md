---
phase: 2
created: 2026-01-24
---

# Plan: Phase 2 - Tool Execution Engine

## Objective

Implement the `add_visitor_note` tool and the backend logic to execute it when called by the AI. This allows the AI to programmatically add notes to a visitor's profile.

## Context

- ./.gtd/ai-orchestrator-prototype/SPEC.md
- packages/backend/src/visitor-notes/entities/visitor-note.entity.ts
- packages/backend/src/visitor-notes/visitor-notes.service.ts
- packages/backend/src/ai-responder/ai-responder.service.ts
- packages/backend/src/ai-responder/ai-responder.module.ts

## Architecture Constraints

- **Data Integrity:** `VisitorNote` normally requires an `author` (User). For AI notes, the author will be `null`.
- **Backward Compatibility:** Tool calling should only be enabled if `project.aiMode` is 'orchestrator' (or we default to enabled for testing, but spec implies mode switch).
- **Separation of Concerns:** `AiResponderService` orchestrates; `VisitorNotesService` persists.

## Tasks

<task id="1" type="auto">
  <name>Allow System-Authored Notes</name>
  <files>
    packages/backend/src/visitor-notes/entities/visitor-note.entity.ts
    packages/backend/src/visitor-notes/visitor-notes.service.ts
    packages/backend/src/database/migrations/{timestamp}-MakeVisitorNoteAuthorNullable.ts
  </files>
  <action>
    1. Modify `VisitorNote` entity:
       - Set `authorId` column to `nullable: true`.
       - Update `author` relation to `nullable: true`.
    2. Modify `VisitorNotesService`:
       - Update `create` method signature to accept `authorId: string | null`.
       - Ensure logic handles null author (e.g., when emitting events, author might be null).
    3. Generate migration:
       - Run `npm run migration:generate --name=MakeVisitorNoteAuthorNullable` in `packages/backend`.
  </action>
  <done>
    - `VisitorNote` entity allows null author.
    - `VisitorNotesService` compiles with `string | null` authorId.
    - Migration file created.
  </done>
</task>

<task id="2" type="auto">
  <name>Inject Dependencies</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.module.ts
  </files>
  <action>
    1. Import `VisitorNotesModule` into `AiResponderModule`.
    2. Ensure `VisitorNotesService` is exported from `VisitorNotesModule` (it likely is, but verify/ensure).
  </action>
  <done>
    - `AiResponderModule` imports `VisitorNotesModule`.
  </done>
</task>

<task id="3" type="auto">
  <name>Implement Tool Execution Logic</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.service.ts
  </files>
  <action>
    1. Inject `VisitorNotesService` into `AiResponderService`.
    2. Define `ADD_NOTE_TOOL` constant (JSON schema for `add_visitor_note`).
    3. Update `handleVisitorMessage`:
       - Check `project.aiMode`. If 'orchestrator', add `ADD_NOTE_TOOL` to `generateResponse` call.
       - Handle `aiResponse.toolCalls`.
       - Loop through tool calls:
         - If `function.name === 'add_visitor_note'`:
           - Parse arguments (JSON.parse).
           - Call `visitorNotesService.create(projectId, visitorId, null, { content: args.content })`.
           - Log action.
       - Proceed to send text response (if `content` is not null).
  </action>
  <done>
    - `AiResponderService` handles `toolCalls` from LLM response.
    - `add_visitor_note` is executed when requested.
    - Text response is still sent if present.
  </done>
</task>

## Success Criteria

- [ ] `VisitorNote` table supports null `author_id` (migration exists).
- [ ] `AiResponderService` passes tools to LLM when in 'orchestrator' mode.
- [ ] `AiResponderService` executes `add_visitor_note` logic upon tool call.
