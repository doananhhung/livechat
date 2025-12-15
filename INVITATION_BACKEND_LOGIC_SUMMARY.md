# Backend Invitation Logic - Complete Analysis

## Overview

The invitation system allows project managers to invite users (via email) to join their projects. The system supports both new users (who need to register) and existing users (who can directly accept).

---

## 📁 File Structure

### Core Files:

1. **`packages/backend/src/projects/invitation.service.ts`** - Main invitation business logic
2. **`packages/backend/src/projects/project.controller.ts`** - API endpoints for invitations
3. **`packages/shared/src/invitation.entity.ts`** - Invitation database entity
4. **`packages/shared/src/invitation.dto.ts`** - DTOs for invitation operations
5. **`packages/backend/src/auth/auth.service.ts`** - Registration service (no invitation integration)
6. **`packages/backend/src/auth/auth.controller.ts`** - Auth endpoints

---

## 🔄 Complete Invitation Flow

### Flow 1: Inviting a User (Manager)

```
Manager → POST /projects/invitations
    ↓
InvitationService.createInvitation()
    ↓
1. Verify inviter is MANAGER of the project
2. Check if project exists
3. Check if user already member (if registered)
4. Check for existing pending invitation
5. Generate secure token (32 bytes hex)
6. Set expiration (7 days)
7. Create invitation record
8. Send email with invitation link
    ↓
Email sent with:
- NEW USER: /register?invitation_token={token}
- EXISTING USER: /accept-invitation?token={token}
```

### Flow 2: New User Registration (WITHOUT Invitation Integration)

```
User → POST /auth/register
    ↓
AuthService.register()
    ↓
1. Check if email exists
2. Hash password
3. Create user (isEmailVerified=false)
4. Generate verification token
5. Send verification email
    ↓
User NOT automatically added to project ❌
```

**⚠️ CRITICAL ISSUE**: The registration endpoint does NOT accept or process `invitation_token`. New users who register via invitation link are NOT automatically added to projects.

### Flow 3: Accepting Invitation (Existing Users Only)

```
User → POST /projects/invitations/accept?token={token}
    ↓
InvitationService.acceptInvitation()
    ↓
1. Find invitation by token
2. Check if status is PENDING
3. Check if not expired
4. Verify user email matches invitation email
5. Check if user already member
6. Add user to project_members (with role from invitation)
7. Mark invitation as ACCEPTED
```

### Flow 4: Getting Invitation Details (Public Endpoint)

```
Frontend → GET /projects/invitations/details?token={token}
    ↓
InvitationService.getInvitationByToken()
    ↓
1. Find invitation by token
2. Check if expired
3. Check if still pending
4. Load project details
5. Return invitation + project info
```

---

## 🛠️ API Endpoints

### 1. **Create Invitation** (Manager Only)

```typescript
POST /projects/invitations
Headers: { Authorization: Bearer {jwt} }
Body: {
  email: string,
  projectId: number,
  role?: 'admin' | 'manager' | 'agent' // defaults to 'agent'
}
```

**Throttling**: 5 invitations per minute

**Authorization**:

- Requires JWT authentication
- Requires MANAGER role for the project

**Validations**:

- ✅ Inviter must be MANAGER
- ✅ Project must exist
- ✅ User not already a member
- ✅ No pending invitation exists

---

### 2. **Get Project Invitations** (Manager Only)

```typescript
GET /projects/:id/invitations
Headers: { Authorization: Bearer {jwt} }
```

**Authorization**:

- Requires MANAGER role for the project

**Returns**: Array of all invitations for the project (ordered by createdAt DESC)

---

### 3. **Cancel Invitation** (Manager Only)

```typescript
DELETE /projects/invitations/:invitationId
Headers: { Authorization: Bearer {jwt} }
```

**Authorization**:

- Requires MANAGER role for the project

**Action**: Deletes the invitation record

---

### 4. **Accept Invitation** (Authenticated Users)

```typescript
POST /projects/invitations/accept?token={token}
Headers: { Authorization: Bearer {jwt} }
```

**Authorization**:

- Requires valid JWT (authenticated user)

**Process**:

1. Validates token
2. Checks invitation not expired/used
3. Verifies email matches
4. Adds user to project with specified role
5. Marks invitation as ACCEPTED

---

### 5. **Get Invitation Details** (Public)

```typescript
GET /projects/invitations/details?token={token}
```

**Authorization**: None (Public endpoint with @Public() decorator)

**Purpose**: Pre-fill registration form with email and show project info

**Returns**:

```typescript
{
  id: string,
  email: string,
  token: string,
  projectId: number,
  inviterId: string,
  role: string,
  status: InvitationStatus,
  expiresAt: Date,
  createdAt: Date,
  project: Project
}
```

---

## 📧 Email Templates

### For New Users:

```
Subject: Lời mời tham gia dự án "{project.name}" với vai trò {role}

Link: {FRONTEND_URL}/register?invitation_token={token}
Button: "Đăng ký và tham gia"
Expires: 7 days
```

### For Existing Users:

