# Bảo mật Frontend

## Tổng quan

Frontend security là lớp bảo vệ đầu tiên, ngăn chặn các tấn công phổ biến như XSS, CSRF, và data leakage. Hệ thống triển khai các best practices:

- **XSS Prevention**
- **CSRF Protection**
- **Secure Storage**
- **Input Sanitization**
- **Route Protection**
- **State Management Security**

## 1. XSS (Cross-Site Scripting) Prevention

### 1.1. React Built-in Protection

**Auto-escaping:**

```tsx
// SAFE - React auto-escapes
const userInput = '<script>alert("XSS")</script>';
<div>{userInput}</div>;
// Renders as: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

**Dangerous patterns to avoid:**

```tsx
// DANGEROUS - Never use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />;

// DANGEROUS - eval()
eval(userInput);

// DANGEROUS - inline event handlers with user data
<div onClick={`handleClick('${userInput}')`} />;
```

### 1.2. DOMPurify for Rich Content

**Installation:**

```bash
npm install dompurify @types/dompurify
```

**Usage:**

```tsx
import DOMPurify from "dompurify";

// For rendering user-generated HTML (comments, messages, etc.)
function MessageContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target"],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 1.3. URL Sanitization

```tsx
// Prevent javascript: URLs
function SafeLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isSafe = href.startsWith("http://") || href.startsWith("https://");

  return (
    <a href={isSafe ? href : "#"} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

// Usage in message rendering
<SafeLink href={userProvidedUrl}>Click here</SafeLink>;
```

### 1.4. Content Security Policy (CSP)

**index.html:**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' wss://api.example.com https://api.example.com;
"
/>
```

**Production CSP (stricter):**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: https:;
  connect-src https://api.example.com wss://api.example.com;
"
/>
```

## 2. CSRF (Cross-Site Request Forgery) Protection

### 2.1. SameSite Cookies

**Backend cookie setting:**

```typescript
response.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "strict", // or 'lax' for less strict
});
```

**SameSite options:**

- **Strict:** Cookie chỉ gửi với same-site requests
- **Lax:** Cookie gửi với top-level navigations (GET)
- **None:** Cookie gửi với mọi request (yêu cầu Secure)

### 2.2. Custom Request Headers

**Axios interceptor:**

```typescript
// File: packages/frontend/src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Add custom header to all requests
api.interceptors.request.use((config) => {
  config.headers["X-Requested-With"] = "XMLHttpRequest";
  return config;
});

export default api;
```

**Backend validation:**

```typescript
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header = request.headers["x-requested-with"];
    return header === "XMLHttpRequest";
  }
}
```

### 2.3. Origin Validation

**Backend:**

```typescript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://app.example.com",
    "https://dashboard.example.com",
  ];

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
});
```

## 3. Secure Token Storage

### 3.1. Access Token

**Zustand store:**

```typescript
// File: packages/frontend/src/stores/authStore.ts
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,

  setAccessToken: (token) => set({ accessToken: token }),

  logout: () => {
    set({ accessToken: null });
    // Clear other state
  },
}));
```

**Lưu ý:**

- ✅ **In-memory only:** Không lưu vào localStorage
- ✅ **Expires after page refresh:** Yêu cầu refresh token
- ✅ **No XSS exposure:** Không thể đánh cắp từ localStorage

### 3.2. Refresh Token

**HttpOnly cookie:**

- ✅ Lưu trong cookie (backend set)
- ✅ HttpOnly flag → không access từ JavaScript
- ✅ Secure flag → chỉ gửi qua HTTPS
- ✅ SameSite → chống CSRF

**Token refresh flow:**

```typescript
// File: packages/frontend/src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint (cookie automatically sent)
        const { data } = await api.get("/auth/refresh");

        // Update access token in store
        useAuthStore.getState().setAccessToken(data.accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 3.3. What NOT to Store in localStorage

❌ **NEVER store:**

- Passwords (even hashed)
- Refresh tokens
- API keys
- Personal identifiable information (PII)
- Session tokens

✅ **OK to store:**

- User preferences (theme, language)
- Non-sensitive UI state
- Public configuration

**Example:**

```typescript
// File: packages/frontend/src/stores/themeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage", // localStorage key
    }
  )
);
```

## 4. Route Protection

### 4.1. Protected Routes

**File:** `packages/frontend/src/components/ProtectedRoute.tsx`

```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

