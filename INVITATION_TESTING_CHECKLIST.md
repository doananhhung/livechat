# Invitation System - Testing Checklist

## Pre-requisites

- [ ] Backend is running
- [ ] Frontend is running
- [ ] Email service is configured (for testing, check logs for email content)
- [ ] You have at least one project with you as MANAGER

---

## Test 1: Invite New User (Not Registered)

### Steps:

1. - [ ] Login as a manager
2. - [ ] Go to project settings → Invitations
3. - [ ] Invite email: `newuser@test.com` (an email that doesn't exist in your system)
4. - [ ] Check backend logs or email - should see "Đăng ký và tham gia" text
5. - [ ] Copy the registration URL (should be: `/register?invitation_token=xxx`)
6. - [ ] Open URL in incognito/private browser window
7. - [ ] Verify you see:
   - [ ] Blue banner with project name
   - [ ] Email field pre-filled with `newuser@test.com`
   - [ ] Email field is grayed out (read-only)
   - [ ] Text shows: "Vai trò: Agent" (or the role you invited)
8. - [ ] Fill in name and password
9. - [ ] Click "Tạo tài khoản"
10. - [ ] Wait for success (might take 2-3 seconds)
11. - [ ] Verify you're redirected to `/inbox`
12. - [ ] Verify you're logged in (see user menu)
13. - [ ] Verify the project appears in your project list
14. - [ ] Check as manager - the invitation status should be "accepted"

**Expected Result:** ✅ New user is registered and automatically added to project

---

## Test 2: Invite Existing User (Already Registered)

### Steps:

1. - [ ] Create a second user account (or use an existing one)
2. - [ ] Note the email: `existinguser@test.com`
3. - [ ] Login as manager (first account)
4. - [ ] Invite `existinguser@test.com` to your project
5. - [ ] Check backend logs or email - should see "Chấp nhận lời mời" text
6. - [ ] Copy the invitation URL (should be: `/accept-invitation?token=xxx`)
7. - [ ] **Without logging in**, open URL in incognito window
8. - [ ] Verify you're redirected to login page
9. - [ ] Login as `existinguser@test.com`
10. - [ ] Verify you're automatically redirected back to accept invitation
11. - [ ] Wait for success message
12. - [ ] Verify you're redirected to `/inbox`
13. - [ ] Verify the project appears in your project list

**Expected Result:** ✅ Existing user is added to project after logging in

---

## Test 3: Existing User Already Logged In

### Steps:

1. - [ ] Login as an existing user
2. - [ ] Get an invitation link for this user's email
3. - [ ] While logged in, open the invitation URL: `/accept-invitation?token=xxx`
4. - [ ] Verify acceptance happens automatically (see loading spinner)
5. - [ ] Verify success message appears
6. - [ ] Verify redirect to inbox
7. - [ ] Verify project is added to your list

**Expected Result:** ✅ Logged-in user immediately accepts invitation

---

## Test 4: Invalid/Expired Token

### Steps:

1. - [ ] Try URL: `/register?invitation_token=invalid-token-123`
2. - [ ] Verify error toast appears
3. - [ ] Verify you can still register normally (without invitation)
4. - [ ] Try URL: `/accept-invitation?token=expired-token-123`
5. - [ ] Verify error message is displayed

**Expected Result:** ✅ Proper error handling for invalid tokens

---

## Test 5: Email Mismatch Protection

### Steps:

1. - [ ] Login as user A (e.g., `usera@test.com`)
2. - [ ] Get invitation link for user B (e.g., `userb@test.com`)
3. - [ ] While logged in as user A, try to accept user B's invitation
4. - [ ] Verify error: "This invitation was sent to a different email address."

**Expected Result:** ✅ System prevents wrong user from accepting invitation

---

## Test 6: Duplicate Invitation Handling

### Steps:

1. - [ ] Invite the same email twice to same project
2. - [ ] Verify second invitation shows error: "A pending invitation already exists"
3. - [ ] Accept the first invitation
4. - [ ] Try to accept the same invitation again
5. - [ ] Verify error: "This invitation has already been used"

**Expected Result:** ✅ System prevents duplicate invitations and reuse

---

## Test 7: Check Manager View

### Steps:

1. - [ ] Login as manager
2. - [ ] Go to project settings → Invitations tab
3. - [ ] Verify you can see:
   - [ ] List of all invitations (pending, accepted, expired)
   - [ ] Email, role, status, created date
   - [ ] Option to cancel pending invitations
4. - [ ] Cancel a pending invitation
5. - [ ] Verify invitation disappears from list
6. - [ ] Try to accept the cancelled invitation
7. - [ ] Verify error: "Invitation not found"

**Expected Result:** ✅ Manager can view and manage all invitations

---

## Common Issues & Solutions

### Issue: Email not sending

- Check backend logs for email service configuration
- Verify SMTP settings in .env file
- For development, emails might just be logged to console

### Issue: Auto-login not working after registration

- Check browser console for errors
- Verify API URL is correct in frontend .env
- Check backend CORS settings allow credentials

### Issue: Public endpoint returns 401

- Verify `@Public()` decorator is on the endpoint
- Check JWT guard has been updated to respect public decorator
- Restart backend server

### Issue: Email field not pre-filling

- Check browser console for errors fetching invitation
- Verify invitation token is in URL
- Check backend returns project details with invitation

### Issue: Redirect not working

- Check browser console for navigation errors
- Verify routes are properly configured
- Check if auth state is being set correctly

---

## Success Criteria

All tests pass ✅ = System is working correctly!

You should be able to:

- ✅ Invite new users who can register and join automatically
- ✅ Invite existing users who can accept and join
- ✅ Handle errors gracefully
- ✅ Prevent unauthorized access
- ✅ Manage invitations as a manager

---

## Next Steps After Testing

Once all tests pass:

1. - [ ] Test on staging environment
2. - [ ] Update user documentation
3. - [ ] Train managers on invitation feature
4. - [ ] Monitor invitation acceptance rate
5. - [ ] Consider adding email templates customization
6. - [ ] Consider adding invitation reminders

---

**Date Completed:** ********\_********

**Tested By:** ********\_********

**Notes:**

---

---

---