```
Subject: Lời mời tham gia dự án "{project.name}" với vai trò {role}

Link: {FRONTEND_URL}/accept-invitation?token={token}
Button: "Chấp nhận lời mời"
Expires: 7 days
```

---

## 🗄️ Database Schema

### `invitations` Table:

```typescript
{
  id: uuid (PK),
  email: varchar,
  token: varchar (unique),
  projectId: int (FK → projects.id),
  inviterId: uuid (FK → users.id),
  role: enum('admin', 'manager', 'agent'),
  status: enum('pending', 'accepted', 'expired'),
  expiresAt: timestamptz,
  createdAt: timestamptz
}
```

### Related Tables:

- `users` - User accounts
- `projects` - Projects
- `project_members` - Project membership records

---

## 🚨 Critical Issues Found

### Issue 1: Registration Does NOT Process Invitations ❌

**Problem**:

- The `RegisterDto` class does NOT include an `invitationToken` field
- The `AuthService.register()` method does NOT accept or process invitation tokens
- New users who register via `/register?invitation_token={token}` are NOT automatically added to projects

**Impact**:

- New users must:
  1. Register via invitation link
  2. Verify email
  3. Log in
  4. **Manually** accept invitation via separate API call
  5. OR manager must manually add them

**Expected Flow** (MISSING):

```typescript
POST /auth/register
Body: {
  email: string,
  password: string,
  fullName: string,
  invitationToken?: string  // ❌ MISSING
}

// Should automatically:
1. Create user
2. If invitationToken present:
   - Find invitation
   - Verify email matches
   - Add to project
   - Mark invitation as accepted
```

---

### Issue 2: No Automatic Invitation Acceptance After Registration

**Problem**: After a new user registers (even with invitation token in URL), there's no automatic flow to:

- Accept the invitation
- Add them to the project

**Current Workaround**:

- Frontend must call `POST /projects/invitations/accept?token={token}` after user logs in for the first time
- This requires frontend to store the token and remember to call the endpoint

---

### Issue 3: Email Verification Required Before Joining Project

**Observation**:

- New users must verify email before they can log in
- Only after login can they accept invitation
- This adds friction to the invitation flow

**Sequence**:

1. User clicks invitation link → `/register?invitation_token={token}`
2. User registers
3. User receives verification email
4. User verifies email
5. User logs in
6. **User MUST manually accept invitation** (frontend responsibility)

---

## ✅ What Works Well

### 1. **Invitation Creation**

- ✅ Proper authorization checks (manager only)
- ✅ Duplicate invitation prevention
- ✅ Already-member detection
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Expiration handling (7 days)
- ✅ Different email flows for new vs existing users

### 2. **Invitation Acceptance** (for existing users)

- ✅ Token validation
- ✅ Expiration checking
- ✅ Email matching
- ✅ Transaction safety
- ✅ Status updates
- ✅ Duplicate member prevention

### 3. **Security**

- ✅ Role-based access control (RBAC)
- ✅ JWT authentication
- ✅ Secure random tokens
- ✅ Email verification
- ✅ Rate limiting on invitation creation (5/min)
- ✅ Rate limiting on registration (5/60sec)

### 4. **Email System**

- ✅ Different templates for new/existing users
- ✅ Clear action buttons
- ✅ Expiration warnings
- ✅ Proper subject lines with project name and role

---

## 🔧 Recommended Fixes

### Fix 1: Add Invitation Token to Registration

**Update `RegisterDto`**:

```typescript
export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ." })
  @IsNotEmpty({ message: "Email không được để trống." })
  email: string;

  @IsNotEmpty({ message: "Mật khẩu không được để trống." })
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." })
  password: string;

  @IsNotEmpty({ message: "Tên không được để trống." })
  fullName: string;

  // NEW: Optional invitation token
  @IsOptional()
  @IsString()
  invitationToken?: string;
}
```

**Update `AuthService.register()`**:

```typescript
async register(registerDto: RegisterDto): Promise<{ message: string }> {
  return await this.entityManager.transaction(async (entityManager) => {
    const existingUser = await this.userService.findOneByEmail(
      registerDto.email
    );
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const newUser = await entityManager.save(User, {
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      isEmailVerified: false,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `verification-token:${verificationToken}`;
    await this.cacheManager.set(tokenKey, newUser.id, 900000);

    await this.mailService.sendUserConfirmation(newUser, verificationToken);

    // NEW: Handle invitation if token provided
    if (registerDto.invitationToken) {
      try {
        // Store invitation token for later acceptance
        const invitationKey = `pending-invitation:${newUser.id}`;
        await this.cacheManager.set(
          invitationKey,
          registerDto.invitationToken,
          604800000 // 7 days
        );
      } catch (error) {
        this.logger.error('Failed to store invitation token', error);
        // Don't fail registration if invitation storage fails
      }
    }

    return {
      message:
        'Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản.',
    };
  });
}
```

---

### Fix 2: Auto-Accept Invitation After Email Verification

**Update `AuthService.verifyEmail()`**:

