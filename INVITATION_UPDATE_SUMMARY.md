# Invitation System Update Summary

## ✅ COMPLETE - Backend and Frontend Implementation

All changes have been implemented and tested. The invitation system now supports both existing and new users seamlessly.

---

## Changes Made

### 1. **Updated Invitation Email Logic** (`invitation.service.ts`)

The `sendInvitationEmail` method now checks if the invited user already exists:

- **For existing users**: Sends a link to accept the invitation directly

  - URL: `/accept-invitation?token=<token>`
  - Button text: "Chấp nhận lời mời"

- **For new users**: Sends a link to the registration page with the invitation token
  - URL: `/register?invitation_token=<token>`
  - Button text: "Đăng ký và tham gia"

### 2. **Added New Method** (`invitation.service.ts`)

Created `getInvitationByToken(token: string)` method:

- Returns invitation details including project information
- Validates that invitation is still pending and not expired
- This is used by the registration page to pre-fill the email and show project details

### 3. **Created Public Decorator** (`/common/decorators/public.decorator.ts`)

- New decorator to mark endpoints as public (skip authentication)
- Used for the invitation details endpoint

### 4. **Updated JWT Auth Guard** (`jwt-auth.guard.ts`)

- Modified to respect the `@Public()` decorator
- Allows specific endpoints to be accessed without authentication

### 5. **Added New Public Endpoint** (`project.controller.ts`)

```typescript
@Public()
@Get('invitations/details')
getInvitationDetails(@Query('token') token: string)
```

- Allows fetching invitation details without authentication
- Used by the registration page to get invitation info

## Flow Diagrams

### For Existing Users:

```
1. Manager sends invitation to existing@email.com
2. System sends email with link: /accept-invitation?token=xxx
3. User clicks link (must be logged in)
4. User is added to project immediately
```

### For New Users:

```
1. Manager sends invitation to newuser@email.com
2. System sends email with link: /register?invitation_token=xxx
3. User clicks link
4. Registration page calls GET /api/v1/projects/invitations/details?token=xxx
5. Registration page pre-fills email from invitation
6. User completes registration
7. After registration, automatically call acceptInvitation
8. User is added to project automatically
```

## Frontend Implementation Needed

### ✅ 1. Update Registration Page (`/register`) - COMPLETED

- ✅ Check for `invitation_token` query parameter
- ✅ If present, fetch invitation details from: `GET /api/v1/projects/invitations/details?token=<token>`
- ✅ Pre-fill email field with invitation email (make it read-only)
- ✅ Show message: "You're registering to join project: {project.name}"
- ✅ After successful registration, automatically call: `POST /api/v1/projects/invitations/accept?token=<token>`

### ✅ 2. Update Accept Invitation Page (`/accept-invitation`) - COMPLETED

- ✅ Keep existing logic for logged-in users
- ✅ If user is not logged in, redirect to login page with a return URL

**See [FRONTEND_INVITATION_IMPLEMENTATION.md](./FRONTEND_INVITATION_IMPLEMENTATION.md) for detailed implementation.**

## API Endpoints

### New Endpoint:

- `GET /api/v1/projects/invitations/details?token=<token>` (Public)
  - Returns invitation details including email and project info

### Modified Behavior:

- `POST /api/v1/projects/invitations` (Manager only)
  - Now sends different email based on whether user exists

### Existing Endpoints (Unchanged):

- `POST /api/v1/projects/invitations/accept?token=<token>` (Authenticated)
- `GET /api/v1/projects/:id/invitations` (Manager only)
- `DELETE /api/v1/projects/invitations/:invitationId` (Manager only)

## Testing

### Test Case 1: Invite Existing User

1. Send invitation to an existing user's email
2. Check email - should contain "Chấp nhận lời mời" button
3. Click link while logged in
4. Should be added to project

### Test Case 2: Invite New User

1. Send invitation to a non-existent user's email
2. Check email - should contain "Đăng ký và tham gia" button
3. Click link - should go to registration page with email pre-filled
4. Complete registration
5. Should automatically be added to project

### Test Case 3: Get Invitation Details (Public)

1. Call `GET /api/v1/projects/invitations/details?token=<valid_token>` without auth
2. Should return invitation details with project info
3. Call with expired/invalid token - should return error

## Database Changes

No database changes required. The existing `Invitation` entity supports this functionality.

## Security Considerations

- The invitation token is still secure (32 bytes random)
- Email verification in `acceptInvitation` ensures the right user accepts
- Public endpoint only exposes minimal information (email, project name, role)
- Token expiration (7 days) is still enforced

---

## Quick Start - How to Test

### 1. Start the Backend

```bash
cd packages/backend
npm run start:dev
```

### 2. Start the Frontend

```bash
cd packages/frontend
npm run dev
```

### 3. Test New User Flow

1. As a manager, invite a non-existent email: `newuser@example.com`
2. Check the email - you'll see "Đăng ký và tham gia" button
3. Click the link (or copy URL: `/register?invitation_token=xxx`)
4. Email field will be pre-filled and locked
5. You'll see: "🎉 Bạn đang đăng ký để tham gia dự án: **Project Name**"
6. Complete registration
7. You'll be automatically logged in and added to the project
8. Redirected to inbox

### 4. Test Existing User Flow

1. As a manager, invite an existing email: `existinguser@example.com`
2. Check the email - you'll see "Chấp nhận lời mời" button
3. Click the link (or copy URL: `/accept-invitation?token=xxx`)
4. If not logged in, you'll be redirected to login first
5. After login, invitation is automatically accepted
6. Redirected to inbox

---

## Files Changed

### Backend

- ✅ `/packages/backend/src/projects/invitation.service.ts`
- ✅ `/packages/backend/src/projects/project.controller.ts`
- ✅ `/packages/backend/src/auth/guards/jwt-auth.guard.ts`
- ✅ `/packages/backend/src/common/decorators/public.decorator.ts` (new)

### Frontend

- ✅ `/packages/frontend/src/services/projectApi.ts`
- ✅ `/packages/frontend/src/pages/auth/RegisterPage.tsx`
- ✅ `/packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx`

### Documentation

- ✅ `/INVITATION_UPDATE_SUMMARY.md` (this file)
- ✅ `/FRONTEND_INVITATION_IMPLEMENTATION.md` (detailed frontend guide)

---

## Support

If you encounter any issues, check:

1. Backend logs for API errors
2. Frontend console for client-side errors
3. Email service is properly configured
4. Database has the latest schema

For more details, see the individual implementation files above.
