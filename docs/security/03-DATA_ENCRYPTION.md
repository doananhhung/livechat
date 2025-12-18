# Mã hóa Dữ liệu (Data Encryption)

## Tổng quan

Hệ thống triển khai mã hóa dữ liệu ở nhiều cấp độ để bảo vệ thông tin nhạy cảm, bao gồm:

- **At-rest encryption:** Mã hóa dữ liệu lưu trữ (passwords, tokens, secrets)
- **In-transit encryption:** HTTPS/TLS cho API, WSS cho WebSocket
- **Application-level encryption:** AES-256-GCM cho sensitive data

## 1. Password Hashing

### 1.1. Bcrypt Algorithm

**File:** `packages/backend/src/auth/auth.service.ts`

```typescript
import * as bcrypt from "bcrypt";

// Hashing
const passwordHash = await bcrypt.hash(password, 12);

// Verification
const isValid = await bcrypt.compare(plainPassword, passwordHash);
```

**Thông số:**

- **Algorithm:** bcrypt
- **Salt rounds:** 12 (2^12 iterations)
- **Output:** 60-character hash string

**Tại sao chọn bcrypt:**

1. **Slow by design:** Chống brute-force attacks
2. **Adaptive:** Có thể tăng cost factor khi hardware mạnh hơn
3. **Auto-salting:** Salt được generate và lưu trong hash
4. **Industry standard:** Được tin dùng rộng rãi

**Ví dụ bcrypt hash:**

```
$2b$12$KIR7vZ4LGr5DxZQHWpJGF.1234567890abcdefghijklmnopqrstuvwxyz
│  │  │  └─────────────────── Hash (31 chars)
│  │  └─────────────────────── Salt (22 chars)
│  └────────────────────────── Cost factor (12)
└───────────────────────────── Algorithm identifier ($2b$ = bcrypt)
```

### 1.2. Password Storage

**Database schema:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(60),  -- Bcrypt hash
  ...
);
```

**Bảo mật:**

- ✅ Không bao giờ lưu plaintext password
- ✅ Hash trước khi lưu vào DB
- ✅ Không expose password_hash ra ngoài API
- ✅ Validate password strength trước khi hash

**Loại bỏ password_hash khỏi responses:**

```typescript
async getProfile(@Request() req) {
  const user = await this.userService.findOneById(req.user.id);
  const { passwordHash, ...result } = user;
  return result; // Safe to return
}
```

### 1.3. Password Change Security

```typescript
async changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await this.findOneById(userId);

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ForbiddenException('Current password is incorrect');
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 12);

  // Update
  user.passwordHash = newHash;
  user.tokensValidFrom = new Date(); // Revoke old tokens

  await this.userRepository.save(user);
}
```

## 2. Token Hashing

### 2.1. Refresh Token Storage

**File:** `packages/backend/src/user/user.service.ts`

```typescript
async setCurrentRefreshToken(options: SetRefreshTokenOptions) {
  const { refreshToken, userId, expiresAt } = options;

  // Hash refresh token before storing
  const tokenHash = await bcrypt.hash(refreshToken, 10);

  const newToken = this.refreshTokenRepository.create({
    userId,
    tokenHash,  // Store hash, not plaintext
    expiresAt,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  });

  await this.refreshTokenRepository.save(newToken);
}
```

**Tại sao hash refresh tokens:**

1. Nếu DB bị breach, attacker không thể dùng tokens
2. Chỉ người có plaintext token mới verify được
3. Follow principle: "don't store secrets in plaintext"

**Verification:**

```typescript
async validateRefreshToken(userId: string, refreshToken: string) {
  const tokens = await this.refreshTokenRepository.find({
    where: { userId, expiresAt: MoreThan(new Date()) }
  });

  for (const token of tokens) {
    const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
    if (isValid) {
      return token;
    }
  }

  throw new UnauthorizedException('Invalid refresh token');
}
```

### 2.2. 2FA Recovery Codes

**File:** `packages/backend/src/auth/2fa/two-factor-authentication.service.ts`

```typescript
async generateRecoveryCodes(userId: string): Promise<string[]> {
  const recoveryCodes: string[] = [];
  const entities = [];

  // Generate 10 random codes
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex'); // 8-char hex
    recoveryCodes.push(code);

    const hashedCode = await bcrypt.hash(code, 10);
    entities.push({
      userId,
      code: hashedCode,  // Store hashed
      used: false,
    });
  }

  await this.recoveryCodeRepository.save(entities);

  return recoveryCodes; // Return plaintext once for user to save
}
```

**Sử dụng recovery code:**

```typescript
async validateRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codes = await this.recoveryCodeRepository.find({
    where: { userId, used: false }
  });

  for (const rc of codes) {
    const isValid = await bcrypt.compare(code, rc.code);
    if (isValid) {
      rc.used = true;
      await this.recoveryCodeRepository.save(rc);
      return true;
    }
  }

  return false;
}
```

## 3. AES-256-GCM Encryption

### 3.1. EncryptionService

**File:** `packages/backend/src/common/services/encryption.service.ts`

```typescript
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = "aes-256-gcm";
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>("ENCRYPTION_KEY");
    if (!secretKey || secretKey.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be 32 characters");
    }
    this.key = Buffer.from(secretKey, "utf-8");
  }

  encrypt(text: string): string {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    // Get authentication tag (for GCM mode)
    const authTag = cipher.getAuthTag();

    // Combine IV:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString(
      "hex"
    )}:${encrypted.toString("hex")}`;
  }

  decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const encrypted = Buffer.from(encryptedHex, "hex");

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Could not decrypt token.");
    }
  }
}
```

