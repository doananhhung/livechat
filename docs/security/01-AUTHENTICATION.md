# Cơ chế Xác thực (Authentication)

## Tổng quan

Hệ thống sử dụng kiến trúc xác thực đa lớp với JWT (JSON Web Tokens), OAuth 2.0 (Google), và xác thực hai yếu tố (2FA), đảm bảo tính bảo mật cao cho việc xác minh danh tính người dùng.

## 1. Xác thực Email/Password

### 1.1. Quy trình Đăng ký

**File:** `packages/backend/src/auth/auth.service.ts`

```typescript
async register(registerDto: RegisterDto): Promise<{ message: string }>
```

**Các bước bảo mật:**

1. **Kiểm tra email trùng lặp:** Ngăn chặn việc tạo nhiều tài khoản với cùng email
2. **Hash mật khẩu:** Sử dụng `bcrypt` với salt rounds = 12

   ```typescript
   const passwordHash = await bcrypt.hash(registerDto.password, 12);
   ```

   **Cách bcrypt hoạt động:**

   Bcrypt là một hàm băm mật khẩu được thiết kế đặc biệt để chống lại các cuộc tấn công brute-force thông qua cơ chế "adaptive hashing":

   - **Salt tự động:** Bcrypt tự động tạo một chuỗi ngẫu nhiên (salt) duy nhất cho mỗi mật khẩu. Salt được lưu trữ cùng với hash, giúp ngăn chặn rainbow table attacks.

     **Salt là gì?**

     Salt là một chuỗi ngẫu nhiên được thêm vào mật khẩu trước khi băm. Ví dụ:

     - Mật khẩu gốc: `mypassword123`
     - Salt ngẫu nhiên: `a8f5j9d2k1p7`
     - Chuỗi được băm: `mypassword123a8f5j9d2k1p7`

     **Tại sao cần Salt?**

     Nếu không có salt, hai người dùng có cùng mật khẩu sẽ tạo ra cùng một hash:

     ```
     User A: password123 → hash: 482c811da5d5b4bc6d497ffa98491e38
     User B: password123 → hash: 482c811da5d5b4bc6d497ffa98491e38 (giống nhau!)
     ```

     Với salt, mỗi mật khẩu có hash khác nhau:

     ```
     User A: password123 + salt_xyz → hash: a1b2c3d4e5...
     User B: password123 + salt_abc → hash: f6g7h8i9j0... (khác nhau!)
     ```

     **Rainbow Table Attacks là gì?**

     Rainbow table là một bảng tra cứu khổng lồ chứa sẵn hàng triệu mật khẩu phổ biến đã được băm trước:

     ```
     password123     → 482c811da5d5b4bc6d497ffa98491e38
     admin           → 21232f297a57a5a743894a0e4a801fc3
     qwerty          → d8578edf8458ce06fbc5bb76a58c5ca4
     ...hàng triệu entries khác
     ```

     Kẻ tấn công có thể:

     1. Lấy hash từ database bị leak
     2. Tra cứu hash trong rainbow table
     3. Tìm được mật khẩu gốc ngay lập tức

     **Salt ngăn chặn Rainbow Table như thế nào?**

     Với salt, kẻ tấn công phải tạo rainbow table riêng cho MỖI salt khác nhau. Vì mỗi user có salt khác nhau, điều này trở nên không khả thi:

     - User A: salt = `xyz123` → cần rainbow table cho salt này
     - User B: salt = `abc789` → cần rainbow table khác
     - User C: salt = `def456` → lại cần rainbow table khác

     Với hàng triệu users, kẻ tấn công phải tạo hàng triệu rainbow tables khác nhau, điều này không thực tế về mặt thời gian và không gian lưu trữ.

   - **Salt rounds (cost factor):** Tham số `12` là số vòng lặp (2^12 = 4096 iterations). Mỗi vòng lặp là một lần thực hiện các phép toán mã hóa phức tạp trong bcrypt, bao gồm việc xử lý mật khẩu và salt thông qua thuật toán Blowfish, đầu ra của vòng này được đưa vào làm đầu vào của vòng kế tiếp. Mỗi vòng lặp làm tăng gấp đôi thời gian tính toán, khiến việc brute-force trở nên cực kỳ tốn kém.

   - **Kết quả:** Hash bcrypt có dạng `$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` trong đó:

     - `$2b$`: Phiên bản thuật toán bcrypt
     - `12`: Cost factor
     - 22 ký tự tiếp theo: Salt (base64 encoded)
     - 31 ký tự cuối: Hash thực tế của mật khẩu

   - **So sánh mật khẩu:** Khi đăng nhập, `bcrypt.compare()` tách salt từ hash đã lưu, băm mật khẩu đầu vào với cùng salt đó, và so sánh kết quả. Quá trình này an toàn với timing attacks.

   - **Adaptive:** Cost factor có thể tăng theo thời gian khi phần cứng mạnh hơn, đảm bảo bảo mật dài hạn mà không cần thay đổi thuật toán.

