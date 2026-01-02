# Design: Internal Visitor Notes
## Slice: internal_notes_core

### 1. Objective
To allow agents and managers to attach persistent internal notes to a **Visitor**. These notes appear in the sidebar and provide context ("Contextual Memory") for future interactions.

**What we will achieve:**
1.  **Persistence:** Notes survive across different conversations. If a visitor chats today, leaves, and comes back in a month, the notes are still there.
2.  **Context:** Agents can see *who* wrote the note and *when*.
3.  **Privacy:** Notes are strictly internal. Visitors never see them.

### 2. The Domain Physics (Invariants)
1.  **Visitor Scope:** Notes belong to a `Visitor` entity.
2.  **Authorship:** Every note must have an `author` (User).
3.  **Immutability (Soft):** Notes can be deleted, but ideally editing should be restricted or audit-logged (for V1, allow Edit/Delete).
4.  **Real-time:** If two agents are viewing the same visitor, adding a note should update both screens.

### 3. The Data Structure

#### 3.1 Schema (TypeORM Entity)

We need a new table `visitor_notes`.

```typescript
@Entity("visitor_notes")
export class VisitorNote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // The Visitor this note is about
  @Column({ type: "int" })
  visitorId: number;

  @ManyToOne(() => Visitor, (visitor) => visitor.notes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "visitor_id" })
  visitor: Visitor;

  // The Agent who wrote the note
  @Column({ type: "uuid" })
  authorId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" }) // If agent is deleted, notes go with them? Or Set Null? cascading is cleaner for V1.
  @JoinColumn({ name: "author_id" })
  author: User;

  @Column({ type: "text" })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

*Update `Visitor` entity:*
```typescript
@OneToMany(() => VisitorNote, (note) => note.visitor)
notes: VisitorNote[];
```

#### 3.2 DTOs

```typescript
export class CreateVisitorNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateVisitorNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

### 4. API Interface

**Controller:** `VisitorNoteController`
**Path:** `/projects/:projectId/visitors/:visitorId/notes`

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | AGENT | List all notes for visitor |
| `POST` | `/` | AGENT | Create a note |
| `PATCH` | `/:noteId` | AGENT | Update a note (Author or Manager only?) -> *V1: Any agent can edit* |
| `DELETE` | `/:noteId` | AGENT | Delete a note |

### 5. Frontend Design (Sidebar Integration)

#### 5.1 Component: `VisitorNoteList`
*   **Location:** Inside `VisitorContextPanel` (Sidebar).
*   **UI:**
    *   List of notes (reverse chronological).
    *   Each item: Avatar of Author, Timestamp, Content.
    *   "Add Note" input area at the bottom (or top).
    *   Hover actions: Edit/Delete (Trash icon).

#### 5.2 Real-time Updates
*   We need a new socket event: `VISITOR_NOTE_ADDED`, `VISITOR_NOTE_UPDATED`, `VISITOR_NOTE_DELETED`.
*   Scope: `project:{projectId}` room.

### 6. Implementation Plan

1.  **Shared:** Create `VisitorNote` interface and DTOs.
2.  **Backend:**
    *   Migration: Create `visitor_notes` table.
    *   Entity: `VisitorNote.entity.ts`.
    *   Service: `VisitorNoteService`.
    *   Controller: `VisitorNoteController`.
    *   Gateway: Emit events.
3.  **Frontend:**
    *   API Service: `visitorApi.ts` (add note methods).
    *   Component: `VisitorNoteList.tsx`.
    *   Integration: Add to `VisitorContextPanel`.

### 7. Pre-Mortem
*   **Scenario:** Note Spam.
    *   *Limit:* Max 100 notes per visitor? Max length 2000 chars?
    *   *Decision:* Max length 2000. No count limit for now.
*   **Scenario:** Race Condition (Two agents editing same note).
    *   *Result:* Last write wins. Acceptable for V1.