**Tính năng AES-256-GCM:**

1. **AES-256:**

   - Symmetric encryption
   - 256-bit key length
   - Industry standard, NIST approved

2. **GCM (Galois/Counter Mode):**

   - Authenticated encryption
   - Provides both confidentiality and integrity
   - Detects tampering via authentication tag

3. **Random IV:**

   - Mỗi lần encrypt dùng IV khác nhau
   - Cùng plaintext → khác ciphertext
   - Chống pattern analysis

4. **Authentication Tag:**
   - Verify data integrity
   - Detect tampering
   - 128-bit tag

**Output format:**

```
IV (32 hex chars) : AuthTag (32 hex chars) : Encrypted data (variable)
```

### 3.2. Use Cases

#### 3.2.1. OAuth Tokens Encryption

**File:** `packages/backend/src/auth/strategies/google.strategy.ts`

```typescript
async validate(accessToken: string, refreshToken: string, profile: any) {
  // Encrypt tokens before storing
  const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
  const encryptedRefreshToken = refreshToken
    ? this.encryptionService.encrypt(refreshToken)
    : null;

  // Find or create user identity
  let identity = await this.userIdentityRepository.findOne({
    where: {
      provider: 'google',
      providerId: profile.id,
    },
  });

  if (identity) {
    // Update encrypted tokens
    identity.accessToken = encryptedAccessToken;
    identity.refreshToken = encryptedRefreshToken;
    await this.userIdentityRepository.save(identity);
  } else {
    // Create new identity with encrypted tokens
    identity = this.userIdentityRepository.create({
      provider: 'google',
      providerId: profile.id,
      userId: user.id,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
    });
    await this.userIdentityRepository.save(identity);
  }
}
```

**Tại sao encrypt OAuth tokens:**

1. Google tokens có quyền truy cập tài khoản Google
2. Nếu DB bị leak, tokens không thể dùng được
3. Compliance với security best practices

**Decryption khi cần dùng:**

```typescript
async getGoogleAccessToken(userId: string): Promise<string> {
  const identity = await this.userIdentityRepository.findOne({
    where: { userId, provider: 'google' }
  });

  if (!identity || !identity.accessToken) {
    throw new Error('No Google account linked');
  }

  return this.encryptionService.decrypt(identity.accessToken);
}
```

#### 3.2.2. 2FA Secret Encryption

**File:** `packages/backend/src/auth/2fa/two-factor-authentication.controller.ts`