3. **Token xác thực email:**

   - Tạo token ngẫu nhiên 32 bytes (256 bits)
   - Lưu vào Redis với TTL 15 phút
   - Gửi qua email an toàn

   ```typescript
   const verificationToken = crypto.randomBytes(32).toString("hex");
   const tokenKey = `verification-token:${verificationToken}`;
   await this.cacheManager.set(tokenKey, newUser.id, 900000); // 15 minutes
   ```

4. **Trạng thái email chưa xác thực:**
   ```typescript
   isEmailVerified: false; // Ngăn đăng nhập cho đến khi xác thực
   ```

**Validation:**

- Email phải hợp lệ (class-validator)
- Mật khẩu tối thiểu 8 ký tự
- Full name không để trống

### 1.2. Quy trình Đăng nhập

**File:** `packages/backend/src/auth/auth.controller.ts`

**Guard:** `LocalAuthGuard` → kích hoạt `LocalStrategy`

**File:** `packages/backend/src/auth/strategies/local.strategy.ts`

```typescript
async validate(email: string, password: string): Promise<User>
```

**Các tầng bảo mật:**

1. **Xác thực thông tin đăng nhập:**

   ```typescript
   const user = await this.authService.validateUser(email, password);
   ```

   - So sánh password hash với `bcrypt.compare()`
   - Không lộ thông tin chi tiết về lỗi (email hay password sai)

2. **Kiểm tra trạng thái email:**

   ```typescript
   if (!user.isEmailVerified) {
     throw new ForbiddenException("Vui lòng xác thực email...");
   }
   ```

3. **Kiểm tra trạng thái tài khoản:**

   ```typescript
   if (user.status === UserStatus.SUSPENDED) {
     throw new ForbiddenException("Tài khoản bị tạm ngưng");
   }
   ```

4. **Xử lý 2FA (nếu được bật):**

   - Không cấp token đầy đủ ngay lập tức
   - Tạo `2fa_partial_token` với TTL 5 phút
   - Lưu trong HttpOnly cookie

   ```typescript
   response.cookie("2fa_partial_token", accessToken, {
     httpOnly: true,
     secure: NODE_ENV === "production",
     sameSite: NODE_ENV === "production" ? "none" : "lax",
     expires: new Date(Date.now() + 5 * 60 * 1000),
   });
   ```

5. **Cấp phát tokens (không có 2FA):**
   ```typescript
   const { accessToken, refreshToken } =
     await this.authService.loginAndReturnTokens(user);
   ```

### 1.3. Quy trình Quên mật khẩu

**File:** `packages/backend/src/auth/auth.service.ts`

```typescript
async forgotPassword(email: string)
async resetPassword(token: string, newPassword: string)
```

**Bảo mật:**

1. **Token reset ngẫu nhiên:**

   ```typescript
   const resetToken = crypto.randomBytes(32).toString("hex");
   const tokenKey = `reset-password-token:${resetToken}`;
   await this.cacheManager.set(tokenKey, user.id, 900000); // 15 minutes TTL
   ```

