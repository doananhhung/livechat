# Invitation System - Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INVITATION SYSTEM                           │
│                    Complete Implementation Flow                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     MANAGER SENDS INVITATION                        │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Check if email exists  │
                    │      in database?       │
                    └─────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
       ┌─────────────────┐              ┌─────────────────┐
       │  Email EXISTS   │              │ Email NOT FOUND │
       │ (Existing User) │              │   (New User)    │
       └─────────────────┘              └─────────────────┘
                │                                   │
                ▼                                   ▼
    ┌──────────────────────┐         ┌──────────────────────────┐
    │  Send Email with:    │         │    Send Email with:      │
    │  "Chấp nhận lời mời" │         │ "Đăng ký và tham gia"    │
    │                      │         │                          │
    │  Link to:            │         │  Link to:                │
    │  /accept-invitation  │         │  /register               │
    │  ?token=xxx          │         │  ?invitation_token=xxx   │
    └──────────────────────┘         └──────────────────────────┘
                │                                   │
                │                                   │
┌───────────────┴──────────────┐    ┌──────────────┴────────────────┐
│   EXISTING USER PATH         │    │      NEW USER PATH            │
└───────────────┬──────────────┘    └──────────────┬────────────────┘
                │                                   │
                ▼                                   ▼
    ┌──────────────────────┐         ┌──────────────────────────┐
    │ User clicks link     │         │   User clicks link       │
    └──────────────────────┘         └──────────────────────────┘
                │                                   │
                ▼                                   ▼
    ┌──────────────────────┐         ┌──────────────────────────┐
    │ Is user logged in?   │         │  Registration Page       │
    └──────────────────────┘         │                          │
                │                    │  1. Fetch invitation     │
       ┌────────┴────────┐           │     details (public)     │
       ▼                 ▼           │  2. Show project name    │
    ┌─────┐         ┌──────┐         │  3. Pre-fill email       │
    │ YES │         │  NO  │         │  4. Lock email field     │
    └─────┘         └──────┘         └──────────────────────────┘
       │                 │                        │
       │                 ▼                        ▼
       │      ┌──────────────────┐    ┌──────────────────────────┐
       │      │ Redirect to      │    │ User fills:              │
       │      │ /login with      │    │ - Name                   │
       │      │ return URL       │    │ - Password               │
       │      └──────────────────┘    │ - Confirm password       │
       │                 │            └──────────────────────────┘
       │                 ▼                        │
       │      ┌──────────────────┐               ▼
       │      │ Login            │    ┌──────────────────────────┐
       │      └──────────────────┘    │ Submit registration      │
       │                 │            └──────────────────────────┘
       │                 ▼                        │
       └────────►┌──────────────────┐            ▼
                 │ Accept           │ ┌──────────────────────────┐
                 │ Invitation       │ │ Backend creates user     │
                 │ (Authenticated)  │ └──────────────────────────┘
                 └──────────────────┘            │
                         │                       ▼
                         │            ┌──────────────────────────┐
                         │            │ Frontend auto-login      │
                         │            │ (POST /auth/login)       │
                         │            └──────────────────────────┘
                         │                       │
                         │                       ▼
                         │            ┌──────────────────────────┐
                         │            │ Auto-accept invitation   │
                         │            │ (POST /invitations/      │
                         │            │       accept?token=xxx)  │
                         │            └──────────────────────────┘
                         │                       │
                         └───────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ Add user to project  │
                         │ as ProjectMember     │
                         └──────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ Mark invitation as   │
                         │ "ACCEPTED"           │
                         └──────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ Show success message │
                         └──────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ Redirect to /inbox   │
                         └──────────────────────┘
                                     │
                                     ▼
                         ┌──────────────────────┐
                         │ User can now access  │
                         │ project messages     │
                         └──────────────────────┘


═══════════════════════════════════════════════════════════════════════

                           API ENDPOINTS USED