```typescript
@Post('generate')
@UseGuards(JwtAuthGuard)
async generate(@Request() req, @Res({ passthrough: true }) response: Response) {
  const user = await this.userService.findOneById(req.user.id);

  // Generate TOTP secret
  const { secret, otpauthUrl } = this.twoFactorAuthService.generateSecret(user);

  // Encrypt secret
  const encryptedSecret = this.encryptionService.encrypt(secret);

  // Store in temporary cookie (5 minutes)
  response.cookie('2fa_secret', encryptedSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 5 * 60 * 1000),
  });

  const qrCodeDataURL = await this.twoFactorAuthService.generateQrCodeDataURL(otpauthUrl);

  return { qrCodeDataURL };
}
```

**Turn on 2FA:**

```typescript
@Post('turn-on')
@UseGuards(JwtAuthGuard)
async turnOn(@Request() req, @Body() body: TurnOn2faDto, @Res() res) {
  const secret2faCookie = req.cookies['2fa_secret'];

  // Decrypt secret from cookie
  const decryptedSecret = this.encryptionService.decrypt(secret2faCookie);

  // Verify OTP code
  const isCodeValid = this.twoFactorAuthService.isCodeValid(
    body.code,
    decryptedSecret
  );

  if (!isCodeValid) {
    throw new UnauthorizedException('Wrong authentication code');
  }

  // Encrypt again before storing in DB
  const encryptedSecret = this.encryptionService.encrypt(decryptedSecret);

  await this.userService.turnOnTwoFactorAuthentication(
    req.user.id,
    encryptedSecret
  );

  // Clear temporary cookie
  res.clearCookie('2fa_secret');
}
```

**Authenticate with 2FA:**

```typescript
@Post('authenticate')
@UseGuards(TwoFactorAuthGuard)
async authenticate(@Req() req, @Body() body: TurnOn2faDto) {
  const user = await this.userService.findOneById(req.user.sub);

  // Decrypt 2FA secret from DB
  const decryptedSecret = this.encryptionService.decrypt(
    user.twoFactorAuthenticationSecret
  );

  // Verify OTP
  const isCodeValid = this.twoFactorAuthService.isCodeValid(
    body.code,
    decryptedSecret
  );

  if (!isCodeValid) {
    throw new UnauthorizedException('Wrong authentication code');
  }

  // Issue full tokens
  return this.authService.loginAndReturnTokens(user);
}
```

## 4. Email Verification & Reset Tokens

### 4.1. Token Generation

**File:** `packages/backend/src/auth/auth.service.ts`

```typescript
// Email verification token
const verificationToken = crypto.randomBytes(32).toString("hex");
// Output: 64 character hex string (256 bits entropy)

// Password reset token
const resetToken = crypto.randomBytes(32).toString("hex");

// Email change verification token
const emailChangeToken = crypto.randomBytes(32).toString("hex");
```

**Đặc điểm:**

- **Cryptographically random:** Sử dụng `crypto.randomBytes()`
- **256 bits entropy:** Không thể brute-force
- **Hex encoding:** Safe cho URLs
- **One-time use:** Xóa sau khi verify

### 4.2. Token Storage

**Redis với TTL:**

```typescript
// Verification token
const tokenKey = `verification-token:${verificationToken}`;
await this.cacheManager.set(tokenKey, userId, 900000); // 15 minutes

// Password reset token
const tokenKey = `reset-password-token:${resetToken}`;
await this.cacheManager.set(tokenKey, userId, 900000); // 15 minutes

// Email change token
const tokenKey = `email-change-token:${emailChangeToken}`;
await this.cacheManager.set(tokenKey, emailChangeRequestId, 900000); // 15 minutes
```

**Tại sao dùng Redis:**

1. **Auto expiration:** TTL tự động
2. **Fast lookup:** O(1) time complexity
3. **No DB pollution:** Không lưu vào main DB
4. **Easy cleanup:** Expired keys tự động xóa

### 4.3. Token Validation

```typescript
async verifyEmail(token: string): Promise<{ message: string }> {
  const tokenKey = `verification-token:${token}`;
  const userId = await this.cacheManager.get<string>(tokenKey);

  if (!userId) {
    throw new NotFoundException('Token not found or expired');
  }

  const user = await this.userService.findOneById(userId);
  user.isEmailVerified = true;
  await this.userRepository.save(user);

  // Delete token (one-time use)
  await this.cacheManager.del(tokenKey);

  return { message: 'Email verified successfully' };
}
```

