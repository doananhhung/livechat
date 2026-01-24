---
phase: 1
created: 2026-01-25
---

# Plan: Phase 1 - Architectural Foundation & Terminology

## Objective
Establish the structural ground truth of the AI/Workflow modules, resolve naming ambiguities between "AI Workflow" and "Status Automation", and verify the persistence layer for AI configurations.

## Context
- ./.gtd/audit-ai-workflow/SPEC.md
- ./.gtd/audit-ai-workflow/1/RESEARCH.md
- packages/backend/src/ai-responder/
- packages/backend/src/modules/workflow/
- packages/backend/src/projects/entities/project.entity.ts

## Architecture Constraints
- **Single Source:** `Project` entity must match the database schema defined in migrations.
- **Invariants:** The term "Workflow" must be clearly disambiguated in documentation and analysis.
- **Resilience:** Background jobs (Status Automation) must be decoupled from the real-time AI flow.

## Tasks

<task id="1" type="auto">
  <name>Map Architecture & Terminology</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.module.ts
    packages/backend/src/modules/workflow/workflow.module.ts
  </files>
  <action>
    Analyze the dependency graph and create a textual map of the two distinct "Workflow" systems.
    - Identify all entry points for `WorkflowEngineService`.
    - Identify all producers for `conversation-workflow-queue`.
    - Document the findings in `.gtd/audit-ai-workflow/1/ARCHITECTURE_MAP.md`.
  </action>
  <done>ARCHITECTURE_MAP.md exists and clearly differentiates the two systems.</done>
</task>

<task id="2" type="auto">
  <name>Verify Persistence Synchronization</name>
  <files>
    packages/backend/src/projects/entities/project.entity.ts
    packages/backend/src/database/migrations/1769253859605-AddAiOrchestratorConfig.ts
  </files>
  <action>
    Check if `Project` entity contains `ai_mode` and `ai_config` properties.
    - If missing, flag as critical technical debt in the report.
    - Verify if `ai_config` has a defined type or is just `jsonb` / `any`.
    - Document findings in `.gtd/audit-ai-workflow/1/PERSISTENCE_AUDIT.md`.
  </action>
  <done>PERSISTENCE_AUDIT.md exists with entity-migration comparison.</done>
</task>

<task id="3" type="auto">
  <name>Audit DTO & Shared Types</name>
  <files>
    packages/shared-types/src/workflow.types.ts
    packages/shared-types/src/ai-tools.ts
    packages/backend/src/ai-responder/services/workflow-engine.service.ts
  </files>
  <action>
    Analyze the type definitions for the AI Workflow.
    - Verify if `WorkflowDefinition` in shared-types matches the structure expected by `WorkflowEngineService`.
    - Check for any "any" types or loose typing in the workflow execution engine.
    - Document findings in `.gtd/audit-ai-workflow/1/TYPE_AUDIT.md`.
  </action>
  <done>TYPE_AUDIT.md exists with type safety analysis.</done>
</task>

## Success Criteria
- [ ] Two distinct systems (AI vs Status) are mapped.
- [ ] Project entity sync with migration is verified.
- [ ] Type safety of the Workflow Engine is assessed.
