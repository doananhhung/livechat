# Investigation Coverage Analysis

This report evaluates the extent to which the backend controllers and gateways in `packages/backend/src` are covered by existing investigation files in `agent_workspace`.

## Coverage Summary

| Backend Component            | Status     | Investigation File(s)                                                                                                                                                                                                                                            |
| :--------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & 2FA**     | 🟢 Covered | [user-authentication-flow.md](auth/investigations/user-authentication-flow.md)                                                                                                                                                                                   |
| **Project Management**       | 🟢 Covered | [projects-feature.md](projects/investigations/projects-feature.md)                                                                                                                                                                                               |
| **Real-time Gateway**        | 🟢 Covered | [project-event-flow.md](projects/investigations/project-event-flow.md), [widget_connection_flow.md](embeddable_widget/investigations/widget_connection_flow.md), [visitor_session_management.md](embeddable_widget/investigations/visitor_session_management.md) |
| **Message Flows**            | 🟢 Covered | [dashboard_to_widget_message_flow.md](inbox/investigations/dashboard_to_widget_message_flow.md), [widget_to_dashboard_message_flow.md](inbox/investigations/widget_to_dashboard_message_flow.md)                                                                 |
| **Actions & Forms**          | 🟢 Covered | [actions_template_flow.md](actions_and_smart_forms/investigations/actions_template_flow.md)                                                                                                                                                                      |
| **User Profile/Settings**    | � Covered  | [user-profile-settings.md](user-management/investigations/user-profile-settings.md)                                                                                                                                                                              |
| **Inbox Operations**         | � Covered  | [inbox-operations.md](inbox/investigations/inbox-operations.md)                                                                                                                                                                                                  |
| **Canned Responses**         | � Covered  | [canned-responses-flow.md](canned-responses/investigations/canned-responses-flow.md)                                                                                                                                                                             |
| **Audit Logs**               | � Covered  | [audit-logs-flow.md](audit/investigations/audit-logs-flow.md)                                                                                                                                                                                                    |
| **Webhooks**                 | � Covered  | [webhooks-flow.md](webhooks/investigations/webhooks-flow.md)                                                                                                                                                                                                     |
| **Visitor Notes**            | � Covered  | [visitor-notes-flow.md](visitors/investigations/visitor-notes-flow.md)                                                                                                                                                                                           |
| **Conversation Assignments** | � Covered  | [conversation-assignments.md](inbox/investigations/conversation-assignments.md)                                                                                                                                                                                  |
| **Screenshot Service**       | � Covered  | [screenshot-service.md](screenshot/investigations/screenshot-service.md)                                                                                                                                                                                         |
| **Mail Service**             | � Covered  | [mail-service.md](mail/investigations/mail-service.md)                                                                                                                                                                                                           |

---

## Recent Additions (2026-01-02)

The following investigations were added to close gaps identified in the original coverage report:

1. **User Profile/Settings** - Profile updates, email change flow with security considerations
2. **Inbox Operations** - Conversation listing, status updates, mark as read, agent typing
3. **Canned Responses** - CRUD operations with RBAC (MANAGER for write, AGENT for read)
4. **Audit Logs** - Decorator-based auditing with interceptor, fail-open pattern, sensitive data redaction
5. **Webhooks** - SSRF protection, Redis pub/sub dispatch, BullMQ processing, HMAC signing
6. **Visitor Notes** - CRUD with real-time WebSocket events to project
7. **Conversation Assignments** - Assign/unassign with membership validation
8. **Screenshot Service** - SSRF/DNS rebinding protection, Puppeteer workflow, caching, concurrency limits
9. **Mail Service** - SMTP transport, email types, templates, i18n support

---

## Next Steps

All identified gaps have been addressed. For future investigations, consider:

- **Health Check Endpoints** - Application monitoring
- **Rate Limiting** - If implemented, document throttling behavior
- **File Upload** - If avatar uploads or file attachments exist