2. **Gửi qua email:**

   - Link chứa token một lần (one-time use)
   - Email được gửi qua service an toàn

3. **Reset mật khẩu:**
   - Xác thực token từ Redis
   - Hash mật khẩu mới với bcrypt
   - Xóa token ngay sau khi sử dụng (one-time use)
   - Thu hồi tất cả tokens cũ:
   ```typescript
   user.tokensValidFrom = new Date(); // Invalidate all old tokens
   ```

## 2. JWT (JSON Web Tokens)

### 2.1. Cấu trúc Token

**Access Token:**

```typescript
{
  sub: userId,           // Subject (User ID)
  email: user.email,
  iat: timestamp,        // Issued at
  exp: timestamp         // Expiration (15 phút)
}
```

**Refresh Token:**

```typescript
{
  sub: userId,
  iat: timestamp,
  exp: timestamp         // Expiration (30 ngày)
}
```

### 2.2. JWT Strategy

**File:** `packages/backend/src/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy)
```

**Bảo mật:**

1. **Trích xuất token:**

   ```typescript
   jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken();
   ```

2. **Xác thực payload:**

   ```typescript
   if (!payload || !payload.sub || !payload.iat) {
     throw new UnauthorizedException("Invalid token payload.");
   }
   ```

3. **Kiểm tra user còn tồn tại:**

   ```typescript
   const user = await this.userService.findOneById(payload.sub);
   if (!user) {
     throw new UnauthorizedException("User not found.");
   }
   ```

4. **Kiểm tra token revocation:**
   ```typescript
   const tokensValidFromSec = Math.floor(user.tokensValidFrom.getTime() / 1000);
   if (payload.iat < tokensValidFromSec) {
     throw new UnauthorizedException("Token has been revoked.");
   }
   ```
   - Mỗi user có field `tokensValidFrom`
   - Khi đổi mật khẩu, `tokensValidFrom` được cập nhật
   - Tất cả tokens cũ (iat < tokensValidFrom) bị vô hiệu hóa

### 2.3. Refresh Token Strategy

**File:** `packages/backend/src/auth/strategies/refresh-token.strategy.ts`

**Đặc điểm:**

- Lấy token từ HttpOnly cookie (`refresh_token`)
- Secret key riêng biệt (`JWT_REFRESH_SECRET`)
- Kiểm tra token revocation tương tự Access Token
- Yêu cầu user ID đúng định dạng UUID (36 ký tự)

**Bảo mật Refresh Token:**

1. **Lưu trữ trong Database:**

   ```typescript
   // File: packages/backend/src/user/user.service.ts
   async setCurrentRefreshToken(options: SetRefreshTokenOptions)
   ```

   - Hash token trước khi lưu vào DB
   - Lưu kèm thông tin: IP address, User Agent, expiration date
   - Chỉ lưu tối đa 5 refresh tokens/user (giới hạn số thiết bị)

2. **HttpOnly Cookie:**
   - Không thể truy cập từ JavaScript (chống XSS)
   - Secure flag trong production
   - SameSite attribute (chống CSRF)

## 3. OAuth 2.0 (Google Login)

### 3.1. Google Strategy

**File:** `packages/backend/src/auth/strategies/google.strategy.ts`

**Quy trình:**

1. **Redirect đến Google OAuth:**

   ```typescript
   @Get('google')
   @UseGuards(AuthGuard('google'))
   async googleLogin()
   ```

2. **Callback xử lý:**

   ```typescript
   @Get('google/callback')
   @UseGuards(AuthGuard('google'))
   async googleLoginCallback(@Request() req, @Res() res)
   ```

3. **Validate profile từ Google:**
   ```typescript
   async validate(accessToken: string, refreshToken: string, profile: any)
   ```

**Bảo mật:**

1. **Tạo hoặc tìm user:**

   - Email từ Google đã được xác thực
   - Set `isEmailVerified = true` tự động
   - Không lưu password (OAuth-only accounts)