```typescript
async verifyEmail(token: string): Promise<{ message: string }> {
  const tokenKey = `verification-token:${token}`;
  const userId = await this.cacheManager.get<string>(tokenKey);

  if (!userId) {
    throw new NotFoundException(
      'Token xác thực không hợp lệ hoặc đã hết hạn.'
    );
  }

  await this.userService.markEmailAsVerified(userId);
  await this.cacheManager.del(tokenKey);

  // NEW: Check for pending invitation
  const invitationKey = `pending-invitation:${userId}`;
  const invitationToken = await this.cacheManager.get<string>(invitationKey);

  if (invitationToken) {
    try {
      // Auto-accept invitation
      await this.invitationService.acceptInvitation(invitationToken, userId);
      await this.cacheManager.del(invitationKey);

      return {
        message: 'Xác thực email thành công. Bạn đã được thêm vào dự án.'
      };
    } catch (error) {
      this.logger.error('Failed to auto-accept invitation', error);
      // Don't fail verification if invitation acceptance fails
    }
  }

  return { message: 'Xác thực email thành công.' };
}
```

---

### Fix 3: Add Invitation Info to Registration Response

**Create Enhanced Response DTO**:

```typescript
export class RegisterResponseDto {
  message: string;
  hasInvitation?: boolean;
  projectName?: string;
}
```

**Update registration to return invitation context**:

```typescript
// In register method, before returning:
if (registerDto.invitationToken) {
  try {
    const invitation = await this.invitationService.getInvitationByToken(
      registerDto.invitationToken
    );
    return {
      message:
        "Đăng ký thành công, vui lòng kiểm tra email để kích hoạt tài khoản.",
      hasInvitation: true,
      projectName: invitation.project.name,
    };
  } catch (error) {
    // Invitation invalid, proceed normally
  }
}
```

---

## 🧪 Testing Checklist

### Scenario 1: Invite New User

- [ ] Manager can create invitation with valid email
- [ ] Email is sent with registration link containing token
- [ ] Token is valid and unique
- [ ] Registration form pre-fills email
- [ ] User registers successfully
- [ ] User receives verification email
- [ ] User verifies email
- [ ] User is automatically added to project ⚠️ (CURRENTLY FAILS)
- [ ] Invitation status updates to ACCEPTED
- [ ] User can access project with correct role

### Scenario 2: Invite Existing User

- [ ] Manager can create invitation
- [ ] Email is sent with accept link
- [ ] User clicks link and accepts
- [ ] User is added to project with correct role
- [ ] Invitation status updates to ACCEPTED
- [ ] User can see project in their list

### Scenario 3: Edge Cases

- [ ] Cannot invite user who is already a member
- [ ] Cannot invite same email twice (pending)
- [ ] Cannot accept expired invitation
- [ ] Cannot accept invitation with wrong email
- [ ] Cannot invite if not manager
- [ ] Rate limiting works (5 invites/min)
- [ ] Token is cryptographically secure

### Scenario 4: Email Verification

- [ ] Cannot log in without verifying email
- [ ] Verification link expires after 15 minutes
- [ ] Can resend verification email
- [ ] Invitation token persists during verification

---

## 🔍 Security Considerations

### ✅ Implemented:

1. **Token Security**: 32-byte cryptographically random tokens
2. **Authorization**: RBAC with JWT
3. **Rate Limiting**: Throttling on sensitive endpoints
4. **Email Verification**: Required before login
5. **Expiration**: Invitations expire after 7 days
6. **Email Matching**: Invitation email must match user email
7. **Transaction Safety**: Database operations use transactions

### ⚠️ Potential Improvements:

1. **Token Reuse**: Tokens are not invalidated after failed attempts
2. **Brute Force**: No rate limiting on invitation acceptance
3. **Email Enumeration**: Error messages could leak user existence
4. **Invitation Spam**: Manager can send unlimited unique invitations (to different emails)

---

## 📊 Database Queries for Debugging

See `DATABASE_CHECK_INVITATION.md` for complete SQL queries to check:

- Invitation status
- User registration status
- Project membership
- Complete invitation journey
- Pending invitations
- Statistics

---

## 🔗 Related Documentation

- `INVITATION_FEATURE.md` - Original feature documentation
- `DATABASE_CHECK_INVITATION.md` - SQL queries for debugging
- `INVITATION_FIX_GUIDE.md` - Step-by-step fix guide
- `INVITATION_TESTING_CHECKLIST.md` - Testing procedures

---

## 📝 Summary

### Current State:

- ✅ Invitation creation works well
- ✅ Email sending works (with proper templates)
- ✅ Existing user acceptance works
- ❌ **New user registration does NOT process invitations**
- ❌ **No automatic project joining after registration**
- ⚠️ Requires manual frontend logic to accept invitations

### Required Changes:

1. Add `invitationToken` to `RegisterDto`
2. Process invitation token during registration
3. Auto-accept invitation after email verification
4. Update response DTOs to include invitation context

### Priority: **HIGH** 🔴

This is a critical user experience issue that breaks the invitation flow for new users.

---

**Last Updated**: October 19, 2025  
**Reviewed By**: AI Analysis  
**Status**: Analysis Complete, Fixes Required
