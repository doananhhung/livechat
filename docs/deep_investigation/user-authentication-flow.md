# Feature Investigation: User (Agent/Manager) Authentication Flow

## Overview

This document investigates the complete authentication flow for users (agents and managers) in the live chat application. The system implements a multi-layered authentication architecture supporting:

1. **Email/Password Authentication** with email verification
2. **OAuth (Google) Authentication** with account linking
3. **Two-Factor Authentication (2FA)** using TOTP
4. **JWT-based Session Management** with access and refresh tokens
5. **Role-Based Access Control** at both global and project levels
6. **WebSocket Authentication** for real-time features

Users in this system are stored in the `users` table and can have either a `GlobalRole` (ADMIN, USER) for system-level access, and a `ProjectRole` (MANAGER, AGENT) for project-specific permissions via the `project_members` join table.

---

## Entry Points

| Function/Method              | File                                                                                                                   | Purpose                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `POST /auth/register`        | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Register new user with email/password           |
| `GET /auth/verify-email`     | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Verify email with token                         |
| `POST /auth/login`           | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Email/password login (with 2FA support)         |
| `GET /auth/refresh`          | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Refresh access token using refresh token cookie |
| `POST /auth/logout`          | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Logout from current session                     |
| `POST /auth/logout-all`      | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Logout from all sessions                        |
| `GET /auth/google`           | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Initiate Google OAuth login                     |
| `GET /auth/google/callback`  | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Handle Google OAuth callback                    |
| `POST /auth/exchange-code`   | [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | Exchange one-time code for tokens (OAuth)       |
| `POST /2fa/authenticate`     | [two-factor-authentication.controller.ts](../../packages/backend/src/auth/2fa/two-factor-authentication.controller.ts) | Complete 2FA verification                       |
| `POST /2fa/recover`          | [two-factor-authentication.controller.ts](../../packages/backend/src/auth/2fa/two-factor-authentication.controller.ts) | Login using 2FA recovery code                   |
| WebSocket `handleConnection` | [ws-auth.service.ts](../../packages/backend/src/gateway/services/ws-auth.service.ts)                                   | Authenticate WebSocket connections              |

---

## Execution Flow

### 1. User Registration Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as AuthController
    participant RS as RegistrationService
    participant US as UserService
    participant Cache as CacheManager
    participant Mail as MailService

    Client->>API: POST /auth/register {email, password, fullName}
    API->>RS: register(registerDto)
    RS->>US: findOneByEmail(email)
    alt Email exists
        RS-->>API: Throw ConflictException
    else Email available
        RS->>RS: bcrypt.hash(password, SALT_ROUNDS)
        RS->>RS: Save User (isEmailVerified: false)
        RS->>RS: Generate verificationToken (crypto.randomBytes)
        RS->>Cache: set("verification-token:{token}", userId, 15min)
        RS->>Mail: sendUserConfirmation(user, token)
        RS-->>API: {message: "Please check email"}
    end
    API-->>Client: 201 Created
```

**Key Details:**

- Password is hashed using bcrypt with `BCRYPT_SALT_ROUNDS` (default: 10)
- Verification token stored in cache for 15 minutes
- User is created with `isEmailVerified: false`
- Optional `invitationToken` stored for project invitation flow

### 2. Email Verification Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as AuthController
    participant RS as RegistrationService
    participant Cache as CacheManager
    participant US as UserService

    Client->>API: GET /auth/verify-email?token={token}
    API->>RS: verifyEmail(token)
    RS->>Cache: get("verification-token:{token}")
    alt Token invalid/expired
        RS-->>API: Throw NotFoundException
    else Token valid
        RS->>US: markEmailAsVerified(userId)
        RS->>Cache: delete("verification-token:{token}")
        RS->>Cache: get("pending-invitation:{userId}")
        RS-->>API: {message, invitationToken?}
    end
    API-->>Client: 200 OK
```

### 3. Email/Password Login Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Guard as LocalAuthGuard
    participant Strategy as LocalStrategy
    participant PS as PasswordService
    participant API as AuthController
    participant LS as LoginService
    participant TS as TokenService

    Client->>API: POST /auth/login {email, password}
    API->>Guard: Activate LocalAuthGuard
    Guard->>Strategy: validate(email, password)
    Strategy->>PS: validateUser(email, password)
    PS->>PS: findOneByEmail(email)
    PS->>PS: bcrypt.compare(password, passwordHash)
    alt Invalid credentials
        PS-->>Strategy: null
        Strategy-->>Guard: Throw UnauthorizedException
    else Valid but email not verified
        Strategy-->>Guard: Throw ForbiddenException
    else Valid but account suspended
        PS-->>Strategy: Throw ForbiddenException
    else Valid credentials
        Strategy-->>Guard: User object
        Guard->>API: user attached to request.user
    end

    API->>LS: login(user, ipAddress, userAgent)
    alt 2FA enabled
        LS->>TS: generate2FAPartialToken(userId)
        TS-->>LS: {partialToken}
        LS-->>API: {status: "2fa_required", partialToken}
        API->>API: Set cookie "2fa_partial_token" (httpOnly, 5min)
        API-->>Client: 401 {errorCode: "2FA_REQUIRED"}
    else 2FA not enabled
        LS->>TS: generateTokens(userId, email)
        TS-->>LS: {accessToken, refreshToken}
        LS->>TS: setCurrentRefreshToken(...)
        LS->>LS: updateLastLogin(userId)
        LS-->>API: {tokens, user}
        API->>API: Set cookie "refresh_token" (httpOnly)
        API-->>Client: 200 {accessToken, refreshToken, user}
    end
```

**Key Details:**

- `LocalAuthGuard` activates `LocalStrategy` (passport-local)
- `LocalStrategy` uses `PasswordService.validateUser()` to verify credentials
- Password validation checks: bcrypt compare, account status (SUSPENDED/INACTIVE/ACTIVE)
- INACTIVE users are automatically reactivated upon login
- If 2FA is enabled, a partial token is issued instead of full tokens
- Refresh token stored as bcrypt hash in `refresh_tokens` table with session metadata

### 4. Token Generation and Storage

The `TokenService` handles all token operations:

| Token Type        | Secret                       | Expiry Config                          | Storage                       |
| ----------------- | ---------------------------- | -------------------------------------- | ----------------------------- |
| Access Token      | `JWT_SECRET`                 | `JWT_EXPIRES_IN` (e.g., "15m")         | Client memory/localStorage    |
| Refresh Token     | `JWT_REFRESH_SECRET`         | `JWT_REFRESH_EXPIRES_IN` (e.g., "30d") | HttpOnly cookie + DB (hashed) |
| 2FA Partial Token | `TWO_FACTOR_AUTH_JWT_SECRET` | `TWO_FACTOR_AUTH_JWT_EXPIRES_IN`       | HttpOnly cookie               |

**JWT Payload Structure:**

```typescript
// Access Token & Refresh Token
{
  sub: string; // User ID
  email: string; // User email
  iat: number; // Issued at (auto-generated)
  exp: number; // Expiration (auto-generated)
}

// 2FA Partial Token
{
  sub: string; // User ID
  isTwoFactorAuthenticated: false; // Always false for partial
  is2FA: true; // Marker for 2FA flow
}
```

**Session Limit Enforcement:**

- Configured via `SESSION_LIMIT` environment variable (default: 5)
- When limit exceeded, oldest sessions are automatically removed
- Each refresh token stored with `ipAddress` and `userAgent` for audit

### 5. Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client as Frontend (axios interceptor)
    participant API as AuthController
    participant Guard as RefreshTokenGuard
    participant Strategy as RefreshTokenStrategy
    participant TS as TokenService
    participant US as UserService

    Client->>API: GET /auth/refresh (with refresh_token cookie)
    API->>Guard: Activate RefreshTokenGuard
    Guard->>Strategy: validate(req, payload)
    Strategy->>Strategy: Extract token from cookie
    Strategy->>US: findOneById(payload.sub)
    Strategy->>Strategy: Check tokensValidFrom vs payload.iat
    alt Token revoked (iat < tokensValidFrom)
        Strategy-->>Guard: Throw UnauthorizedException
    else Token valid
        Strategy-->>Guard: {payload, refreshToken}
    end

    API->>TS: refreshUserTokens(userId, refreshToken)
    TS->>US: findOneById(userId)
    TS->>TS: Check user.status === ACTIVE
    TS->>TS: verifyRefreshToken(refreshToken, userId)
    Note over TS: Compare bcrypt hash against stored tokens
    alt Token not found in DB
        TS->>TS: removeAllRefreshTokensForUser(userId)
        TS->>TS: invalidateAllTokens(userId)
        TS-->>API: Throw UnauthorizedException
    else Token found and valid
        TS->>TS: generateTokens(userId, email)
        TS->>TS: setCurrentRefreshToken(newToken, oldToken)
        Note over TS: Grace period: old token expires in 20s
        TS-->>API: {accessToken, refreshToken}
    end
    API->>API: Set new refresh_token cookie
    API-->>Client: 200 {accessToken}
```

**Grace Period Implementation:**

- When rotating tokens, the old token is NOT immediately deleted
- Instead, its expiry is set to 20 seconds from now
- This prevents "infinite logout" loops from concurrent requests using the old token

### 6. Two-Factor Authentication (2FA) Flow

#### 6.1 Enabling 2FA

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as 2FAController
    participant TFS as TwoFactorAuthService
    participant ES as EncryptionService
    participant USS as UserSecurityService

    Client->>API: POST /2fa/generate (JWT required)
    API->>TFS: generateSecret(user)
    TFS->>TFS: authenticator.generateSecret()
    TFS->>TFS: authenticator.keyuri(email, appName, secret)
    TFS-->>API: {secret, otpAuthUrl}
    API->>ES: encrypt(secret)
    API->>API: Set cookie "2fa_secret" (httpOnly, 5min)
    API->>TFS: generateQrCodeDataURL(otpAuthUrl)
    API-->>Client: {qrCodeDataURL, otpAuthUrl}

    Note over Client: User scans QR code with authenticator app

    Client->>API: POST /2fa/turn-on {code}
    API->>API: Get encrypted secret from cookie
    API->>ES: decrypt(encryptedSecret)
    API->>TFS: isCodeValid(code, secret)
    alt Code invalid
        API-->>Client: 401 Unauthorized
    else Code valid
        API->>USS: turnOnTwoFactorAuthentication(userId, secret)
        USS->>USS: Encrypt and store secret
        USS->>USS: Generate recovery codes
        USS-->>API: {user, recoveryCodes}
        API-->>Client: 200 {message, recoveryCodes}
    end
```

#### 6.2 Logging in with 2FA

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Guard as 2FAPartialGuard
    participant Strategy as TwoFactorAuthStrategy
    participant API as 2FAController
    participant TFS as TwoFactorAuthService
    participant LS as LoginService

    Note over Client: After initial login returns 2FA_REQUIRED

    Client->>API: POST /2fa/authenticate {code}
    Note over API: Cookie "2fa_partial_token" sent automatically
    API->>Guard: Activate AuthGuard('2fa-partial')
    Guard->>Strategy: validate(req, payload)
    Strategy->>Strategy: Extract from cookie "2fa_partial_token"
    Strategy->>Strategy: Verify is2FA=true, !isTwoFactorAuthenticated
    Strategy-->>Guard: {payload, partialToken}

    API->>API: findOneById(payload.sub)
    API->>API: decrypt(user.twoFactorAuthenticationSecret)
    API->>TFS: isCodeValid(code, decryptedSecret)
    alt Code invalid
        API-->>Client: 401 Unauthorized
    else Code valid
        API->>LS: loginAfter2FA(user, ip, userAgent)
        LS-->>API: {accessToken, refreshToken, user}
        API->>API: Set refresh_token cookie
        API->>API: Clear 2fa_partial_token cookie
        API-->>Client: 200 {accessToken, user}
    end
```

### 7. OAuth (Google) Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as AuthController
    participant Guard as GoogleAuthGuard
    participant Strategy as GoogleStrategy
    participant OS as OAuthService
    participant TS as TokenService

    Client->>API: GET /auth/google
    API->>Guard: Activate AuthGuard('google')
    Guard->>Client: Redirect to Google OAuth consent

    Note over Client,Guard: User authenticates with Google

    Client->>API: GET /auth/google/callback (with code)
    API->>Guard: Activate AuthGuard('google')
    Guard->>Strategy: validate(accessToken, refreshToken, profile)
    Strategy->>OS: validateOAuthUser(googleProfile)
    OS->>OS: Check UserIdentity by provider+providerId
    alt Identity exists
        OS-->>Strategy: Existing user
    else Identity not found
        OS->>OS: Check User by email
        alt User exists by email
            OS->>OS: Link identity to existing user
        else New user
            OS->>OS: Create new User (isEmailVerified: true)
            OS->>OS: Create UserIdentity
        end
        OS-->>Strategy: User
    end
    Strategy-->>Guard: User

    alt User has 2FA enabled
        API->>TS: generate2FAPartialToken(userId)
        API->>API: Set 2fa_partial_token cookie
        API-->>Client: Redirect to FRONTEND_2FA_URL
    else 2FA not enabled
        API->>OS: generateOneTimeCode(userId)
        OS->>OS: Store in cache (5min TTL)
        API-->>Client: Redirect to FRONTEND_AUTH_CALLBACK_URL?code={code}
    end

    Note over Client: Frontend AuthCallbackPage

    Client->>API: POST /auth/exchange-code {code}
    API->>OS: validateOneTimeCode(code)
    OS->>OS: Get userId from cache, delete code
    API->>API: login(user, ip, userAgent)
    API-->>Client: 200 {accessToken, user}
```

**Key Details:**

- Google profile mapped to: `provider="google"`, `providerId`, `email`, `name`, `avatarUrl`
- OAuth users created with `isEmailVerified: true` (trusted from Google)
- One-time code prevents token exposure in URL (PKCE-like flow)
- OAuth users can set a password later via `POST /auth/set-password`

### 8. Protected Route Authentication (JwtAuthGuard)

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant Guard as JwtAuthGuard
    participant Strategy as JwtStrategy
    participant US as UserService
    participant Controller as ProtectedController

    Client->>Guard: Request with Authorization: Bearer {token}
    Guard->>Guard: Check @Public decorator
    alt Route is public
        Guard-->>Controller: Allow access
    else Route protected
        Guard->>Strategy: validate(payload)
        Strategy->>Strategy: Extract token from Authorization header
        Strategy->>Strategy: Verify signature with JWT_SECRET
        Strategy->>US: findOneById(payload.sub)
        alt User not found
            Strategy-->>Guard: Throw UnauthorizedException
        else Token revoked (iat < tokensValidFrom)
            Strategy-->>Guard: Throw UnauthorizedException
        else Valid
            Strategy-->>Guard: {id, email, role}
            Guard->>Controller: request.user = {id, email, role}
        end
    end
```

### 9. WebSocket Authentication Flow

```mermaid
sequenceDiagram
    participant Client as Frontend Socket.IO
    participant Gateway as EventsGateway
    participant Guard as WsJwtAuthGuard
    participant WAS as WsAuthService
    participant US as UserService

    Client->>Gateway: Connect with auth.token
    Gateway->>Guard: handleConnection
    alt Has auth token (Agent)
        Guard->>Guard: jwtService.verifyAsync(token)
        Guard->>US: findOneById(payload.sub)
        alt User not found
            Guard-->>Client: WsException "User not found"
        else Valid
            Guard->>Gateway: client.data.user = {id, email}
            Guard-->>Client: Connection established
        end
    else No auth token (Widget)
        Guard->>WAS: validateConnection(client)
        WAS->>WAS: Check projectId in query
        WAS->>WAS: Validate origin against project whitelist
        alt Origin not whitelisted
            WAS-->>Gateway: {valid: false}
            Gateway-->>Client: Disconnect
        else Valid
            WAS-->>Gateway: {valid: true}
            Gateway-->>Client: Connection established
        end
    end
```

**Key Details:**

- Agents authenticate with JWT in `handshake.auth.token`
- Widgets authenticate via origin whitelist + projectId
- Token revocation checked via `tokensValidFrom` timestamp

### 10. Role-Based Authorization (RolesGuard)

```mermaid
flowchart TD
    A[Request with user attached] --> B{Has @Roles decorator?}
    B -->|No| C[Allow Access]
    B -->|Yes| D{Is GlobalRole required?}
    D -->|Yes| E[Check user.role]
    E --> F{Role matches with hierarchy?}
    F -->|Yes| C
    F -->|No| G[Deny Access]
    D -->|No| H[Get projectId from params]
    H --> I{Valid projectId?}
    I -->|No| G
    I -->|Yes| J[Lookup ProjectMember]
    J --> K{Is member of project?}
    K -->|No| G
    K -->|Yes| L{Role matches with hierarchy?}
    L -->|Yes| C
    L -->|No| G
```

**Role Hierarchies:**

- **Global**: `ADMIN` inherits `USER` permissions
- **Project**: `MANAGER` inherits `AGENT` permissions

---

## Data Flow

```mermaid
flowchart LR
    subgraph Frontend
        A[LoginPage] --> B[authApi.ts]
        B --> C[api.ts interceptor]
        C --> D[authStore.ts]
    end

    subgraph Backend
        E[AuthController] --> F[LoginService]
        F --> G[TokenService]
        G --> H[RefreshToken Entity]
        F --> I[PasswordService]
        I --> J[User Entity]
    end

    C <-->|HTTP + Cookies| E
    D -->|Store tokens| K[(localStorage)]
    H -->|Stored hashed| L[(PostgreSQL)]
```

---

## Interfaces & Abstractions

### Input Types

```typescript
// Login DTO
interface LoginDto {
  email: string;
  password: string;
}

// Register DTO
interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  invitationToken?: string;
}
```

### Output Types

```typescript
// Auth Response
interface AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
}

// User Response (safe, no passwordHash)
interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: GlobalRole;
  hasPassword: boolean;
  isTwoFactorAuthenticationEnabled: boolean;
  // ... other fields
}
```

### Key Abstractions

| Abstraction                       | Location                                                                                                  | Purpose                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `LocalStrategy`                   | [local.strategy.ts](../../packages/backend/src/auth/strategies/local.strategy.ts)                         | Email/password validation                |
| `JwtStrategy`                     | [jwt.strategy.ts](../../packages/backend/src/auth/strategies/jwt.strategy.ts)                             | Access token validation                  |
| `RefreshTokenStrategy`            | [refresh-token.strategy.ts](../../packages/backend/src/auth/strategies/refresh-token.strategy.ts)         | Refresh token validation                 |
| `TwoFactorAuthenticationStrategy` | [2fa-partial-token.strategy.ts](../../packages/backend/src/auth/strategies/2fa-partial-token.strategy.ts) | 2FA partial token validation             |
| `GoogleStrategy`                  | [google.strategy.ts](../../packages/backend/src/auth/strategies/google.strategy.ts)                       | Google OAuth validation                  |
| `TokenService`                    | [token.service.ts](../../packages/backend/src/auth/services/token.service.ts)                             | Token generation, verification, rotation |
| `RolesGuard`                      | [roles.guard.ts](../../packages/backend/src/rbac/roles.guard.ts)                                          | Role-based authorization                 |

---

## Dependencies

### Internal Dependencies

| Dependency                              | Type           | What It Does                                                           |
| --------------------------------------- | -------------- | ---------------------------------------------------------------------- |
| `TokenService.generateTokens()`         | Core           | Creates signed JWT access and refresh tokens using configured secrets  |
| `TokenService.setCurrentRefreshToken()` | Core           | Hashes and stores refresh token in DB with session limit enforcement   |
| `TokenService.verifyRefreshToken()`     | Core           | Compares raw token against all stored hashes for user, deletes expired |
| `PasswordService.validateUser()`        | Core           | Finds user by email, compares password hash, checks account status     |
| `OAuthService.validateOAuthUser()`      | Core           | Links or creates user from OAuth profile, creates UserIdentity record  |
| `EncryptionService.encrypt/decrypt()`   | Infrastructure | AES encryption for 2FA secrets (at rest)                               |
| `CacheManager.set/get/del()`            | Infrastructure | Redis/memory cache for verification tokens, one-time codes             |
| `UserService.findOneById/ByEmail()`     | Core           | Database lookup for User entity                                        |

### External Dependencies

| Dependency                       | Type        | Standard Behavior                        |
| -------------------------------- | ----------- | ---------------------------------------- |
| `@nestjs/passport`               | Third-Party | Passport.js integration for NestJS       |
| `passport-local`                 | Third-Party | Local (username/password) authentication |
| `passport-jwt`                   | Third-Party | JWT authentication strategy              |
| `passport-google-oauth20`        | Third-Party | Google OAuth 2.0 strategy                |
| `bcrypt`                         | Third-Party | Password hashing and comparison          |
| `otplib`                         | Third-Party | TOTP generation and verification for 2FA |
| `jsonwebtoken` (via @nestjs/jwt) | Third-Party | JWT signing and verification             |
| `qrcode`                         | Third-Party | QR code generation for 2FA setup         |

---

## Error Handling

| Error                   | When It Occurs                                 | How It's Handled                          |
| ----------------------- | ---------------------------------------------- | ----------------------------------------- |
| `UnauthorizedException` | Invalid credentials, invalid/expired tokens    | 401 response, frontend redirects to login |
| `ForbiddenException`    | Email not verified, account suspended          | 403 response with specific error message  |
| `ConflictException`     | Email already registered, OAuth already linked | 409 response                              |
| `NotFoundException`     | Verification token expired                     | 404 response                              |
| `BadRequestException`   | Invalid reset token, missing required fields   | 400 response                              |
| `WsException`           | Invalid WebSocket token                        | Socket disconnection with error event     |

---

## Side Effects

- **Database:**

  - User creation/update on registration and OAuth
  - RefreshToken creation/deletion on login/logout/rotation
  - UserIdentity creation on OAuth linking
  - TwoFactorRecoveryCode creation/consumption
  - `tokensValidFrom` update on "logout all" or password change

- **Cache (Redis/Memory):**

  - Verification tokens (15min TTL)
  - Password reset tokens (15min TTL)
  - One-time OAuth codes (5min TTL)
  - Project membership cache (60s TTL)

- **Cookies:**

  - `refresh_token` (HttpOnly, Secure in prod, SameSite: strict/none)
  - `2fa_partial_token` (HttpOnly, 5min expiry)
  - `2fa_secret` (HttpOnly, 5min expiry, during setup only)

- **Email:**
  - Verification email on registration
  - Password reset email on forgot password

---

## Data Lineage (Origin → Destination)

| Data Artifact      | Origin                                 | Components in Path                                         | Final Destination                      |
| ------------------ | -------------------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| User credentials   | Frontend LoginPage form                | authApi → LocalAuthGuard → LocalStrategy → PasswordService | Validated against User.passwordHash    |
| Access Token       | TokenService.generateTokens()          | LoginService → AuthController → Response body              | Frontend localStorage (via authStore)  |
| Refresh Token      | TokenService.generateTokens()          | LoginService → TokenService.setCurrentRefreshToken() → DB  | HttpOnly cookie + refresh_tokens table |
| 2FA Partial Token  | TokenService.generate2FAPartialToken() | LoginService → AuthController → HttpOnly cookie            | 2fa_partial_token cookie               |
| Google Profile     | Google OAuth callback                  | GoogleStrategy → OAuthService.validateOAuthUser()          | User + UserIdentity entities           |
| Verification Token | RegistrationService.register()         | CacheManager → Email link → verifyEmail()                  | Deleted after verification             |

### Event Flow (Emitter → Handler)

| Event Name             | Emitted By            | Consumed By                    | Purpose                 |
| ---------------------- | --------------------- | ------------------------------ | ----------------------- |
| Token rotation trigger | API interceptor (401) | Frontend api.ts                | Automatic token refresh |
| Logout                 | User action           | authStore → API → TokenService | Session termination     |

### Orphan Audit

- **None found** - All data flows have clear producers and consumers

---

## Configuration

| Config Key                       | Purpose                                               |
| -------------------------------- | ----------------------------------------------------- |
| `JWT_SECRET`                     | Secret for signing access tokens                      |
| `JWT_EXPIRES_IN`                 | Access token lifetime (e.g., "15m")                   |
| `JWT_REFRESH_SECRET`             | Secret for signing refresh tokens                     |
| `JWT_REFRESH_EXPIRES_IN`         | Refresh token lifetime (e.g., "30d")                  |
| `TWO_FACTOR_AUTH_JWT_SECRET`     | Secret for signing 2FA partial tokens                 |
| `TWO_FACTOR_AUTH_JWT_EXPIRES_IN` | 2FA partial token lifetime                            |
| `TWO_FACTOR_APP_NAME`            | App name shown in authenticator (default: "LiveChat") |
| `SESSION_LIMIT`                  | Max concurrent sessions per user (default: 5)         |
| `GOOGLE_CLIENT_ID`               | Google OAuth client ID                                |
| `GOOGLE_CLIENT_SECRET`           | Google OAuth client secret                            |
| `FRONTEND_URL`                   | Frontend base URL for redirects                       |
| `FRONTEND_AUTH_CALLBACK_URL`     | OAuth callback page URL                               |
| `FRONTEND_2FA_URL`               | 2FA verification page URL                             |
| `API_BASE_URL`                   | Backend base URL for OAuth callbacks                  |

---

## Integration Points

### To Authenticate an API Request

The frontend automatically attaches the access token:

```typescript
// Frontend api.ts interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### To Protect a Backend Endpoint

```typescript
// Apply guards and role requirements
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.MANAGER)  // or GlobalRole.ADMIN
@Get(':projectId/settings')
async getSettings(@Req() req) {
  const user = req.user; // { id, email, role }
  // ...
}
```

### To Authenticate a WebSocket Connection

```typescript
// Frontend Socket.IO connection
const socket = io(API_URL, {
  auth: {
    token: accessToken, // JWT from authStore
  },
});
```

---

## Files Investigated

| File                                                                                                                   | Lines Read | Key Findings                                    |
| ---------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- |
| [auth.controller.ts](../../packages/backend/src/auth/auth.controller.ts)                                               | 1-535      | All auth HTTP endpoints, cookie handling        |
| [login.service.ts](../../packages/backend/src/auth/services/login.service.ts)                                          | 1-109      | Login orchestration, 2FA branching              |
| [token.service.ts](../../packages/backend/src/auth/services/token.service.ts)                                          | 1-263      | Token generation, rotation, session limits      |
| [password.service.ts](../../packages/backend/src/auth/services/password.service.ts)                                    | 1-180      | Credential validation, password reset           |
| [registration.service.ts](../../packages/backend/src/auth/services/registration.service.ts)                            | 1-123      | User registration, email verification           |
| [oauth.service.ts](../../packages/backend/src/auth/services/oauth.service.ts)                                          | 1-212      | OAuth user creation/linking, one-time codes     |
| [local.strategy.ts](../../packages/backend/src/auth/strategies/local.strategy.ts)                                      | 1-49       | Email/password validation strategy              |
| [jwt.strategy.ts](../../packages/backend/src/auth/strategies/jwt.strategy.ts)                                          | 1-65       | Access token validation, revocation check       |
| [refresh-token.strategy.ts](../../packages/backend/src/auth/strategies/refresh-token.strategy.ts)                      | 1-103      | Refresh token extraction and validation         |
| [2fa-partial-token.strategy.ts](../../packages/backend/src/auth/strategies/2fa-partial-token.strategy.ts)              | 1-81       | 2FA partial token validation                    |
| [google.strategy.ts](../../packages/backend/src/auth/strategies/google.strategy.ts)                                    | 1-58       | Google OAuth profile handling                   |
| [jwt-auth.guard.ts](../../packages/backend/src/auth/guards/jwt-auth.guard.ts)                                          | 1-47       | JWT guard with @Public decorator support        |
| [local-auth.guard.ts](../../packages/backend/src/auth/guards/local-auth.guard.ts)                                      | 1-12       | Local (password) auth guard                     |
| [refresh-token.guard.ts](../../packages/backend/src/auth/guards/refresh-token.guard.ts)                                | 1-25       | Refresh token auth guard                        |
| [ws-jwt-auth.guard.ts](../../packages/backend/src/gateway/guards/ws-jwt-auth.guard.ts)                                 | 1-58       | WebSocket auth guard (agent/widget split)       |
| [ws-auth.service.ts](../../packages/backend/src/gateway/services/ws-auth.service.ts)                                   | 1-135      | WebSocket connection validation logic           |
| [two-factor-authentication.controller.ts](../../packages/backend/src/auth/2fa/two-factor-authentication.controller.ts) | 1-336      | 2FA enable/disable/authenticate endpoints       |
| [two-factor-authentication.service.ts](../../packages/backend/src/auth/2fa/two-factor-authentication.service.ts)       | 1-61       | TOTP secret generation and validation           |
| [roles.guard.ts](../../packages/backend/src/rbac/roles.guard.ts)                                                       | 1-165      | Role-based authorization with hierarchy         |
| [user.entity.ts](../../packages/backend/src/database/entities/user.entity.ts)                                          | 1-90       | User schema with auth-related fields            |
| [user-identity.entity.ts](../../packages/backend/src/database/entities/user-identity.entity.ts)                        | 1-30       | OAuth identity linking                          |
| [refresh-token.entity.ts](../../packages/backend/src/database/entities/refresh-token.entity.ts)                        | 1-41       | Refresh token storage schema                    |
| [project-member.entity.ts](../../packages/backend/src/database/entities/project-member.entity.ts)                      | 1-56       | Project role assignment                         |
| [global-roles.enum.ts](../../packages/shared-types/src/global-roles.enum.ts)                                           | 1-9        | ADMIN, USER roles                               |
| [project-roles.enum.ts](../../packages/shared-types/src/project-roles.enum.ts)                                         | 1-9        | MANAGER, AGENT roles                            |
| [authApi.ts](../../packages/frontend/src/services/authApi.ts)                                                          | 1-188      | Frontend auth API calls                         |
| [authStore.ts](../../packages/frontend/src/stores/authStore.ts)                                                        | 1-102      | Frontend auth state management                  |
| [api.ts](../../packages/frontend/src/lib/api.ts)                                                                       | 1-233      | Axios interceptors for token attachment/refresh |
| [AuthCallbackPage.tsx](../../packages/frontend/src/pages/auth/AuthCallbackPage.tsx)                                    | 1-74       | OAuth code exchange handler                     |
