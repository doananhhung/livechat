# Architecture: Configurable Visitor History Visibility

## System Diagram

```mermaid
graph TD
    subgraph Frontend (Widget)
        VisitorWidget[Visitor connects / sends message]
    end

    subgraph Backend
        Gateway(EventsGateway)
        Consumer(EventConsumerService / InboxEventHandler)
        ConversationService
        Persistence(ConversationPersistenceService)
        ProjectService
        DB(Postgres)
    end

    subgraph Project Settings (Frontend)
        Manager[Project Manager configures widget settings]
        WidgetSettingsDialog[ProjectWidgetSettingsDialog.tsx]
    end

    Manager --> WidgetSettingsDialog: Sets historyVisibility
    WidgetSettingsDialog --> ProjectService: updateProjectSettings({ historyVisibility: ... })
    ProjectService --> DB: Persist project.widgetSettings

    VisitorWidget --> Gateway: IDENTIFY / SEND_MESSAGE
    Gateway --> Consumer: Event
    Consumer --> ProjectService: Get project.widgetSettings
    ProjectService --> Consumer: { historyVisibility: 'limit_to_active' | 'forever' }

    Consumer --> ConversationService: findOrCreateByVisitorId(..., historyMode)
    ConversationService --> Persistence: findOrCreateByVisitorId(..., historyMode)

    Persistence -- Logic Branch --> DB: Query conversations based on mode
    
    alt historyVisibility = 'limit_to_active' (Ticket Style)
        Persistence -- Find only OPEN/PENDING --> DB
        DB -- No active found --> Persistence: null
        Persistence --> DB: INSERT NEW Conversation (status=OPEN)
    else historyVisibility = 'forever' (Chat Style)
        Persistence -- Find most recent non-SPAM --> DB
        DB -- Found SOLVED conversation --> Persistence: conversation (status=SOLVED)
        Persistence -- Set status=OPEN --> DB: UPDATE conversation
    end

    DB --> ConversationService: Conversation
    ConversationService --> Consumer: Conversation
    Consumer --> Gateway: Prepare messages for widget
    Gateway --> VisitorWidget: Display history
```

## Components

### ConversationPersistenceService
-   **Location**: `packages/backend/src/inbox/services/persistence/conversation.persistence.service.ts`
-   **Purpose**: Core database interaction for finding/creating conversations.
-   **Logic**:
    -   `findByVisitorId(..., mode)`: Fetches an existing conversation based on `HistoryVisibilityMode`.
        -   `limit_to_active`: Queries for `OPEN` or `PENDING` conversations only.
        -   `forever`: Queries for the most recent non-`SPAM` conversation.
    -   `findOrCreateByVisitorId(..., mode)`: Uses the `findByVisitorId` logic internally. If no conversation is found based on the mode, it creates a new `OPEN` conversation.
    -   `updateLastMessage`: Updated to ensure `SPAM` conversations remain `SPAM` and other conversations are set to `OPEN`.

### ConversationService
-   **Location**: `packages/backend/src/inbox/services/conversation.service.ts`
-   **Purpose**: Orchestrates the conversation lookup for the widget.
-   **Logic**: `findConversationForWidget(..., mode)` delegates to `ConversationPersistenceService`.

### EventConsumerService & EventsGateway
-   **Locations**:
    -   `packages/backend/src/event-consumer/event-consumer.service.ts`
    -   `packages/backend/src/gateway/events.gateway.ts` (Implicitly via `InboxEventHandler`)
-   **Purpose**: Entry points for visitor events.
-   **Logic**: Fetch project's `widgetSettings.historyVisibility` and pass this mode to the `ConversationService`.

### ProjectWidgetSettingsDialog (Frontend)
-   **Location**: `packages/frontend/src/components/features/inbox/ProjectWidgetSettingsDialog.tsx`
-   **Purpose**: Provides UI for Project Managers to configure the `historyVisibility`.
-   **UI**: Implements a radio group with "Ticket Style" and "Chat Style" options.

## Data Model Changes

### `IWidgetSettingsDto` (Shared Types)
-   **Field**: `historyVisibility?: HistoryVisibilityMode;`
-   **Type**: `HistoryVisibilityMode = 'limit_to_active' | 'forever';`
    -   `limit_to_active`: Only show active conversations.
    -   `forever`: Show all non-spam conversations.

## Failure Modes
-   **Default Value**: If `historyVisibility` is `undefined` (for existing projects before this feature), the system defaults to `limit_to_active` to maintain existing behavior.
-   **Spam Immunity**: Explicitly handled; `SPAM` conversations are never returned by the lookup queries, preventing them from being shown or re-opened.
