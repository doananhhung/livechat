# API Reference: Webhooks

## Base URL
`/projects/:projectId/webhooks`

## Authentication
Requires `JwtAuthGuard`. User must be a `ProjectRole.MANAGER`.

## Endpoints

### 1. Create Subscription
**POST** `/`

Registers a new URL to receive events.

**Body:**
```json
{
  "url": "https://api.myserver.com/webhooks/livechat",
  "eventTriggers": ["message.created"]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-string",
  "projectId": 123,
  "url": "https://api.myserver.com/webhooks/livechat",
  "secret": "sk_wh_a1b2c3d4...",
  "eventTriggers": ["message.created"],
  "isActive": true,
  "createdAt": "2023-10-27T10:00:00.000Z"
}
```
> **Note:** Store the `secret` securely. It is used to verify the authenticity of requests.

### 2. List Subscriptions
**GET** `/`

Returns all subscriptions for the project.

**Response (200 OK):**
```json
[
  {
    "id": "uuid-string",
    "url": "...",
    "eventTriggers": ["message.created"],
    "isActive": true,
    ...
  }
]
```

### 3. Delete Subscription
**DELETE** `/:id`

Removes a subscription.

**Response (200 OK):**
```json
// Empty response
```

---

## Webhook Payload Format

When an event occurs, your server will receive a POST request.

**Headers:**
- `Content-Type`: `application/json`
- `User-Agent`: `LiveChat-Webhooks/1.0`
- `X-LiveChat-Event`: `message.created`
- `X-Hub-Signature-256`: `sha256=<hex_digest>`

**Body Example (`message.created`):**
```json
{
  "projectId": 123,
  "message": {
    "id": "msg_123",
    "text": "Hello world",
    "authorId": "user_456",
    ...
  },
  "visitorUid": "vis_789",
  ...
}
```

## Security Verification

You **MUST** verify the signature to ensure the request came from us.

**Node.js Example:**
```javascript
const crypto = require('crypto');

function verifySignature(payload, signatureHeader, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculated = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(calculated));
}
```