═══════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────┐
│ PUBLIC ENDPOINTS (No Authentication Required)                     │
└────────────────────────────────────────────────────────────────────┘

  GET /api/v1/projects/invitations/details?token=<token>
  ├─ Used by: Registration page
  ├─ Returns: Invitation details + project info
  └─ Purpose: Pre-fill email and show project name

┌────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATED ENDPOINTS (Requires JWT Token)                      │
└────────────────────────────────────────────────────────────────────┘

  POST /api/v1/projects/invitations/accept?token=<token>
  ├─ Used by: Accept invitation page
  ├─ Requires: User must be logged in
  ├─ Validates: Email matches invitation
  └─ Action: Adds user to project

  POST /api/v1/projects/invitations
  ├─ Used by: Manager to send invitations
  ├─ Requires: MANAGER role
  ├─ Body: { email, projectId, role }
  └─ Action: Creates invitation + sends email

  GET /api/v1/projects/:id/invitations
  ├─ Used by: Manager to view invitations
  ├─ Requires: MANAGER role
  └─ Returns: List of all invitations for project

  DELETE /api/v1/projects/invitations/:id
  ├─ Used by: Manager to cancel invitation
  ├─ Requires: MANAGER role
  └─ Action: Deletes pending invitation


═══════════════════════════════════════════════════════════════════════

                        DATABASE OPERATIONS

═══════════════════════════════════════════════════════════════════════

  INVITATION TABLE
  ┌──────────────────────────────────────────────────────────────────┐
  │ Column       │ Type      │ Description                          │
  ├──────────────────────────────────────────────────────────────────┤
  │ id           │ UUID      │ Primary key                          │
  │ email        │ VARCHAR   │ Invitee email address                │
  │ token        │ VARCHAR   │ Secure random token (32 bytes)       │
  │ projectId    │ INT       │ Foreign key to projects              │
  │ inviterId    │ UUID      │ Foreign key to users (manager)       │
  │ role         │ ENUM      │ Role in project (AGENT, MANAGER)     │
  │ status       │ ENUM      │ PENDING, ACCEPTED, EXPIRED           │
  │ expiresAt    │ TIMESTAMP │ Expiration date (7 days)             │
  │ createdAt    │ TIMESTAMP │ Creation timestamp                   │
  └──────────────────────────────────────────────────────────────────┘

  When invitation is accepted:
  1. Create PROJECT_MEMBER record
     ├─ projectId: from invitation
     ├─ userId: from authenticated user
     └─ role: from invitation

  2. Update INVITATION record
     └─ status: PENDING → ACCEPTED


═══════════════════════════════════════════════════════════════════════

                           ERROR HANDLING

═══════════════════════════════════════════════════════════════════════

  Common Errors:
  ┌──────────────────────────────────────────────────────────────────┐
  │ Scenario                      │ Status │ Message                 │
  ├──────────────────────────────────────────────────────────────────┤
  │ Invitation not found          │ 404    │ Invitation not found    │
  │ Invitation expired            │ 400    │ This invitation has     │
  │                               │        │ expired                 │
  │ Invitation already used       │ 400    │ This invitation has     │
  │                               │        │ already been used       │
  │ Email mismatch                │ 403    │ This invitation was     │
  │                               │        │ sent to a different     │
  │                               │        │ email address           │
  │ Already a member              │ 409    │ You are already a       │
  │                               │        │ member of this project  │
  │ User not authenticated        │ 401    │ Unauthorized            │
  │ Only managers can invite      │ 403    │ Only managers can       │
  │                               │        │ invite members          │
  └──────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════

                        SECURITY FEATURES

═══════════════════════════════════════════════════════════════════════

  ✓ Token is cryptographically random (crypto.randomBytes(32))
  ✓ Token is hashed and unique in database
  ✓ Email verification ensures correct recipient
  ✓ Token expires after 7 days
  ✓ Token can only be used once
  ✓ Only managers can send invitations
  ✓ Public endpoint only exposes minimal info
  ✓ All mutations require authentication
  ✓ CORS and rate limiting applied
  ✓ SQL injection protected by TypeORM


═══════════════════════════════════════════════════════════════════════
```
