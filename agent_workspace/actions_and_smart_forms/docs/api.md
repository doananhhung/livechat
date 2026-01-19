# API Reference: Actions and Smart Forms

## REST Endpoints

All endpoints are relative to the base API URL.

### Action Templates (Manager Access Required)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/projects/:projectId/action-templates` | Create a new action template. |
| `GET` | `/projects/:projectId/action-templates` | List all non-deleted templates for a project. |
| `GET` | `/projects/:projectId/action-templates/:id` | Get details for a specific template. |
| `PUT` | `/projects/:projectId/action-templates/:id` | Update an existing template definition. |
| `DELETE` | `/projects/:projectId/action-templates/:id` | Soft-delete a template. |
| `PATCH` | `/projects/:projectId/action-templates/:id/toggle` | Enable or disable a template. |

### Action Submissions

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/conversations/:conversationId/actions` | Submit an action as an Agent. | JWT |
| `GET` | `/conversations/:conversationId/actions` | List submission history for a conversation. | JWT |

## WebSocket Events

### Server → Client (Visitor)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `agentReplied` | `MessageDto` | Delivered when an agent sends a form request (contentType: `form_request`). |
| `formSubmitted` | `FormSubmittedPayload` | Delivered when the form is successfully processed. |

### Client (Visitor) → Server

| Event | Payload | Description |
| :--- | :--- | :--- |
| `visitorFillingForm` | `{ isFilling: boolean }` | Signals to agents that the visitor is interacting with a form. |
| `submitForm` | `{ formRequestMessageId: string, data: object }` | Submits the filled form data back to the server. |

### Server → Client (Agent)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `visitorFillingForm` | `{ conversationId: number, isFilling: boolean }` | Broadcasted to agents in the project room. |
| `formSubmitted` | `FormSubmittedPayload` | Broadcasted to agents to update UI in real-time. |

## Data Models

### ActionDefinition
```json
{
  "fields": [
    {
      "key": "string",
      "label": "string",
      "type": "text | number | date | boolean | select",
      "required": "boolean",
      "options": ["string"] 
    }
  ]
}
```

### FormRequestMetadata
```json
{
  "templateId": "number",
  "templateName": "string",
  "templateDescription": "string",
  "definition": "ActionDefinition",
  "expiresAt": "string (ISO Date)"
}
```
