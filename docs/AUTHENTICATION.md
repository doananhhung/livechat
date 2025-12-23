
# Authentication & Security

## 1. Hybrid Token-Session Model

The system implements a **Stateful JWT Architecture**. While JWTs are used for transport (Stateless format), the validation logic is Stateful.

### 1.1 The Mechanism
*   **Transport**: `Authorization: Bearer <token>`
*   **Validation**: On *every* request, the `JwtStrategy`:
    1.  Decodes the token.
    2.  Queries the Database for the `User` entity.
    3.  Compares the token's `iat` (Issued At) timestamp against the user's `tokensValidFrom` column.

### 1.2 Rationale
This approach allows for **Immediate Global Revocation**. If a user changes their password or clicks "Log out all devices", the `tokensValidFrom` timestamp is updated, instantly invalidating all existing JWTs, regardless of their expiration time.

---

## 2. Two-Factor Authentication (2FA) State Machine

2FA is implemented via a multi-stage authentication pipeline involving ephemeral cookies.

### 2.1 The Flow
1.  **Login Request**: User submits email/password.
2.  **Credential Check**: Backend validates credentials.
3.  **2FA Detection**: If 2FA is enabled:
    *   Backend generates a **Partial Token** (JWT with restricted scope).
    *   Sets `2fa_partial_token` HttpOnly Cookie.
    *   Returns `401 Unauthorized` with `{ errorCode: '2FA_REQUIRED' }`.
4.  **Frontend Handling**: Intercepts the specific 401 error and redirects to `/verify-2fa`.
5.  **Verification**: User submits OTP code.
    *   Endpoint: `/auth/2fa/authenticate`.
    *   Guard: `AuthGuard('2fa-partial')` validates the cookie.
6.  **Finalization**: Backend issues full Access/Refresh tokens.

### 2.2 Security
*   **Partial Token**: Cannot be used to access protected resources. Only valid for the 2FA verification endpoint.
*   **Cookie Encryption**: The `2fa_secret` (during setup) is encrypted using AES-256-GCM before being stored in the cookie.

---

## 3. OAuth "Code Exchange" Pattern

To prevent token leakage in browser history or logs, the system uses a secure Code Exchange pattern for Social Login (Google).

### 3.1 The Flow
1.  **Initiation**: User clicks "Login with Google" -> Redirects to Backend -> Redirects to Google.
2.  **Callback**: Google redirects to Backend.
3.  **Code Generation**: Backend validates Google profile, generates a short-lived **One-Time Code** (stored in Redis), and redirects to Frontend:
    `https://app.domain.com/auth/callback?code=XYZ123`
4.  **Exchange**: Frontend immediately calls `POST /auth/exchange-code` with `{ code: 'XYZ123' }`.
5.  **Token Issue**: Backend validates and burns the code, returning the Access/Refresh tokens.

---

## 4. Token Rotation & Session Management

*   **Refresh Tokens**: Stored in the database (`RefreshToken` entity) and sent as `HttpOnly` cookies.
*   **Rotation**: Using a refresh token automatically invalidates it (deletes it) and issues a new one.
*   **Session Limits**: The system enforces a maximum number of active sessions (default: 5). This is a FIFO (First-In-First-Out) eviction policy managed in `TokenService`.