**Usage:**

```tsx
// File: packages/frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

### 4.2. Role-based Protection

```tsx
// File: packages/frontend/src/components/RoleProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleProtectedRoute({
  allowedRoles,
  children,
}: RoleProtectedRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

**Usage:**

```tsx
<Route
  path="/admin"
  element={
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <AdminPanel />
    </RoleProtectedRoute>
  }
/>
```

### 4.3. Redirect After Login

```tsx
// File: packages/frontend/src/pages/auth/LoginPage.tsx
import { useNavigate, useLocation } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const onLoginSuccess = (data) => {
    // Store token
    setAccessToken(data.accessToken);

    // Redirect to intended page or dashboard
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
  };
}
```

## 5. Input Sanitization & Validation

### 5.1. Form Validation

**React Hook Form:**

```tsx
// File: packages/frontend/src/pages/auth/RegisterPage.tsx
import { useForm } from "react-hook-form";

interface RegisterForm {
  email: string;
  password: string;
  fullName: string;
}

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = (data: RegisterForm) => {
    // Data is validated
    registerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address",
          },
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        type="password"
        {...register("password", {
          required: "Password is required",
          minLength: {
            value: 8,
            message: "Password must be at least 8 characters",
          },
          validate: {
            hasUpperCase: (value) =>
              /[A-Z]/.test(value) || "Must contain uppercase",
            hasLowerCase: (value) =>
              /[a-z]/.test(value) || "Must contain lowercase",
            hasNumber: (value) => /\d/.test(value) || "Must contain number",
            hasSpecialChar: (value) =>
              /[^a-zA-Z\d]/.test(value) || "Must contain special character",
          },
        })}
      />
      {errors.password && <span>{errors.password.message}</span>}
    </form>
  );
}
```

### 5.2. Sanitize Before Display

```tsx
// File: packages/frontend/src/components/inbox/MessageBubble.tsx
import DOMPurify from "dompurify";

function MessageBubble({ message }: { message: Message }) {
  // Sanitize message content
  const sanitized = DOMPurify.sanitize(message.content, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br"],
    ALLOWED_ATTR: ["href"],
  });

  return (
    <div className="message-bubble">
      <div dangerouslySetInnerHTML={{ __html: sanitized }} />
    </div>
  );
}
```

### 5.3. URL Validation

```tsx
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Usage
const userUrl = userInput;
if (isValidUrl(userUrl)) {
  window.open(userUrl, "_blank", "noopener,noreferrer");
}
```

## 6. Password Security UI

### 6.1. Password Strength Indicator

**File:** `packages/frontend/src/pages/settings/SecurityPage.tsx`

```tsx
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength;
};

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["red", "orange", "yellow", "lightgreen", "green"];

  return (
    <div>
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: `${(strength / 5) * 100}%`,
            backgroundColor: strengthColors[strength - 1],
          }}
        />
      </div>
      <p>{password && strengthLabels[strength - 1]}</p>

      <ul className="requirements">
        <li className={password.length >= 8 ? "met" : ""}>
          At least 8 characters
        </li>
        <li
          className={
            /[a-z]/.test(password) && /[A-Z]/.test(password) ? "met" : ""
          }
        >
          Uppercase and lowercase
        </li>
        <li className={/\d/.test(password) ? "met" : ""}>At least 1 number</li>
        <li className={/[^a-zA-Z\d]/.test(password) ? "met" : ""}>
          At least 1 special character
        </li>
      </ul>
    </div>
  );
}
```

### 6.2. Show/Hide Password

```tsx
function PasswordInput({ name, register }: any) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <input type={showPassword ? "text" : "password"} {...register(name)} />
      <button type="button" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}
```

## 7. WebSocket Security

### 7.1. Socket Service Isolation

**File:** `packages/frontend/src/widget/services/socketService.ts`

```typescript
class SocketService {
  private socket: Socket | null = null;
  private instanceId: string;

  constructor() {
    this.instanceId = crypto.randomUUID().slice(0, 8);
  }

  public connect(projectId: string, visitorUid: string): void {
    // Clean up old socket
    if (this.socket) {
      this.disconnect();
    }

    // Create new connection with query params
    const socketUrlWithParams = `${SOCKET_URL}?projectId=${projectId}`;

    this.socket = io(socketUrlWithParams, {
      transports: ["websocket", "polling"],
      forceNew: true, // Prevent connection reuse
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket.close();
      this.socket = null;
    }
  }
}

// Export singleton
export const socketService = new SocketService();
```