## 5. HTTPS/TLS Encryption (In-Transit)

### 5.1. API Security

**Production setup (Nginx/CloudFlare):**

```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**NestJS CORS config:**

```typescript
// File: packages/backend/src/main.ts
app.enableCors({
  origin: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
});
```

### 5.2. WebSocket Security (WSS)

**File:** `packages/backend/src/gateway/redis-io.adapter.ts`

```typescript
createIOServer(port: number, options?: ServerOptions): any {
  const server: Server = super.createIOServer(port, {
    ...options,
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // In production, use WSS (WebSocket Secure)
  // Handled by reverse proxy (Nginx/CloudFlare)
}
```

**Client connection:**

```typescript
// Widget client
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  secure: true, // Use WSS in production
});
```

## 6. Cookie Security

### 6.1. HttpOnly Cookies

**Refresh token cookie:**

```typescript
response.cookie("refresh_token", refreshToken, {
  httpOnly: true, // Cannot access via JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

**2FA partial token:**

```typescript
response.cookie("2fa_partial_token", accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
});
```

**2FA secret (temporary):**

```typescript
response.cookie("2fa_secret", encryptedSecret, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
});
```

### 6.2. Cookie Attributes

| Attribute  | Value          | Purpose                        |
| ---------- | -------------- | ------------------------------ |
| `httpOnly` | `true`         | Chống XSS - không access từ JS |
| `secure`   | `true` (prod)  | Chỉ gửi qua HTTPS              |
| `sameSite` | `none`/`lax`   | Chống CSRF attacks             |
| `expires`  | Date           | Auto cleanup                   |
| `domain`   | `.example.com` | Subdomain sharing (nếu cần)    |
| `path`     | `/`            | Available cho toàn site        |

## 7. Environment Variables Protection

### 7.1. Sensitive Variables

**File:** `.env` (not in Git)

```bash
# Database
PSQL_PASSWORD=***************

# JWT Secrets
JWT_SECRET=***********************************
JWT_REFRESH_SECRET=***************************
TWO_FACTOR_AUTH_JWT_SECRET=*******************

# Encryption
ENCRYPTION_KEY=********************************  # Must be 32 chars

# OAuth
GOOGLE_CLIENT_SECRET=*************************

# Email (SendGrid/SMTP)
SENDGRID_API_KEY=*****************************
SMTP_PASSWORD=********************************

# AWS (if using S3)
AWS_SECRET_ACCESS_KEY=************************

# Redis
REDIS_PASSWORD=*******************************
```

### 7.2. Key Requirements

**ENCRYPTION_KEY:**

```typescript
// Must be exactly 32 characters for AES-256
constructor(private readonly configService: ConfigService) {
  const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
  if (!secretKey || secretKey.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 characters');
  }
  this.key = Buffer.from(secretKey, 'utf-8');
}
```

**Generation example:**

```bash
# Generate random 32-char key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Output: 5f8e3d2c1a9b7f6e4d3c2b1a9876543210
```

### 7.3. Secret Rotation

**Best practices:**

1. Rotate JWT secrets every 90 days
2. Rotate encryption keys yearly
3. Rotate OAuth secrets when leaked
4. Use secret management service (AWS Secrets Manager, HashiCorp Vault)

**Graceful rotation strategy:**

```typescript
// Support multiple secrets during rotation period
const jwtSecrets = [
  configService.get("JWT_SECRET"), // New
  configService.get("JWT_SECRET_OLD"), // Old (still valid)
];

// Verify with multiple secrets
for (const secret of jwtSecrets) {
  try {
    const payload = await jwtService.verifyAsync(token, { secret });
    return payload;
  } catch (e) {
    continue;
  }
}
throw new UnauthorizedException();
```

## 8. Database Encryption (Planned)

### 8.1. Transparent Data Encryption (TDE)

**PostgreSQL pgcrypto:**

```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive columns
CREATE TABLE user_secrets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  encrypted_data BYTEA,  -- Encrypted with pgcrypto
  ...
);

-- Insert encrypted data
INSERT INTO user_secrets (encrypted_data)
VALUES (pgp_sym_encrypt('sensitive data', 'encryption_key'));

-- Query decrypted data
SELECT pgp_sym_decrypt(encrypted_data, 'encryption_key') FROM user_secrets;
```

### 8.2. Field-Level Encryption

**Ví dụ: Encrypt user PII:**

```typescript
@Entity()
export class User {
  @Column()
  email: string; // Already indexed, keep plaintext

  @Column({ nullable: true })
  phoneNumber: string; // Consider encrypting

  @Column({ nullable: true })
  @Transformer({
    to: (value: string) => encryptionService.encrypt(value),
    from: (value: string) => encryptionService.decrypt(value),
  })
  socialSecurityNumber?: string; // Encrypt if collected
}
```

## 9. Key Management

### 9.1. Current Approach

**File-based secrets:**

- Stored in `.env` file
- Loaded via `ConfigService`
- Never committed to Git
- Deployed via CI/CD secrets

### 9.2. Production Recommendations

**Use secrets manager:**

```typescript
// AWS Secrets Manager example
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString;
}

// Use in ConfigService
@Injectable()
export class ConfigService {
  async getJwtSecret(): Promise<string> {
    if (process.env.NODE_ENV === "production") {
      return await getSecret("prod/jwt-secret");
    }
    return process.env.JWT_SECRET;
  }
}
```

**Benefits:**

1. Centralized secret management
2. Automatic rotation
3. Audit logging
4. Fine-grained access control
5. Encryption at rest

## 10. Security Best Practices

### 10.1. Defense in Depth

✅ **Multiple layers:**

1. HTTPS/TLS (in-transit)
2. Bcrypt (passwords)
3. AES-256-GCM (sensitive data)
4. HttpOnly cookies (tokens)
5. Database access control
6. Application-level validation

### 10.2. Key Management

✅ **Separation:**

- JWT secret ≠ Refresh token secret ≠ 2FA secret
- Encryption key ≠ Database password
- Each service has own credentials

✅ **Rotation:**

- Regular rotation schedule
- Grace period for old keys
- Revocation mechanism

### 10.3. Audit & Monitoring

**Log encryption events:**

```typescript
encrypt(text: string): string {
  this.logger.log(`Encrypting data (length: ${text.length})`);
  // ... encryption logic
}

decrypt(encryptedText: string): string {
  this.logger.log('Decrypting data');
  try {
    // ... decryption logic
  } catch (error) {
    this.logger.error('Decryption failed', error);
    throw new Error('Could not decrypt token');
  }
}
```

**Monitor failed decryptions:**

- Spike in failures → potential attack
- Track IP addresses
- Alert security team

## 11. Compliance Considerations

### 11.1. GDPR

✅ **Right to erasure:**

```typescript
async deleteUserData(userId: string) {
  // Delete all encrypted data
  await this.userRepository.delete(userId);
  await this.userIdentityRepository.delete({ userId });
  await this.refreshTokenRepository.delete({ userId });
  // Keys are useless without data
}
```

### 11.2. PCI DSS (if handling payments)

- **Encrypt cardholder data** (use payment gateway instead)
- **Don't store CVV**
- **Tokenize credit cards**

### 11.3. HIPAA (if handling health data)

- **Encrypt PHI at rest and in transit**
- **Audit all access**
- **Implement BAA with vendors**

## 12. Kết luận

Hệ thống encryption được thiết kế toàn diện:

✅ **Password hashing:** Bcrypt với salt rounds = 12
✅ **Token hashing:** Refresh tokens, recovery codes
✅ **AES-256-GCM:** OAuth tokens, 2FA secrets
✅ **Random tokens:** Email verification, password reset
✅ **HTTPS/WSS:** In-transit encryption
✅ **HttpOnly cookies:** XSS protection
✅ **Secret management:** Environment variables
✅ **Key separation:** Different keys for different purposes

**Cải thiện cần thiết:**

1. Enable TLS 1.3 only
2. Implement database encryption (TDE)
3. Use secrets manager (AWS/Vault)
4. Add key rotation automation
5. Encrypt database backups
6. Implement HSM for key storage
7. Add encryption monitoring/alerting
