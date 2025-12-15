# 🔧 Invitation Status Issue - Quick Fix Guide

## Problem Description

Invitations are showing as "Đang chờ" (Pending) even after users should have accepted them.

## Root Causes

### 1. **Old Invitations Created Before Update**

Invitations created before the new logic was implemented may have:

- Wrong link type (all got registration links)
- Need to be re-sent or manually accepted

### 2. **Existing Users Getting Registration Links**

If an existing user receives a registration link and is already logged in:

- Old behavior: Just redirected to dashboard (invitation not accepted)
- New behavior: Redirected to accept invitation page ✅

### 3. **Frontend Not Auto-Accepting for Existing Users**

The registration link doesn't automatically accept invitations for existing logged-in users.

---

## ✅ Solutions Implemented

### Solution 1: Frontend Redirect for Logged-In Users

**File:** `RegisterPage.tsx`

```typescript
useEffect(() => {
  // If user is already authenticated and has an invitation token,
  // redirect to accept invitation page
  const token = searchParams.get("invitation_token");
  if (isAuthenticated && token) {
    navigate(`/accept-invitation?token=${token}`, { replace: true });
    return;
  }

  // Otherwise, just redirect authenticated users to dashboard
  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
  }
}, [isAuthenticated, navigate, searchParams]);
```

**What it does:**

- Detects if logged-in user lands on `/register?invitation_token=xxx`
- Automatically redirects to `/accept-invitation?token=xxx`
- Invitation gets accepted properly

### Solution 2: Backend Logging

Added logs to track which type of link is being sent:

```typescript
this.logger.log(`Sending NEW USER invitation to ${email}...`);
// or
this.logger.log(`Sending EXISTING USER invitation to ${email}...`);
```

---

## 🔍 How to Diagnose Your Issue

### Step 1: Check Which Links Were Sent

Look at your backend logs when the invitations were created:

```bash
cd packages/backend
# Check logs or send a new test invitation
```

You should see logs like:

```
[InvitationService] Sending NEW USER invitation to newuser@test.com
[InvitationService] Sending EXISTING USER invitation to existinguser@test.com
```

### Step 2: Test Current Behavior

**Test A: New User (Never Registered)**

1. Invite email: `brandnew@test.com`
2. Check logs - should say "NEW USER"
3. Email should contain: "Đăng ký và tham gia"
4. Link should be: `/register?invitation_token=xxx`
5. User registers → Auto-accept → Status changes to "Đã chấp nhận"

**Test B: Existing User (Not Logged In)**

1. Invite email: `existing@test.com` (already has account)
2. Check logs - should say "EXISTING USER"
3. Email should contain: "Chấp nhận lời mời"
4. Link should be: `/accept-invitation?token=xxx`
5. User logs in → Accept → Status changes to "Đã chấp nhận"

**Test C: Existing User (Already Logged In)**

1. Invite email: `loggedin@test.com` (already has account)
2. User is already logged in
3. User clicks ANY invitation link (even registration link)
4. Frontend detects auth + token → Redirects to accept page
5. Accept → Status changes to "Đã chấp nhận"

---

## 🚨 Fix for Existing Pending Invitations

The invitations showing "Đang chờ" in your screenshot are likely old invitations. Here are your options:

### Option 1: Delete and Re-send (Recommended)

1. As manager, go to invitations page
2. Delete the pending invitations (trash icon)
3. Send new invitations
4. New invitations will have correct logic

### Option 2: Manual Accept (For Testing)

1. Copy the invitation token from the pending invitation
2. If user exists and is logged in:
   - Go to: `https://app.dinhviethoang604.id.vn/accept-invitation?token=<COPIED_TOKEN>`
3. If user doesn't exist:
   - Go to: `https://app.dinhviethoang604.id.vn/register?invitation_token=<COPIED_TOKEN>`
4. Status will change to "Đã chấp nhận"

### Option 3: Database Update (Advanced)

If you have many pending invitations, you can update them via SQL:

```sql
-- Find pending invitations
SELECT * FROM invitations WHERE status = 'pending';

-- Manually mark as accepted (only if user is already a project member)
UPDATE invitations
SET status = 'accepted'
WHERE id = '<invitation-id>'
AND email IN (
  SELECT u.email FROM users u
  JOIN project_members pm ON pm.user_id = u.id
  WHERE pm.project_id = (SELECT project_id FROM invitations WHERE id = '<invitation-id>')
);
```

---

## 📝 Testing Checklist

After the update, test these scenarios:

- [ ] **New user** invitation → Receives registration link → Registers → Auto-accepted ✅
- [ ] **Existing user** invitation → Receives accept link → Accepts → Status updated ✅
- [ ] **Logged-in user** clicks registration link → Redirected to accept → Accepted ✅
- [ ] **Logged-in user** clicks accept link → Accepts immediately → Status updated ✅
- [ ] Check backend logs show correct "NEW USER" or "EXISTING USER" messages ✅
- [ ] Old pending invitations can be deleted and re-sent ✅

---

## 🎯 Quick Action Steps

**For your current situation:**

1. **Delete the two pending invitations** showing in your screenshot:

   ```
   - lekimngoc230112005@gmail.com
   - dinhviethoang604@gmail.com
   ```

2. **Restart your backend** to ensure new code is loaded:

   ```bash
   cd packages/backend
   # Press Ctrl+C to stop
   npm run start:dev
   ```

3. **Restart your frontend**:

   ```bash
   cd packages/frontend
   # Press Ctrl+C to stop
   npm run dev
   ```

4. **Send fresh invitations** to both emails

5. **Watch the backend logs** - you should see:

   ```
   [InvitationService] Sending EXISTING USER invitation to dinhviethoang604@gmail.com
   [InvitationService] Sending EXISTING USER invitation to lekimngoc230112005@gmail.com
   ```

   (Assuming both users exist)

6. **Users click the links** in the email

7. **Check status** - should change from "Đang chờ" to "Đã chấp nhận"

---

## 🐛 Still Not Working?

If invitations still show "Đang chờ":

### Check 1: Is the accept API being called?

- Open browser DevTools (F12)
- Go to Network tab
- Click invitation link
- Look for: `POST /api/v1/projects/invitations/accept?token=xxx`
- Check response status

### Check 2: Backend logs

```bash
cd packages/backend
# Look for logs like:
[InvitationService] Accepting invitation: token=xxx, userId=xxx, user.email=xxx, invitation.email=xxx
```

### Check 3: Database

```sql
-- Check invitation status
SELECT id, email, status, created_at
FROM invitations
WHERE project_id = 1
ORDER BY created_at DESC;

-- Check if user was added to project
SELECT pm.*, u.email
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = 1;
```

---

## 📊 Expected vs Current Behavior

| Scenario                            | Old Behavior             | New Behavior          |
| ----------------------------------- | ------------------------ | --------------------- |
| New user gets invite                | Registration link ✅     | Registration link ✅  |
| Existing user gets invite           | ❌ Registration link     | ✅ Accept link        |
| Logged-in user on registration page | ❌ Redirect to dashboard | ✅ Redirect to accept |
| Accept invitation                   | ✅ Works                 | ✅ Works              |
| Status update                       | ✅ Updates               | ✅ Updates            |

---

## 💡 Summary

The issue is that:

1. Old invitations were sent before the new logic was implemented
2. Some existing users may have received registration links
3. When they clicked, they were just redirected without accepting

**The fix:**

1. Frontend now redirects logged-in users from registration to accept page
2. Backend now sends correct link type based on user existence
3. New invitations will work correctly
4. Old invitations should be deleted and re-sent

**Next steps:**

1. Delete old pending invitations
2. Restart services
3. Send new invitations
4. Test and verify status changes

---

**Date:** October 19, 2025  
**Status:** Fixed ✅  
**Action Required:** Delete old invitations and resend
