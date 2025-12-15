# Project Invitation System

## Overview

The invitation system allows managers to invite other users to join their projects as agents (or other roles). This solves the problem where users could only register with the MANAGER role by default.

## Architecture

### Database Schema

- **invitations table**:
  - `id`: UUID (primary key)
  - `email`: VARCHAR (email of the invitee)
  - `token`: VARCHAR (unique secure token for the invitation link)
  - `project_id`: INT (the project they're being invited to)
  - `inviter_id`: UUID (the manager who sent the invitation)
  - `role`: ENUM('admin', 'manager', 'agent') - the role they'll have in the project
  - `status`: ENUM('pending', 'accepted', 'expired')
  - `expires_at`: TIMESTAMPTZ (invitation expires after 7 days)
  - `created_at`: TIMESTAMPTZ

### Backend Implementation

#### DTOs (`packages/shared/src/invitation.dto.ts`)

```typescript
CreateInvitationDto {
  email: string;
  projectId: number;
  role?: Role; // Defaults to AGENT
}

AcceptInvitationDto {
  token: string;
}

InvitationResponseDto {
  id: string;
  email: string;
  projectId: number;
  inviterId: string;
  status: InvitationStatus;
  role: Role;
  expiresAt: Date;
  createdAt: Date;
}
```

#### API Endpoints

##### 1. **POST `/projects/invitations`** (Manager only)

Create and send an invitation email.

**Request Body:**

```json
{
  "email": "agent@example.com",
  "projectId": 1,
  "role": "agent"
}
```

**Response:** `201 Created` with Invitation object

**Validations:**

- Only managers of the project can send invitations
- Cannot invite someone who is already a member
- Cannot create duplicate pending invitations
- Rate limited: 5 invitations per minute

**Email Sent:** Contains invitation link to `/accept-invitation?token={token}`

---

##### 2. **GET `/projects/:id/invitations`** (Manager only)

Get all invitations for a specific project.

**Response:** Array of Invitation objects

---

##### 3. **DELETE `/projects/invitations/:invitationId`** (Manager only)

Cancel a pending invitation.

**Response:** `200 OK`

---

##### 4. **POST `/projects/invitations/accept?token={token}`** (Authenticated)

Accept an invitation and join the project.

**Validations:**

- Token must be valid and not expired
- Invitation must be in PENDING status
- User's email must match the invitation email
- User cannot already be a member of the project

**Response:** `200 OK`

**Side Effects:**

- User is added to the project with the specified role
- Invitation status changes to ACCEPTED
- User can now access the project

---

### Email Template

The invitation email includes:

- Project name
- Role being offered (Agent/Manager/Admin)
- Clickable button with invitation link
- Expiration notice (7 days)
- Plain text link as fallback

### Security Features

1. **Secure Tokens**: 32-byte random hex tokens (64 characters)
2. **Authorization Checks**:
   - Only managers can send invitations
   - Only the invited email can accept
   - Only managers can view/cancel invitations
3. **Rate Limiting**: 5 invitations per minute per manager
4. **Expiration**: Invitations automatically expire after 7 days
5. **Single Use**: Tokens are marked as ACCEPTED and cannot be reused
6. **Email Validation**: Must match registered user's email

### Business Logic

#### Invitation Creation Flow

1. Manager sends invitation with email and role
2. System validates manager has permission for the project
3. System checks if user already exists and is already a member
4. System checks for duplicate pending invitations
5. Secure token is generated
6. Invitation record is created with 7-day expiration
7. Email is sent to invitee
8. Return success response

#### Invitation Acceptance Flow

1. User clicks link in email → redirects to `/accept-invitation?token={token}`
2. Frontend calls `POST /projects/invitations/accept?token={token}`
3. Backend validates:
   - Token exists and is valid
   - Invitation is still PENDING
   - Invitation has not expired
   - User's email matches invitation email
   - User is not already a member
4. Transaction begins:
   - Create ProjectMember record with specified role
   - Mark invitation as ACCEPTED
5. Transaction commits
6. User can now access the project

### Error Handling

| Error                | Status | Message                                               |
| -------------------- | ------ | ----------------------------------------------------- |
| Not a manager        | 403    | Only managers can invite members to this project      |
| Project not found    | 404    | Project not found                                     |
| Already a member     | 409    | This user is already a member of the project          |
| Duplicate invitation | 409    | A pending invitation already exists for this email    |
| Invalid token        | 404    | Invitation not found                                  |
| Already used         | 400    | This invitation has already been used                 |
| Expired              | 400    | This invitation has expired                           |
| Wrong email          | 403    | This invitation was sent to a different email address |

## Frontend Implementation ✅

### Pages Implemented

#### 1. **Invite Members Page** (`/projects/:projectId/invite`) ✅

**Location:** `packages/frontend/src/pages/invitations/InviteMembersPage.tsx`

**Features:**

- ✅ Form with email input and role selector (Agent/Manager)
- ✅ List of all invitations for the project
- ✅ Visual status indicators (pending/accepted/expired)
- ✅ Cancel invitation button for pending invitations
- ✅ Shows invitation status and expiration date
- ✅ Back button to project settings
- ✅ Real-time updates with React Query
- ✅ Success/error toast notifications

**Access:** From Project Settings → "Mời thành viên" button on each project card

#### 2. **Accept Invitation Page** (`/accept-invitation`) ✅

**Location:** `packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx`

**Features:**

- ✅ Reads token from query parameter (`?token=xxx`)
- ✅ Automatic invitation acceptance on page load
- ✅ Loading state with spinner
- ✅ Success state with green checkmark
- ✅ Error state with red X and error message
- ✅ Auto-redirect to inbox after successful acceptance
- ✅ Retry and back to home buttons on error
- ✅ React Strict Mode safe (useRef to prevent double execution)

**Access:** Via email link sent to invitee

#### 3. **Project Settings Enhancement** ✅

**Location:** `packages/frontend/src/pages/settings/ProjectSettingsPage.tsx`

**Features:**

- ✅ "Mời thành viên" button added to each project card
- ✅ Button with UserPlus icon for better UX
- ✅ Navigates to invitation page for specific project

### API Client Functions ✅

**Location:** `packages/frontend/src/services/projectApi.ts`

```typescript
// All functions implemented with proper TypeScript types
export const inviteUserToProject = async (
  data: CreateInvitationDto
): Promise<Invitation> => {
  const response = await api.post("/projects/invitations", data);
  return response.data;
};

export const getProjectInvitations = async (
  projectId: number
): Promise<Invitation[]> => {
  const response = await api.get(`/projects/${projectId}/invitations`);
  return response.data;
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  await api.delete(`/projects/invitations/${invitationId}`);
};

export const acceptInvitation = async (token: string): Promise<void> => {
  await api.post(`/projects/invitations/accept?token=${token}`);
};
```

### Routes Added ✅

**Location:** `packages/frontend/src/App.tsx`

```tsx
// Public route (requires auth but not protected route wrapper)
<Route path="/accept-invitation" element={<AcceptInvitationPage />} />

// Protected route (inside MainLayout)
<Route path="/projects/:projectId/invite" element={<InviteMembersPage />} />
```

## Testing Scenarios

### Happy Path

1. ✅ Manager creates project
2. ✅ Manager invites user@example.com as AGENT
3. ✅ User receives email with invitation link
4. ✅ User clicks link and accepts invitation
5. ✅ User is added to project with AGENT role
6. ✅ User can now access the project

### Edge Cases

- ❌ Non-manager tries to invite → 403 Forbidden
- ❌ Invite to non-existent project → 404 Not Found
- ❌ Invite existing member → 409 Conflict
- ❌ Duplicate pending invitation → 409 Conflict
- ❌ Accept with expired token → 400 Bad Request
- ❌ Accept with wrong email → 403 Forbidden
- ❌ Accept already-accepted invitation → 400 Bad Request
- ⏱️ Rate limit exceeded → 429 Too Many Requests

## Migration

**Migration:** `1760880781597-AddRoleToInvitations.ts`

```sql
CREATE TYPE "public"."invitations_role_enum" AS ENUM('admin', 'manager', 'agent');
ALTER TABLE "invitations" ADD "role" "public"."invitations_role_enum" NOT NULL;
```

## Environment Variables

No new environment variables required. Uses existing:

- `FRONTEND_URL` - for generating invitation links
- `MAIL_*` - for sending invitation emails

## Next Steps

1. ✅ Backend implementation complete
2. ✅ Migration complete
3. ✅ Create frontend invite members page (`/projects/:projectId/invite`)
4. ✅ Create frontend accept invitation page (`/accept-invitation`)
5. ✅ Add invitation management UI to project settings (with "Invite Members" button)
6. ✅ Add API client functions to projectApi.ts
7. ⏳ Add tests for invitation service
8. ⏳ Add e2e tests for invitation flow

## Usage Example

### As a Manager:

```bash
# Invite a user to your project
curl -X POST http://localhost:3000/projects/invitations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "projectId": 1,
    "role": "agent"
  }'

# View pending invitations
curl http://localhost:3000/projects/1/invitations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### As an Invitee:

```bash
# Accept invitation (after clicking email link)
curl -X POST "http://localhost:3000/projects/invitations/accept?token=INVITATION_TOKEN" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Notes

⚠️ **Important:**

- Tokens are single-use and expire after 7 days
- Only the invited email can accept the invitation
- Invitations are project-specific, not system-wide
- Managers cannot invite to projects they don't own
- Rate limiting prevents invitation spam

## Database Queries

### Find all pending invitations for a user

```sql
SELECT * FROM invitations
WHERE email = 'user@example.com'
  AND status = 'pending'
  AND expires_at > NOW();
```

### Find all invitations for a project

```sql
SELECT i.*, u.full_name as inviter_name
FROM invitations i
LEFT JOIN users u ON i.inviter_id = u.id
WHERE i.project_id = 1
ORDER BY i.created_at DESC;
```

### Cleanup expired invitations

```sql
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < NOW();
```