2. **User Identity tracking:**

   ```typescript
   // File: packages/shared/src/user-identity.entity.ts
   {
     provider: 'google',
     providerId: googleId,
     userId: user.id
   }
   ```

   - Liên kết tài khoản Google với user
   - Cho phép login qua nhiều providers

3. **Mã hóa tokens từ Google:**
   ```typescript
   const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
   const encryptedRefreshToken = refreshToken
     ? this.encryptionService.encrypt(refreshToken)
     : null;
   ```
   - Lưu encrypted tokens trong DB
   - Sử dụng AES-256-GCM

### 3.2. Link Google Account

**File:** `packages/backend/src/auth/strategies/google-link.strategy.ts`

**Mục đích:** Liên kết tài khoản Google với tài khoản email/password hiện có

**Bảo mật:**

- Yêu cầu đã đăng nhập (JwtAuthGuard)
- Kiểm tra Google account chưa được liên kết với user khác
- Cập nhật UserIdentity với encrypted tokens

## 4. Xác thực Hai yếu tố (2FA)

### 4.1. Thiết lập 2FA

**File:** `packages/backend/src/auth/2fa/two-factor-authentication.controller.ts`

**Endpoint:** `POST /2fa/generate`

**Guard:** `JwtAuthGuard` (phải đăng nhập)

**Quy trình:**

1. **Tạo secret key:**

   ```typescript
   const { secret, otpauthUrl } =
     this.twoFactorAuthService.generateSecret(user);
   ```

   - Sử dụng thư viện `speakeasy`
   - Secret key unique cho mỗi user

2. **Tạo QR Code:**

   ```typescript
   const qrCodeDataURL = await this.twoFactorAuthService.generateQrCodeDataURL(
     otpauthUrl
   );
   ```

3. **Lưu secret tạm thời:**

   ```typescript
   const encryptedSecret = this.encryptionService.encrypt(secret);
   response.cookie("2fa_secret", encryptedSecret, {
     httpOnly: true,
     secure: NODE_ENV === "production",
     expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
   });
   ```

   - Không lưu vào DB ngay
   - Chỉ lưu trong cookie tạm (5 phút)
   - Đã được mã hóa

4. **Kích hoạt 2FA:**
   **Endpoint:** `POST /2fa/turn-on`

   ```typescript
   const decryptedSecret = this.encryptionService.decrypt(secret2faCookie);
   const isCodeValid = this.twoFactorAuthService.isCodeValid(
     code,
     decryptedSecret
   );
   ```

   - Xác thực mã OTP từ ứng dụng authenticator
   - Lưu encrypted secret vào DB
   - Xóa cookie tạm
   - Tạo recovery codes

### 4.2. Recovery Codes

**Entity:** `TwoFactorRecoveryCode`

**Bảo mật:**

- Tạo 10 recovery codes ngẫu nhiên
- Hash với bcrypt trước khi lưu DB
- Hiển thị một lần duy nhất khi tạo
- Có thể regenerate (vô hiệu hóa codes cũ)

**Sử dụng:**

- Endpoint: `POST /2fa/authenticate-recovery`
- So sánh với bcrypt
- Đánh dấu `used = true` sau khi sử dụng (one-time use)

### 4.3. Đăng nhập với 2FA

**File:** `packages/backend/src/auth/strategies/2fa-partial-token.strategy.ts`

**Quy trình:**

1. **Login thông thường → nhận 2fa_partial_token**
2. **Submit OTP code:**

   ```typescript
   POST /2fa/authenticate
   Body: { code: "123456" }
   ```

3. **Xác thực:**
   - Validate 2fa_partial_token từ cookie
   - Decrypt 2FA secret từ DB
   - Validate OTP code
   - Cấp full access token + refresh token

**Bảo mật của Partial Token:**

```typescript
{
  sub: userId,
  isTwoFactorAuthenticated: false,
  is2FA: true  // Flag đặc biệt
}
```

