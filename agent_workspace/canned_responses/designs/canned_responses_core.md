# Design: Canned Responses (Core)
## Slice: canned_responses_core

### 1. Objective
To improve agent efficiency by allowing them to use pre-defined text snippets (macros) for common questions and greetings.

### 2. The Domain Physics (Invariants)
1.  **Project Scope:** Canned responses are scoped to a Project.
2.  **Uniqueness:** The `shortcut` key must be unique within a Project to prevent ambiguity.
3.  **Expansion:** The system stores the `content`, but the expansion happens on the Client side (Frontend). The backend just serves the list.
4.  **Access:** 
    -   **Read:** All Project Members (Agents/Managers).
    -   **Write:** Project Managers only.

### 3. The Data Structure

#### 3.1 Schema (TypeORM Entity)

```typescript
@Entity("canned_responses")
@Unique(["projectId", "shortcut"]) // Invariant: Unique shortcut per project
export class CannedResponse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int" })
  projectId: number;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 50 })
  shortcut: string; // e.g., "welcome", "reset_password" (no slash stored)

  @Column({ type: "text" })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 3.2 DTOs

```typescript
// Shared DTOs
export class CreateCannedResponseDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Shortcut can only contain letters, numbers, underscores, and dashes." })
  shortcut: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateCannedResponseDto extends PartialType(CreateCannedResponseDto) {}
```

### 4. API Interface

**Controller:** `CannedResponseController`
**Path:** `/projects/:projectId/canned-responses`

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | AGENT | List all responses for project |
| `POST` | `/` | MANAGER | Create a new response |
| `PATCH` | `/:id` | MANAGER | Update a response |
| `DELETE` | `/:id` | MANAGER | Delete a response |

### 5. Pre-Mortem (Failure Analysis)

*   **Scenario:** Shortcut Collision.
    *   *Case:* Manager tries to create "hello" but "hello" exists.
    *   *Result:* DB Unique Constraint violation.
    *   *Handling:* Catch `QueryFailedError` (code 23505) and throw `ConflictException` ("Shortcut already exists").
*   **Scenario:** Large Content.
    *   *Case:* Manager pastes a 10MB text.
    *   *Result:* Performance hit.
    *   *Constraint:* Limit `content` to 4000 characters? Or just let `text` type handle it (usually 1GB).
    *   *Decision:* Add `@MaxLength(5000)` validation to DTO. 5000 chars is plenty for a chat message.

### 6. Implementation Plan
1.  **Shared:** Create `CannedResponse` entity and DTOs in `shared-types` (or equivalent).
2.  **Backend:**
    -   Generate Migration (Create table).
    -   Create `CannedResponseService` (CRUD).
    -   Create `CannedResponseController` with Permissions.
3.  **Tests:**
    -   E2E test: Manager creates, Agent lists, Manager deletes.
    -   E2E test: Duplicate shortcut throws 409.
