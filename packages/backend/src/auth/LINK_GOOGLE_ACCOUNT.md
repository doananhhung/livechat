# Hướng dẫn Liên kết Tài khoản Google

## 📋 Tổng quan

Tính năng này cho phép người dùng đã đăng nhập (sử dụng email/password) liên kết tài khoản Google của họ với tài khoản hiện tại. Sau khi liên kết, người dùng có thể đăng nhập bằng cả 2 cách:

- Email/Password (truyền thống)
- Google OAuth (nhanh hơn)

## 🔧 API Endpoints

### 1. Bắt đầu liên kết (Initiate Google Linking)

**Endpoint:** `GET /auth/link-google`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "redirectUrl": "https://api.example.com/auth/link-google/redirect?state=xyz789"
}
```

**Cách sử dụng:**

- Frontend gọi API này
- Nhận `redirectUrl` từ response
- Redirect user đến URL này (hoặc mở trong popup/new tab)

### 2. Google OAuth Redirect

**Endpoint:** `GET /auth/link-google/redirect?state=<state_token>`

- Endpoint này tự động redirect đến Google OAuth
- User đăng nhập Google và cho phép quyền truy cập
- Google redirect về callback URL

### 3. Callback (Tự động xử lý)

**Endpoint:** `GET /auth/link-google/callback?code=...&state=...`

- Backend tự động xử lý
- Liên kết tài khoản Google với user hiện tại
- Redirect về frontend với kết quả:
  - Thành công: `/settings/account?linkSuccess=true`
  - Thất bại: `/settings/account?linkError=<error_message>`

### 4. Hủy liên kết tài khoản Google

**Endpoint:** `POST /auth/unlink-oauth`

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
  "provider": "google"
}
```

**Response:**

```json
{
  "message": "Đã hủy liên kết tài khoản google thành công."
}
```

**Lưu ý:** Chỉ có thể hủy liên kết nếu user đã có password. Điều này đảm bảo user luôn có ít nhất 1 cách đăng nhập.

### 5. Xem danh sách tài khoản đã liên kết

**Endpoint:** `GET /auth/linked-accounts`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
  {
    "id": "uuid",
    "provider": "google",
    "providerId": "google_user_id_123",
    "userId": "user_uuid",
    "createdAt": "2025-10-20T10:00:00.000Z"
  }
]
```

## 🎨 Frontend Implementation Example

### React/Vue Component

```typescript
// AccountSettings.tsx
const linkGoogleAccount = async () => {
  try {
    // 1. Gọi API để lấy redirect URL
    const response = await fetch('/api/auth/link-google', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();

    // 2. Redirect user đến Google OAuth
    window.location.href = data.redirectUrl;

    // Hoặc mở trong popup:
    // const popup = window.open(data.redirectUrl, 'Link Google Account', 'width=600,height=700');

  } catch (error) {
    console.error('Error linking Google account:', error);
  }
};

// Xử lý kết quả sau khi redirect về
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('linkSuccess')) {
    toast.success('Liên kết tài khoản Google thành công!');
    // Refresh user info
    fetchUserData();
  }

  if (urlParams.get('linkError')) {
    const error = urlParams.get('linkError');
    toast.error(decodeURIComponent(error));
  }
}, []);

// UI Button
<button onClick={linkGoogleAccount}>
  <GoogleIcon /> Liên kết với Google
</button>
```

### Hủy liên kết

```typescript
const unlinkGoogleAccount = async () => {
  try {
    const response = await fetch('/api/auth/unlink-oauth', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: 'google' }),
    });

    const data = await response.json();
    toast.success(data.message);
    fetchLinkedAccounts(); // Refresh danh sách
  } catch (error) {
    console.error('Error unlinking Google account:', error);
  }
};
```

## 🔐 Security Flow

```
1. User (đã đăng nhập) → Click "Liên kết Google"
   ↓
2. Frontend → GET /auth/link-google (với JWT token)
   ↓