- Secret riêng (`TWO_FACTOR_AUTH_JWT_SECRET`)
- TTL ngắn (5 phút)
- Chỉ dùng cho việc submit 2FA code

## 5. Token Management

### 5.1. Token Revocation

**Cơ chế:**

- Field `tokensValidFrom` trong User entity
- Mặc định = thời điểm tạo user
- Cập nhật khi:
  - Đổi mật khẩu
  - Đổi email
  - Logout khỏi tất cả thiết bị

**Kiểm tra:**

```typescript
if (payload.iat < tokensValidFromSec) {
  throw new UnauthorizedException("Token has been revoked.");
}
```

### 5.2. Refresh Token Rotation

**File:** `packages/backend/src/auth/auth.controller.ts`

**Endpoint:** `GET /auth/refresh`

**Guard:** `RefreshTokenGuard`

**Quy trình:**

1. Validate refresh token từ cookie
2. Tạo cặp tokens mới
3. Lưu refresh token mới vào DB
4. Xóa refresh token cũ khỏi DB
5. Trả về access token mới + set cookie mới

**Bảo mật:**

- Mỗi refresh token chỉ dùng 1 lần
- Detect token reuse (chống tấn công)
- Giới hạn số lượng refresh tokens/user

### 5.3. Logout

**Endpoint:** `POST /auth/logout`

**Các tùy chọn:**

1. **Logout thiết bị hiện tại:**

   ```typescript
   await this.authService.logout(userId, refreshTokenFromCookie);
   ```

   - Xóa refresh token khỏi DB
   - Clear cookie

2. **Logout tất cả thiết bị:**
   ```typescript
   POST / auth / logout - all - devices;
   ```
   - Cập nhật `tokensValidFrom = now()`
   - Vô hiệu hóa tất cả tokens
   - Xóa tất cả refresh tokens

## 6. Password Security

### 6.1. Hashing

**Algorithm:** bcrypt
**Salt rounds:** 12

```typescript
const passwordHash = await bcrypt.hash(password, 12);
```

**Lý do chọn bcrypt:**

- Slow hash function (chống brute-force)
- Adaptive (có thể tăng cost factor)
- Salt tự động

### 6.2. Password Validation

**File:** `packages/shared/src/login.dto.ts` và các DTO khác

**Rules:**

- Tối thiểu 8 ký tự
- Class-validator cho validation

**Frontend thêm:**

- Password strength indicator
- Yêu cầu: chữ hoa, chữ thường, số, ký tự đặc biệt
- Show/hide password

### 6.3. Password Change

**File:** `packages/backend/src/auth/auth.service.ts`

```typescript
async changePassword(userId: string, currentPassword: string, newPassword: string)
```

**Bảo mật:**

1. Verify current password
2. Hash new password
3. Update `tokensValidFrom` (revoke old tokens)
4. Delete all old refresh tokens
5. Generate new tokens
6. Force re-authentication

**Set Password (OAuth users):**

```typescript
async setPassword(userId: string, newPassword: string)
```

- Cho phép OAuth users set password
- Không yêu cầu current password
- Kiểm tra chưa có password

## 7. Session Management

### 7.1. Refresh Token Entity

**File:** `packages/shared/src/refresh-token.entity.ts`

**Fields:**

```typescript
{
  id: number,
  userId: string,
  tokenHash: string,     // bcrypt hash
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string,
  createdAt: Date
}
```

**Bảo mật:**

- Token được hash trước khi lưu
- Lưu metadata (IP, User Agent) để audit
- TTL tự động (expiresAt)
- Cleanup tokens hết hạn

### 7.2. Session Limits

**File:** `packages/backend/src/user/user.service.ts`

```typescript
// Keep only the 5 most recent tokens
if (allTokens.length > 5) {
  const tokensToDelete = allTokens.slice(5);
  await entityManager.remove(tokensToDelete);
}
```

**Mục đích:**

- Giới hạn số thiết bị đăng nhập đồng thời
- Ngăn token hoarding
- Tự động logout thiết bị cũ

