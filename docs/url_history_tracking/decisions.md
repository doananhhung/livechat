# Decision Log: Session-Based URL History & Referrer Tracking

## Decision 1: Use `jsonb` column instead of a separate table
- **Date:** 2025-12-13
- **Context:** We needed to store visitor navigation history associated with a conversation. The traditional relational approach would be a `visitor_page_views` table with a foreign key to `conversations`.
- **Decision:** Store the data as a `jsonb` column (`metadata`) on the `conversations` table.
- **Rationale:**
    1.  **Read-Heavy Access:** This data is primarily read as a complete unit for display in the dashboard. We rarely need to query "find all conversations that visited Page X".
    2.  **Schema Flexibility:** The structure of "session metadata" might evolve (e.g., adding browser info, device type). JSONB allows evolution without schema migrations.
    3.  **Performance:** Avoids an expensive JOIN on every conversation fetch.
- **Consequences:** Aggregate analytics (e.g., "Top Landing Pages") will be harder to query directly in SQL, but can be handled by ETL processes later if needed.

## Decision 2: Client-Side "Silent" Recording
- **Date:** 2025-12-13
- **Context:** We need to capture the *entire* journey, even pages visited before the user decided to chat.
- **Decision:** Record history in `sessionStorage` immediately upon widget load, but only sync to backend when the chat starts.
- **Rationale:**
    1.  **Privacy/Efficiency:** We do not track users who never interact with the chat. This reduces backend load and database storage significantly.
    2.  **Context Completeness:** When the user finally chats, the agent sees the full path that led them there.
- **Alternatives Considered:** sending a "pixel" ping on every page load. Rejected due to high infrastructure cost and privacy concerns.

## Decision 3: FIFO Limit of 50 Entries
- **Date:** 2025-12-13
- **Context:** Unlimited history tracking could lead to massive WebSocket payloads and browser storage issues.
- **Decision:** Cap the history at the last 50 visited pages.
- **Rationale:**
    1.  **Relevance:** Agents mostly care about the immediate context (last few minutes/pages).
    2.  **Performance:** Keeps the `sendMessage` payload size predictable and small.
