# Frontend Invitation Implementation - Complete

## Summary of Changes

All frontend changes have been implemented to work with the new invitation system.

## Files Modified

### 1. `/packages/frontend/src/services/projectApi.ts`

**Added:**

- `InvitationWithProject` interface - extends Invitation with optional project details
- `getInvitationDetails(token: string)` - Public API call to fetch invitation details

```typescript
export interface InvitationWithProject extends Invitation {
  project?: Project;
}

export const getInvitationDetails = async (
  token: string
): Promise<InvitationWithProject> => {
  const response = await api.get(
    `/projects/invitations/details?token=${token}`
  );
  return response.data;
};
```

### 2. `/packages/frontend/src/pages/auth/RegisterPage.tsx`

**Added Features:**

- Detects `invitation_token` query parameter in URL
- Loads invitation details when token is present
- Pre-fills and locks email field with invitation email
- Shows invitation info banner (project name and role)
- Auto-accepts invitation after successful registration
- Auto-logs in user and redirects to inbox

**New State:**

```typescript
const [invitationToken, setInvitationToken] = useState<string | null>(null);
const [invitation, setInvitation] = useState<InvitationWithProject | null>(
  null
);
const [loadingInvitation, setLoadingInvitation] = useState(false);
```

**Flow:**

1. Check for `invitation_token` in URL
2. Fetch invitation details (shows project name, role)
3. Pre-fill email field (read-only)
4. User completes registration
5. Auto-login user
6. Auto-accept invitation
7. Redirect to inbox

**UI Changes:**

- Loading indicator while fetching invitation
- Blue banner showing project name and role
- Email field becomes read-only and grayed out
- Different success message when registering via invitation

### 3. `/packages/frontend/src/pages/invitations/AcceptInvitationPage.tsx`

**Added Features:**

- Checks if user is authenticated before accepting
- Redirects to login if not authenticated
- Preserves invitation token in redirect URL

**New Logic:**

```typescript
if (!isAuthenticated) {
  toast({
    title: "Yêu cầu đăng nhập",
    description: "Vui lòng đăng nhập để chấp nhận lời mời.",
  });
  navigate(`/login?redirect=/accept-invitation?token=${token}`, {
    replace: true,
  });
  return;
}
```

## User Flows

### Flow 1: Existing User Receives Invitation

1. User receives email with link: `https://app.example.com/accept-invitation?token=xxx`
2. User clicks link
3. System checks if user is logged in:
   - **If logged in**: Accept invitation → Redirect to inbox ✅
   - **If not logged in**: Redirect to login page → After login, accept invitation ✅

### Flow 2: New User Receives Invitation

1. User receives email with link: `https://app.example.com/register?invitation_token=xxx`
2. User clicks link
3. Registration page loads invitation details
4. Shows banner: "🎉 Bạn đang đăng ký để tham gia dự án: **Project Name**"
5. Email field is pre-filled and locked
6. User enters name and password
7. User submits registration
8. System auto-logs in user
9. System auto-accepts invitation
10. Redirects to inbox with project access ✅

## API Integration

### Public Endpoint (No Auth Required)

```typescript
GET /api/v1/projects/invitations/details?token=<token>

Response:
{
  id: "uuid",
  email: "user@example.com",
  token: "token",
  projectId: 1,
  inviterId: "uuid",
  role: "AGENT",
  status: "pending",
  expiresAt: "2025-10-26T...",
  createdAt: "2025-10-19T...",
  project: {
    id: 1,
    name: "Project Name",
    ...
  }
}
```

### Authenticated Endpoint

```typescript
POST /api/v1/projects/invitations/accept?token=<token>
Headers: Authorization: Bearer <access_token>

Response: 200 OK
```

## Error Handling

### Invitation Loading Errors (RegisterPage)

- Invalid token → Toast error
- Expired invitation → Toast error
- Network error → Toast error
- Continues to normal registration if invitation fails to load

### Acceptance Errors (AcceptInvitationPage)

- Not authenticated → Redirect to login
- Invalid token → Show error message
- Expired invitation → Show error message
- Already accepted → Show error message
- Already a member → Show error message

## Testing Checklist

### ✅ Test Case 1: New User Registration with Invitation

- [ ] Go to `/register?invitation_token=<valid_token>`
- [ ] Verify invitation banner appears with project name
- [ ] Verify email is pre-filled and read-only
- [ ] Complete registration
- [ ] Verify auto-login
- [ ] Verify redirect to inbox
- [ ] Verify user is added to project

### ✅ Test Case 2: Existing User Accepts Invitation (Logged In)

- [ ] Login first
- [ ] Go to `/accept-invitation?token=<valid_token>`
- [ ] Verify acceptance happens automatically
- [ ] Verify redirect to inbox
- [ ] Verify user is added to project

### ✅ Test Case 3: Existing User Accepts Invitation (Not Logged In)

- [ ] Logout
- [ ] Go to `/accept-invitation?token=<valid_token>`
- [ ] Verify redirect to login page
- [ ] Login
- [ ] Verify redirect back to accept invitation
- [ ] Verify acceptance happens
- [ ] Verify redirect to inbox

### ✅ Test Case 4: Invalid/Expired Token

- [ ] Go to `/register?invitation_token=invalid`
- [ ] Verify error toast appears
- [ ] Verify can still register normally
- [ ] Go to `/accept-invitation?token=expired`
- [ ] Verify error message displayed

### ✅ Test Case 5: Email Mismatch

- [ ] Register with invitation for email A
- [ ] Try to use different email → Should be prevented (read-only)
- [ ] Accept invitation for email A while logged in as email B
- [ ] Verify error: "This invitation was sent to a different email address"

## Security Considerations

✅ **Email Verification**: Email field is read-only when invitation token is present
✅ **Token Validation**: Both frontend and backend validate tokens
✅ **Authentication Check**: Accept invitation requires authentication
✅ **Expiration**: Tokens expire after 7 days
✅ **One-time Use**: Tokens can only be used once

## Future Improvements

1. Add loading skeleton for invitation banner
2. Add ability to resend invitation
3. Show invitation expiration date to user
4. Add invitation history for managers
5. Email notification when invitation is accepted
6. Add invitation analytics (sent, pending, accepted, expired)

## Notes

- All strings are in Vietnamese as per existing codebase
- Toast notifications follow existing pattern
- Error handling is consistent with other pages
- Auto-login uses the same API as normal login
- No new dependencies were added
