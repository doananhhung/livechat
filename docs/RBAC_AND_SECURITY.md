
# RBAC & Security Architecture

This document details the security mechanisms, Role-Based Access Control (RBAC) strategies, and authentication flows implemented across the Live Chat system.

## 1. Dual-Layer RBAC Model

The system implements a hybrid RBAC model that distinguishes between **System-Level Access** (Global) and **Resource-Level Access** (Project).

### 1.1. Global Roles
Global roles control access to system-wide features (e.g., Admin Dashboard, User Profile).
*   **Source**: `User.role` entity field.
*   **Enum**: `GlobalRole` (`ADMIN`, `USER`).
*   **Hierarchy**:
    *   `ADMIN` > `USER`
    *   *Implementation*: Hardcoded in `RolesGuard` (`globalRoleHierarchy`).

### 1.2. Project Roles
Project roles control access to specific tenants (Projects) and their resources (Conversations, Settings).
*   **Source**: `ProjectMember.role` entity field.
*   **Enum**: `ProjectRole` (`MANAGER`, `AGENT`).
*   **Hierarchy**:
    *   `MANAGER` > `AGENT`
    *   *Implementation*: Hardcoded in `RolesGuard` (`projectRoleHierarchy`).

### 1.3. The RolesGuard
The `RolesGuard` (`packages/backend/src/rbac/roles.guard.ts`) is the central enforcement point. It operates in two mutually exclusive modes based on the required role type.

#### Security Mechanism: Parameter Pollution Defense
When validating **Project Roles**, the guard strictly extracts the context ID from **Route Parameters** (`request.params.projectId` or `request.params.id`).

> **CRITICAL SECURITY NOTE**: The guard explicitly ignores `query` and `body` parameters to prevent **Parameter Pollution** attacks where an attacker might inject a conflicting ID to bypass checks.

```typescript
// Secure Context Extraction
const projectId = request.params.projectId || request.params.id;

if (!projectId) {
  // Fails safe if the route is not configured correctly
  return false;
}
```

## 2. Backend Security Mechanisms

### 2.1. Project Membership Validation
Service methods (e.g., `ProjectService.validateProjectMembership`) perform explicit checks before returning sensitive data or performing mutations.
*   **Logic**: Queries `ProjectMember` table for `{ userId, projectId }`.
*   **Failure**: Throws `ForbiddenException`.

### 2.2. Fail-Closed Origin Validation (Widget)
The public widget configuration endpoint (`getWidgetSettings`) implements a **Fail-Closed** security model to prevent CORS bypasses or widget hijacking.

*   **Logic**:
    1.  **Check Origin Header**: If missing, request is denied.
    2.  **Check Whitelist Configuration**: If the project has no `whitelistedDomains`, request is denied (Secure Default).
    3.  **Match**: The Origin hostname must strictly match an entry in `whitelistedDomains`.

### 2.3. Global Session Revocation
The `User` entity contains a `tokensValidFrom` timestamp.
*   **Mechanism**: All JWTs (Access Tokens) contain an `iat` (Issued At) claim.
*   **Enforcement**: The `JwtStrategy` compares `token.iat` vs `user.tokensValidFrom`.
*   **Trigger**: Password changes, Email changes, or "Log out all devices" actions update this timestamp, instantly invalidating all active Access Tokens globally.

## 3. Frontend Authentication Architecture

The frontend (`packages/frontend/src/lib/api.ts`) implements a robust, concurrency-safe authentication layer.

### 3.1. Axios Interceptor Chain
1.  **Request Interceptor**: Automatically injects `Authorization: Bearer <token>` from `authStore`.
2.  **Response Interceptor**: Handles global error states (401, 429).

### 3.2. Concurrency-Safe Token Refresh
To prevent **Refresh Token Stampedes** (where multiple parallel API calls all fail with 401 and trigger multiple refresh requests), the system uses a **Lock & Queue** pattern.

*   **State**: `isRefreshing` (boolean) and `refreshPromise` (Promise singleton).
*   **Flow**:
    1.  API Call fails with `401 TOKEN_INVALID`.
    2.  Check `isRefreshing`.
    3.  **If True**: The request is paused and awaits the resolution of `refreshPromise`. Once resolved, it retries with the new token.
    4.  **If False**: Sets `isRefreshing = true`, initiates `GET /auth/refresh`, and stores the promise.
    5.  **On Success**: Updates `authStore`, resolves `refreshPromise`, and retries the original request.
    6.  **On Failure**: Triggers global logout.

### 3.3. Auth Store State Machine
The `authStore` (`packages/frontend/src/stores/authStore.ts`) manages the session lifecycle using Zustand and `persist` middleware.
*   **Initialization**: `verifySessionAndFetchUser` runs on app mount.
*   **2FA Handling**: Detects specific 401 error messages (`Two factor authentication required`) to trigger the 2FA verification flow instead of a generic logout.

## 4. Client-Side Permission Model

While the backend enforces security, the frontend implements UI-level access control to improve UX.

### 4.1. `useProjectRole` Hook
A custom hook that derives the current user's role for a specific project from the cached `projects` query.
*   **Dependency**: Relies on React Query cache (`['projects']`).
*   **Usage**: Used to conditionally enable/disable features (e.g., "Invite Member" button).

### 4.2. `PermissionGate` Component
A wrapper component for declarative UI permission logic.

```tsx
<PermissionGate 
  projectId={currentProjectId} 
  allowedRoles={[ProjectRole.MANAGER]}
>
  <Button>Delete Project</Button>
</PermissionGate>
```

*   **Logic**: Checks if the user's role in the project matches `allowedRoles`.
*   **Hierarchy Support**: Supports implicit hierarchy (e.g., if `MANAGER` is allowed, `AGENT` is denied).

## 5. Critical Security Flows

### 5.1. Two-Factor Authentication (2FA) Login
The login process is split into two stages for 2FA-enabled users.

1.  **Stage 1 (Credential Check)**:
    *   User submits Email/Password.
    *   Backend validates credentials.
    *   **If 2FA Enabled**: Backend sets a `2fa_partial_token` (HttpOnly Cookie) and returns `401 Unauthorized` with `{ errorCode: '2FA_REQUIRED' }`.
2.  **Stage 2 (Verification)**:
    *   Frontend redirects to `/verify-2fa`.
    *   User enters TOTP code.
    *   Frontend calls `POST /2fa/authenticate`.
    *   Backend validates TOTP + Partial Token Cookie.
    *   Backend issues full Access/Refresh tokens.

### 5.2. Invitation Acceptance
*   **Strict Mode Resilience**: The `AcceptInvitationPage` uses a `useRef` guard to prevent double-submission of the invitation token during React Strict Mode development, which would otherwise cause "Token Invalid" errors.
*   **Email Binding**: The backend enforces that the authenticated user's email matches the invitation email, preventing link forwarding attacks.
