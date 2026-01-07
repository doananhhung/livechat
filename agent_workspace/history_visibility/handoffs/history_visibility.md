# Handoff Verification: history_visibility
## Status: ALIGNED

## Design Intent Summary
-   **Objective:** Allow Project Managers to configure how conversation history is presented to returning visitors ("Ticket Style" vs "Chat Style").
-   **Invariants:**
    -   **Configuration:** `widgetSettings.historyVisibility` ('limit_to_active' | 'forever').
    -   **Ticket Style (limit_to_active):** Visitors only see active (`OPEN`/`PENDING`) chats. Solved chats are hidden. New message -> New Conversation.
    -   **Chat Style (forever):** Visitors see full history (except Spam). New message -> Re-opens old Conversation.
    -   **Spam Exclusion:** Spam is always hidden.

## Implementation Summary
-   **Shared:** `HistoryVisibilityMode` and `IWidgetSettingsDto` updated.
-   **Backend:**
    -   `ConversationPersistenceService` updated with `findByVisitorId` and `findOrCreateByVisitorId` supporting both modes.
    -   `ConversationService` delegates to persistence with correct mode.
    -   `InboxEventHandler` and `EventConsumerService` fetch project settings and pass the configured mode.
    -   Re-opening logic handled correctly: `forever` mode finds closed chats (which get set to OPEN on new message), `limit_to_active` mode ignores them (triggering creation of new chat).
-   **Frontend:**
    -   `ProjectWidgetSettingsDialog` updated with a Radio Group for "Conversation History" configuration.

## Alignment Check
| Aspect | Design | Implementation | Status |
|--------|--------|----------------|--------|
| Shared Types | Enum & Interface | Implemented | ✅ ALIGNED |
| Backend Logic | Mode branching | Implemented in Persistence Service | ✅ ALIGNED |
| Backend Logic | Re-opening vs New | Correctly handled by `findOrCreate` logic | ✅ ALIGNED |
| Frontend UI | Settings Dialog | Implemented Radio Group | ✅ ALIGNED |
| Spam | Exclusion | `status: Not(ConversationStatus.SPAM)` used | ✅ ALIGNED |

## Deviations (if any)
| Item | Expected | Actual | Severity | Recommended Action |
|------|----------|--------|----------|-------------------|
| - | - | - | - | - |

## Verdict
**ALIGNED** — Implementation matches design intent. Proceed to next slice.
