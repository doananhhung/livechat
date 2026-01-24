# Phase 2 Summary

**Status:** Complete
**Executed:** 2026-01-24

## What Was Done

Implemented the "Tool Execution Engine" which enables the AI to execute programmatic actions. Specifically, the AI can now call the `add_visitor_note` tool when in 'orchestrator' mode. This involved making database schema adjustments to allow system-authored notes and integrating the orchestration logic into the `AiResponderService`.

## Behaviour

**Before:**
- `VisitorNote` required an `author_id` (User), making it impossible for the system/AI to add notes.
- `AiResponderService` only handled text generation and ignored any tool-calling potential of the LLM.

**After:**
- `VisitorNote.author_id` is now nullable, allowing AI-authored notes (where author is `null`).
- `AiResponderService` is injected with `VisitorNotesService`.
- If a project is in 'orchestrator' mode, the AI is provided with the `add_visitor_note` tool definition.
- When the LLM returns tool calls, `AiResponderService` parses and executes them (currently supporting `add_visitor_note`).
- Real-time events are still emitted for AI-generated notes via the existing `VisitorNotesService` logic.

## Tasks Completed

1. ✓ Allow System-Authored Notes
   - Modified `VisitorNote` entity to make `authorId` nullable.
   - Updated `VisitorNotesService.create` to accept `null` for `authorId`.
   - Generated and executed migration `1769254498710-MakeVisitorNoteAuthorNullable`.
   - Files: `packages/backend/src/visitor-notes/entities/visitor-note.entity.ts`, `packages/backend/src/visitor-notes/visitor-notes.service.ts`

2. ✓ Inject Dependencies
   - Exported `VisitorNotesService` from `VisitorNotesModule`.
   - Imported `VisitorNotesModule` into `AiResponderModule`.
   - Files: `packages/backend/src/visitor-notes/visitor-notes.module.ts`, `packages/backend/src/ai-responder/ai-responder.module.ts`

3. ✓ Implement Tool Execution Logic
   - Defined `ADD_NOTE_TOOL` configuration in `AiResponderService`.
   - Implemented tool call parsing and execution in `handleVisitorMessage`.
   - Ensured backward compatibility (tools only sent if `aiMode === 'orchestrator'`).
   - Files: `packages/backend/src/ai-responder/ai-responder.service.ts`

## Deviations

- None.

## Success Criteria

- [x] `VisitorNote` table supports null `author_id` (migration exists).
- [x] `AiResponderService` passes tools to LLM when in 'orchestrator' mode.
- [x] `AiResponderService` executes `add_visitor_note` logic upon tool call.

## Files Changed

- `packages/backend/src/visitor-notes/entities/visitor-note.entity.ts`
- `packages/backend/src/visitor-notes/visitor-notes.service.ts`
- `packages/backend/src/visitor-notes/visitor-notes.module.ts`
- `packages/backend/src/ai-responder/ai-responder.module.ts`
- `packages/backend/src/ai-responder/ai-responder.service.ts`
- `packages/backend/src/database/migrations/1769254498710-MakeVisitorNoteAuthorNullable.ts`

## Proposed Commit Message

feat(ai-orchestrator): implement tool execution engine for AI notes

- Make VisitorNote author optional to support AI-authored notes
- Integrate VisitorNotesService into AiResponderService
- Add add_visitor_note tool capability to AI Responder
- Implement tool call handling and execution logic in backend
