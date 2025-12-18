# Hướng dẫn Frontend - Liên kết Tài khoản Google

## 📋 Tổng quan

Tính năng frontend cho phép người dùng:

- ✅ Xem danh sách tài khoản đã liên kết
- ✅ Liên kết tài khoản Google mới
- ✅ Hủy liên kết tài khoản Google (nếu đã có password)
- ✅ Nhận thông báo kết quả sau khi OAuth redirect về

## 🗂️ Files được thêm/chỉnh sửa

### 1. `/src/services/settingsApi.ts`

Thêm các API functions và React Query hooks:

**Types mới:**

```typescript
interface LinkedAccount {
  id: string;
  provider: string;
  providerId: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

interface LinkGoogleAccountResponse {
  redirectUrl: string;
}

interface UnlinkOAuthAccountPayload {
  provider: string;
}
```

**API Functions:**

- `initiateLinkGoogleAccount()` - Bắt đầu flow liên kết Google
- `unlinkOAuthAccount()` - Hủy liên kết OAuth account
- `fetchLinkedAccounts()` - Lấy danh sách tài khoản đã liên kết

**React Query Hooks:**

- `useLinkedAccountsQuery()` - Query để lấy linked accounts
- `useInitiateLinkGoogleMutation()` - Mutation để khởi tạo linking
- `useUnlinkOAuthAccountMutation()` - Mutation để unlink account

### 2. `/src/pages/settings/SecurityPage.tsx`

Thêm component mới `LinkedAccountsSection`:

**Features:**

- Hiển thị trạng thái liên kết Google (đã/chưa liên kết)
- Button "Liên kết" - redirect user đến Google OAuth
- Button "Hủy liên kết" - mở dialog xác nhận
- Dialog warning nếu user chưa có password
- Auto-handle OAuth callback với query parameters

## 🎯 User Flow

### Liên kết tài khoản Google

```
1. User vào Settings → Security → Linked Accounts
   ↓
2. Click button "Liên kết" trên card Google
   ↓
3. Frontend call API: GET /auth/link-google
   → Backend return: { redirectUrl: "..." }
   ↓
4. Frontend redirect: window.location.href = redirectUrl
   ↓
5. User đăng nhập Google và cho phép quyền
   ↓
6. Google redirect về: /settings/account?linkSuccess=true
   ↓
7. useEffect detect query param → Show toast success
   ↓
8. Clean URL và refresh linked accounts list
```

### Hủy liên kết

```
1. User click button "Hủy liên kết"
   ↓
2. Mở Dialog xác nhận
   ├─→ Nếu chưa có password: Show warning, disable confirm
   └─→ Nếu có password: Enable confirm button
   ↓
3. User confirm → Call API: POST /auth/unlink-oauth
   ↓
4. Show toast success/error
   ↓
5. Refresh linked accounts list
```

## 🎨 UI Components

### LinkedAccountsSection Component

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-start gap-3">
    <div className="mt-1 p-2 rounded-lg bg-primary/10">
      <LinkIcon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h3>Tài khoản liên kết</h3>
      <p>Liên kết tài khoản của bạn với các nhà cung cấp OAuth...</p>
    </div>
  </div>

  {/* Google Account Card */}
  <div className="p-4 border rounded-lg bg-card">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">{/* Google Icon SVG */}</div>
        <div>
          <p className="font-medium">Google</p>
          <p className="text-xs text-muted-foreground">
            {isGoogleLinked ? "Đã liên kết" : "Chưa liên kết"}
          </p>
        </div>
      </div>
      {/* Button: Liên kết / Hủy liên kết */}
    </div>
  </div>

  {/* Unlink Dialog */}
  <Dialog>...</Dialog>