### 7.2. Event Handler Cleanup

```typescript
private eventHandlers: Map<string, Function> = new Map();

private removeAllListeners(): void {
  this.eventHandlers.forEach((handler, eventName) => {
    if (eventName === '__debug__') {
      this.socket?.offAny(handler as any);
    } else {
      this.socket?.off(eventName, handler as any);
    }
  });

  this.eventHandlers.clear();
}
```

**Tại sao quan trọng:**

- Prevent memory leaks
- Avoid duplicate handlers
- Clean state between connections

### 7.3. Message Validation

```typescript
const agentRepliedHandler = (data: any) => {
  // Validate message structure
  if (!data || !data.id || !data.content) {
    console.error("Invalid message format:", data);
    return;
  }

  // Sanitize content before adding to state
  const sanitizedContent = DOMPurify.sanitize(data.content);

  const newMessage: Message = {
    id: data.id,
    content: sanitizedContent,
    sender: { type: data.fromCustomer ? "visitor" : "agent" },
    timestamp: data.createdAt,
  };

  addMessage(newMessage);
};

this.socket.on("agentReplied", agentRepliedHandler);
```

## 8. Third-Party Dependencies

### 8.1. Audit Packages

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# View detailed report
npm audit --json
```

### 8.2. Dependency Scanning

**GitHub Dependabot:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: "/packages/frontend"
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
```

### 8.3. Lock File

```bash
# Always commit package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
```

**Tại sao:**

- Đảm bảo reproducible builds
- Prevent supply chain attacks
- Track dependency changes

## 9. Error Boundaries

### 9.1. React Error Boundary

```tsx
// File: packages/frontend/src/components/ErrorBoundary.tsx
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error("Error caught by boundary:", error, errorInfo);

    // Don't log sensitive info in production
    if (import.meta.env.PROD) {
      // Send to error tracking (Sentry, etc.)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page.</p>
          {/* Don't show error details in production */}
          {import.meta.env.DEV && <pre>{this.state.error?.toString()}</pre>}
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## 10. Secure Communication

### 10.1. Axios Configuration

**File:** `packages/frontend/src/lib/api.ts`

```typescript
import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send cookies
  timeout: 10000, // 10 second timeout
});

// Request interceptor - Add auth header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Token refresh logic
    // ...

    // Don't expose error details
    if (error.response?.status === 500) {
      console.error("Server error", error);
      // Show generic message to user
      return Promise.reject(new Error("An error occurred"));
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 10.2. Environment Variables

**File:** `.env.local` (not in Git)

```bash
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=wss://api.example.com
VITE_GOOGLE_CLIENT_ID=***************
```

**Usage:**

```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;

// Validate in code
if (!API_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}
```

## 11. Build & Deployment Security

### 11.1. Production Build

```bash
# Build with optimizations
npm run build

# Output analysis
npm run build -- --analyze
```

### 11.2. Remove Dev Dependencies

```json
// package.json
{
  "devDependencies": {
    // Not included in production build
  },
  "dependencies": {
    // Only these go to production
  }
}
```

### 11.3. Subresource Integrity (SRI)

**For CDN scripts:**

```html
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous"
></script>
```

## 12. Kết luận

Frontend security được thiết kế với:

✅ **XSS Prevention:** React auto-escaping, DOMPurify, CSP
✅ **CSRF Protection:** SameSite cookies, custom headers
✅ **Secure Storage:** In-memory tokens, HttpOnly cookies
✅ **Route Protection:** Auth guards, role-based access
✅ **Input Validation:** React Hook Form, sanitization
✅ **Password Security:** Strength indicator, show/hide
✅ **WebSocket Security:** Proper cleanup, message validation
✅ **Dependency Security:** Audit, Dependabot
✅ **Error Handling:** Error boundaries, safe messages

**Cần cải thiện:**

1. Implement stricter CSP in production
2. Add CSRF token for state-changing requests
3. Implement session timeout warning
4. Add biometric authentication option
5. Implement device fingerprinting
6. Add audit logging for sensitive actions
7. Set up error tracking (Sentry)
8. Add performance monitoring
