# Research: Phase 1

**Status:** Completed
**Date:** 2026-01-22

## Findings

### Agent Presence
- **Mechanism:** Agents join a socket.io room named `project:{projectId}` upon entering a project.
- **Verification:** `EventsGateway.handleJoinProjectRoom` handles this.
- **Detection Strategy:** Use `this.server.in('project:{projectId}').fetchSockets()` and count sockets with attached user data.

### Database Schema
- **ORM:** TypeORM with PostgreSQL.
- **Entity:** `Project` entity is in `packages/backend/src/projects/entities/project.entity.ts`.
- **DTO:** `UpdateProjectDto` is in `packages/shared-dtos/src/update-project.dto.ts`.
- **Migration:** Standard TypeORM migration workflow (`npm run migration:generate`).

### Architecture
- **Module Structure:** `GatewayModule` exports `EventsGateway`.
- **New Module:** `AiResponderModule` will import `GatewayModule` to access presence data.
- **Event Flow:** `EventsGateway` emits events (`visitor.message.received`). `AiResponderService` will listen to these in Phase 2.
- **Circular Dependency:** Avoided by having `AiResponderModule` import `GatewayModule`, but not vice-versa.

## Implementation Details

- **Project Entity:**
  ```typescript
  @Column({ default: false })
  aiResponderEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  aiResponderPrompt: string;
  ```

- **Gateway Logic:**
  ```typescript
  async getOnlineAgentCount(projectId: number): Promise<number> {
    const sockets = await this.server.in(`project:${projectId}`).fetchSockets();
    // Filter for authenticated users (agents)
    return sockets.filter(s => s.data.user).length;
  }
  ```
