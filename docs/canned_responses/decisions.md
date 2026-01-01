# Decision Log: Canned Responses

## Decision 1: Project-Scoped Uniqueness
-   **Date:** 2025-12-12
-   **Context:** Can two projects have the same shortcut `/welcome`? Can one project have two `/welcome` shortcuts?
-   **Decision:** Shortcuts must be unique **within a project**. Different projects can reuse the same shortcuts.
-   **Rationale:** Agents work within the context of a project. Ambiguity (two macros for the same key) is bad UX.

## Decision 2: Client-Side Expansion
-   **Date:** 2025-12-12
-   **Context:** Should the backend parse the message and expand the macros?
-   **Decision:** No. Expansion happens on the **Frontend** (Client-side) before the message is sent.
-   **Rationale:** 
    -   **WYSIWYG:** The agent sees exactly what will be sent.
    -   **Editability:** The agent can expand the macro and then customize the text (e.g., adding the user's name).

## Decision 3: "Start of Line or Space" Trigger
-   **Date:** 2025-12-12
-   **Context:** When should the popup appear?
-   **Decision:** Only when `/` is typed at the start of the input OR immediately following a space.
-   **Rationale:** Prevents annoying popups when typing fractions (e.g., "1/2") or dates ("12/12/2025").

## Decision 4: Regex Validation for Shortcuts
-   **Date:** 2025-12-12
-   **Context:** What characters are allowed in a shortcut?
-   **Decision:** `^[a-zA-Z0-9_-]+$`.
-   **Rationale:** Spaces break the "slash command" paradigm. Special characters are hard to type. We keep it simple (slug-like).