## 8. Email Verification

### 8.1. Quy trình xác thực

**Sau khi đăng ký:**

1. Tạo verification token (32 bytes random)
2. Lưu vào Redis (TTL 15 phút)
3. Gửi email chứa link
4. User click link → `GET /auth/verify-email?token=xxx`
5. Validate token → set `isEmailVerified = true`

**Bảo mật:**

- Token ngẫu nhiên, không đoán được
- TTL ngắn (15 phút)
- One-time use (xóa sau khi verify)
- Gửi qua email an toàn

### 8.2. Resend Verification

**Endpoint:** `POST /auth/resend-verification`

**Throttling:** 5 requests / 5 phút (đã comment, nên implement)

**Bảo mật:**

- Tạo token mới
- Xóa token cũ
- Reset TTL

## 9. Email Change Security

**File:** `packages/backend/src/user/user.service.ts`

```typescript
async requestEmailChange(userId, newEmail, currentPassword)
async confirmEmailChange(token)
async cancelEmailChange(userId)
```

**Quy trình:**

1. **Request:**

   - Verify current password
   - Kiểm tra email mới chưa được dùng
   - Tạo verification token
   - Gửi email đến cả email cũ và mới

2. **Verification Token:**

   ```typescript
   const verificationToken = crypto.randomBytes(32).toString("hex");
   const tokenKey = `email-change-token:${verificationToken}`;
   await this.cacheManager.set(tokenKey, emailChangeRequest.id, 900000);
   ```

3. **Confirm:**
   - Validate token
   - Update email
   - Revoke all tokens (force re-login)
   - Xóa request

**Bảo mật:**

- Yêu cầu mật khẩu
- Verify qua email (cả 2 addresses)
- Token one-time use
- Revoke sessions sau khi đổi

## 10. Rate Limiting & Throttling

**Note:** Hiện tại đã comment, nhưng infrastructure đã sẵn sàng

**File:** `packages/backend/src/app.module.ts`

```typescript
// ThrottlerModule.forRoot([{
//   ttl: 60000,  // 60 seconds
//   limit: 20,   // 20 requests
// }])
```

**Các endpoint cần throttle:**

1. **Login:** 5 requests / 60s

   ```typescript
   // @Throttle({ default: { limit: 5, ttl: 60000 } })
   ```

2. **Register:** 5 requests / 5 phút

   ```typescript
   // @Throttle({ default: { limit: 5, ttl: 300000 } })
   ```

3. **Password reset, Email verification:** Tương tự

**Lợi ích:**

- Chống brute-force
- Chống spam registration
- Chống enumeration attacks

## 11. Environment Variables Security

**Các secrets quan trọng:**

```bash
JWT_SECRET=           # Access token secret
JWT_REFRESH_SECRET=   # Refresh token secret
TWO_FACTOR_AUTH_JWT_SECRET=  # 2FA partial token secret
ENCRYPTION_KEY=       # AES-256 key (32 chars)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Best practices:**

- Không commit vào Git
- Sử dụng `.env` file (gitignored)
- Rotate secrets định kỳ
- Sử dụng secrets manager trong production

## 12. Kết luận

Hệ thống xác thực được thiết kế với nhiều lớp bảo mật:

✅ **Password hashing** với bcrypt (cost factor 12)
✅ **JWT** với token revocation mechanism
✅ **Refresh token rotation** và session limits
✅ **2FA** với TOTP và recovery codes
✅ **OAuth 2.0** integration (Google)
✅ **Email verification** bắt buộc
✅ **Secure password reset** flow
✅ **Token encryption** cho OAuth tokens
✅ **HttpOnly cookies** cho refresh tokens
✅ **Rate limiting** ready (cần enable)

**Các điểm cần cải thiện:**

1. Enable rate limiting/throttling
2. Implement account lockout sau N lần đăng nhập sai
3. Add CAPTCHA cho sensitive endpoints
4. Implement password history (prevent reuse)
5. Add device fingerprinting
6. Implement suspicious login detection