</div>
```

## 🔧 Code Examples

### Initiate Google Linking

```typescript
const handleLinkGoogle = () => {
  initiateLinkMutation.mutate(undefined, {
    onSuccess: (data) => {
      // Redirect to Google OAuth
      window.location.href = data.redirectUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Không thể khởi tạo liên kết Google.",
        variant: "destructive",
      });
    },
  });
};
```

### Unlink Account

```typescript
const confirmUnlink = () => {
  if (!accountToUnlink) return;

  unlinkMutation.mutate(
    { provider: accountToUnlink },
    {
      onSuccess: (data) => {
        toast({
          title: "Thành công",
          description: data.message,
        });
        setIsUnlinkDialogOpen(false);
        setAccountToUnlink(null);
      },
      onError: (error: any) => {
        toast({
          title: "Lỗi",
          description:
            error.response?.data?.message || "Không thể hủy liên kết.",
          variant: "destructive",
        });
      },
    }
  );
};
```

### Handle OAuth Callback

```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get("linkSuccess")) {
    toast({
      title: "Thành công",
      description: "Liên kết tài khoản Google thành công!",
    });
    // Clean up URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  if (urlParams.get("linkError")) {
    const error = urlParams.get("linkError");
    toast({
      title: "Lỗi",
      description: decodeURIComponent(
        error || "Có lỗi xảy ra khi liên kết tài khoản."
      ),
      variant: "destructive",
    });
    // Clean up URL
    window.history.replaceState({}, "", window.location.pathname);
  }
}, [toast]);
```

## 🎨 Styling

Component sử dụng:

- Tailwind CSS classes
- shadcn/ui components (Button, Dialog, etc.)
- Lucide React icons
- Consistent với design system hiện tại

### Color scheme:

- Primary color cho icons và highlights
- Muted background cho cards
- Destructive variant cho unlink button
- Success/Error toast notifications

## ⚠️ Error Handling

### Client-side validations:

1. ✅ Check if already linked trước khi show button
2. ✅ Disable button khi đang loading (isPending)
3. ✅ Check passwordHash trước khi cho phép unlink
4. ✅ Handle network errors với toast notifications

### Error messages từ backend:

- "Email của tài khoản Google không khớp với email tài khoản hiện tại."
- "Tài khoản Google này đã được liên kết với một tài khoản khác."
- "Tài khoản Google này đã được liên kết với tài khoản của bạn."
- "Invalid or expired state token."
- "Bạn cần đặt mật khẩu trước khi hủy liên kết tài khoản Google."

## 🔒 Security Considerations

1. **State Token:** Backend tự động handle state token để prevent CSRF
2. **OAuth Flow:** Sử dụng redirect thay vì popup để đảm bảo security
3. **Password Check:** Không cho phép unlink nếu user chưa có password
4. **URL Cleanup:** Xóa sensitive query params sau khi xử lý
5. **JWT Required:** Tất cả API calls cần JWT token

## 📱 Responsive Design

- Card layout responsive với max-width
- Button sizing phù hợp với mobile
- Dialog hiển thị tốt trên mọi screen size
- Icons và text có spacing hợp lý

## 🧪 Testing Scenarios

### Scenario 1: User chưa liên kết Google

```
✓ Hiển thị "Chưa liên kết"
✓ Button "Liên kết" visible
✓ Click button → redirect Google OAuth
✓ Sau khi link → hiển thị "Đã liên kết"
```

### Scenario 2: User đã liên kết Google

```
✓ Hiển thị "Đã liên kết"
✓ Button "Hủy liên kết" visible
✓ Click button → mở dialog
✓ Confirm → unlink thành công
```

### Scenario 3: User chưa có password

```
✓ Click "Hủy liên kết"
✓ Dialog hiển thị warning
✓ Button "Xác nhận" bị disable
✓ Chỉ có button "Hủy"
```

### Scenario 4: OAuth redirect callback

```
✓ URL có ?linkSuccess=true → toast success
✓ URL có ?linkError=xxx → toast error
✓ URL được clean up sau khi show toast
```

## 🚀 Future Enhancements

Có thể mở rộng trong tương lai:

- [ ] Thêm providers khác (Facebook, GitHub, etc.)
- [ ] Hiển thị thời gian liên kết
- [ ] Hiển thị email của Google account
- [ ] Popup OAuth thay vì full redirect
- [ ] Loading skeleton cho linked accounts list
- [ ] Animation khi add/remove account

## 📝 Notes

- Component được thêm vào SecurityPage cùng với 2FA, Change Password, và Change Email
- Sử dụng React Query để auto-refetch sau mutations
- Toast notifications consistent với các features khác
- Code style và naming convention theo chuẩn của project