3. Backend → Tạo state token, lưu vào Redis
   → Redis: "one-time-code:xyz789" → "user_id_abc123"
   → Return: { redirectUrl: "...?state=xyz789" }
   ↓
4. Frontend → Redirect user đến Google OAuth (với state=xyz789)
   ↓
5. User → Đăng nhập Google, cho phép quyền truy cập
   ↓
6. Google → Redirect về /auth/link-google/callback?code=...&state=xyz789
   ↓
7. Backend GoogleLinkStrategy → Validate với Google, lấy profile
   → Pass state qua validate function
   ↓
8. Backend Callback Handler:
   → Lấy state từ req.user
   → Lookup Redis: "one-time-code:xyz789" → "user_id_abc123"
   → Biết được user nào muốn liên kết
   → Tạo UserIdentity mới liên kết Google với user_id_abc123
   → Delete state token khỏi Redis
   ↓
9. Backend → Redirect về frontend với success/error message
   ↓
10. Frontend → Hiển thị thông báo cho user
```

## ⚠️ Error Handling

### Các lỗi có thể xảy ra:

1. **Email không khớp:**
   - Lỗi: "Email của tài khoản Google không khớp với email tài khoản hiện tại."
   - Giải pháp: User phải sử dụng tài khoản Google có cùng email

2. **Google account đã liên kết với tài khoản khác:**
   - Lỗi: "Tài khoản Google này đã được liên kết với một tài khoản khác."
   - Giải pháp: User cần hủy liên kết ở tài khoản cũ trước

3. **Google account đã liên kết:**
   - Lỗi: "Tài khoản Google này đã được liên kết với tài khoản của bạn."
   - Giải pháp: Không cần làm gì

4. **State token hết hạn:**
   - Lỗi: "Invalid or expired state token."
   - Giải pháp: User thử lại từ đầu (state token chỉ có hiệu lực 5 phút)

5. **Hủy liên kết khi chưa có password:**
   - Lỗi: "Bạn cần đặt mật khẩu trước khi hủy liên kết tài khoản Google."
   - Giải pháp: User cần tạo password trước (vì đây là tài khoản Google-only)

## 🎯 Use Cases

### Use Case 1: User đăng ký bằng email, sau đó muốn liên kết Google

```
1. User đăng ký: email@example.com / password123
2. Sau đó vào Settings → Liên kết Google
3. Đăng nhập Google với email@example.com
4. ✅ Liên kết thành công
5. Từ nay có thể đăng nhập bằng cả email/password hoặc Google
```

### Use Case 2: User có 2 tài khoản, muốn gộp lại

```
- Tài khoản 1: email@example.com (đăng ký bằng email)
- Tài khoản 2: email@example.com (đăng nhập bằng Google)

❌ Không thể gộp tự động vì đã có 2 user entity riêng biệt
✅ Giải pháp: Chỉ sử dụng 1 tài khoản và liên kết Google vào đó
```

## 🔍 Database Schema

```typescript
// UserIdentity entity
{
  id: string(UUID);
  provider: string; // 'google'
  providerId: string; // Google user ID
  userId: string; // User UUID trong hệ thống
  user: User; // Relation
  createdAt: Date;
  updatedAt: Date;
}
```

Một user có thể có nhiều UserIdentity (Google, Facebook, GitHub, v.v.)

## 📝 Environment Variables Required

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## ✅ Testing Checklist

- [ ] User đã đăng nhập có thể khởi tạo liên kết Google
- [ ] Email Google phải khớp với email tài khoản hiện tại
- [ ] Không thể liên kết Google account đã được liên kết với user khác
- [ ] Sau khi liên kết, có thể đăng nhập bằng Google
- [ ] Có thể hủy liên kết nếu đã có password
- [ ] Không thể hủy liên kết nếu chưa có password (tài khoản Google-only)
- [ ] State token hết hạn sau 5 phút
- [ ] Redirect về frontend với message phù hợp
