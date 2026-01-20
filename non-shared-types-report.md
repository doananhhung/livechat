# Non-Shared DTOs and Types Report

The following DTOs and types are defined within `packages/backend` or `packages/frontend` but are currently missing from `@live-chat/shared-dtos` or `@live-chat/shared-types`.

## Backend DTOs (`packages/backend/src/...`)

These are likely candidates for `@live-chat/shared-dtos`.

| File Path                                 | DTO Name(s)                                                                                                                 | Usage                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `gateway/dtos/gateway.dto.ts`             | `JoinProjectRoomDto`, `LeaveProjectRoomDto`, `SendMessageDto`, `VisitorTypingDto`, `UpdateContextDto`, `IdentifyVisitorDto` | WebSocket Gateway (Commonly needed by Frontend) |
| `inbox/dto/assign-conversation.dto.ts`    | `AssignConversationDto`                                                                                                     | Assignments Controller                          |
| `visitors/dto/update-visitor.dto.ts`      | `UpdateVisitorDto`                                                                                                          | Visitors Controller/Service                     |
| `visitors/dto/visitor-response.dto.ts`    | `VisitorResponseDto`                                                                                                        | Visitors Controller (API Response)              |
| `webhooks/dto/create-subscription.dto.ts` | `CreateSubscriptionDto`                                                                                                     | Webhooks Controller                             |
| `audit-logs/audit.service.ts`             | `CreateAuditLogDto`                                                                                                         | Audit Log Service (Inline)                      |

## Backend Internal Types/Interfaces

These are mainly used for request objects in middleware/auth.

| File Path                                          | Type Name(s)                           | Context                           |
| -------------------------------------------------- | -------------------------------------- | --------------------------------- |
| `common/interfaces/request-with-user.interface.ts` | `AuthenticatedUser`, `RequestWithUser` | Auth Middleware (Extends Express) |
| `common/types/authenticated-request.interface.ts`  | `AuthenticatedRequest`                 | Auth Middleware (Extends Express) |
| `common/types/two-factor-request.interface.ts`     | `TwoFactorRequest`                     | 2FA Middleware (Extends Express)  |
| `event-consumer/outbox.persistence.service.ts`     | `OutboxEventPayload`                   | Internal Persistence              |
| `auth/services/login.service.ts`                   | `LoginResult`                          | Internal Service                  |
| `gateway/services/ws-auth.service.ts`              | `WsAuthResult`                         | Internal Service                  |
| `audit-logs/auditable.decorator.ts`                | `AuditableMetadata`                    | Internal Decorator                |

## Frontend Types (`packages/frontend/src/...`)

These are likely candidates for `@live-chat/shared-types`.

| File Path                      | Type Name(s)            | Usage                          |
| ------------------------------ | ----------------------- | ------------------------------ |
| `widget/types.ts`              | `ConnectionStatus`      | Chat Widget State              |
| `services/projectApi.ts`       | `InvitationWithProject` | Dashboard API (Extends Shared) |
| `widget/store/useChatStore.ts` | `WidgetConfig`          | Chat Widget Store              |

---

### Recommendations

1.  **Move Gateway DTOs**: `IdentifyVisitorDto` and `VisitorTypingDto` are critical for the widget-backend communication and should be shared.
2.  **Move Response DTOs**: `VisitorResponseDto` should be shared if the frontend needs to type the response from `getVisitor`.
3.  **Cleanup**: Delete the orphaned `packages/backend/src/projects/dto/create-project.dto.ts`.
