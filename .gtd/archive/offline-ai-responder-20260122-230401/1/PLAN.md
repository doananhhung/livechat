---
phase: 1
created: 2026-01-22
---

# Plan: Phase 1 - Foundation & Detection (Backend)

## Objective

Establish the data model for AI configuration and implement the mechanism to detect when human agents are offline. This lays the groundwork for the AI to know *when* to activate.

## Context

- `packages/backend/src/projects/entities/project.entity.ts`: Project entity to extend.
- `packages/backend/src/gateway/events.gateway.ts`: WebSocket gateway to query for agent presence.
- `packages/shared-dtos/src/update-project.dto.ts`: DTO to update.

## Tasks

<task id="1" type="auto">
  <name>Update Project Schema & DTO</name>
  <files>
    packages/backend/src/projects/entities/project.entity.ts
    packages/shared-dtos/src/update-project.dto.ts
  </files>
  <action>
    1.  Add columns to `Project` entity:
        -   `aiResponderEnabled`: boolean, default false.
        -   `aiResponderPrompt`: text, nullable.
    2.  Update `UpdateProjectDto` in `shared-dtos` to include these optional fields.
    3.  Generate migration named `AddAiResponderToProject` and run it.
  </action>
  <done>
    -   Migration file exists in `packages/backend/src/database/migrations`.
    -   Database schema updated.
    -   `UpdateProjectDto` has new fields.
  </done>
</task>

<task id="2" type="auto">
  <name>Implement Agent Presence Logic</name>
  <files>
    packages/backend/src/gateway/events.gateway.ts
  </files>
  <action>
    1.  Add method `getOnlineAgentCount(projectId: number): Promise<number>` to `EventsGateway`.
    2.  Implementation:
        -   Use `this.server.in('project:${projectId}').fetchSockets()`.
        -   Filter sockets that have `socket.data.user` (authenticated agents).
        -   Return the count.
  </action>
  <done>
    -   `getOnlineAgentCount` method exists and returns a Promise<number>.
  </done>
</task>

<task id="3" type="auto">
  <name>Create AI Responder Service Skeleton</name>
  <files>
    packages/backend/src/ai-responder/ai-responder.module.ts
    packages/backend/src/ai-responder/ai-responder.service.ts
    packages/backend/src/app.module.ts
  </files>
  <action>
    1.  Create `AiResponderModule` and `AiResponderService`.
    2.  Import `GatewayModule` into `AiResponderModule`.
    3.  Inject `EventsGateway` into `AiResponderService`.
    4.  Implement `isAiActive(projectId: number): Promise<boolean>`:
        -   (Stub for now) Fetch project config (mocked or injected ProjectService later) and call `eventsGateway.getOnlineAgentCount`.
        -   Return true if enabled AND agents == 0.
    5.  Register `AiResponderModule` in `AppModule`.
  </action>
  <done>
    -   `AiResponderModule` is registered in `AppModule`.
    -   `AiResponderService` can be injected and calling `isAiActive` calls gateway.
  </done>
</task>

## Success Criteria

- [ ] `Project` table has `aiResponderEnabled` and `aiResponderPrompt` columns.
- [ ] `EventsGateway.getOnlineAgentCount(projectId)` returns correct count of connected agents.
- [ ] `AiResponderService` is wired up and ready for logic implementation.
