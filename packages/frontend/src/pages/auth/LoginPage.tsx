// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useLoginMutation } from "../../services/authApi";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const LoginPage = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loginAction = useAuthStore((state) => state.login);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasShownMessage = useRef(false);

  // Show message from registration if present
  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasShownMessage.current) {
      return;
    }

    const state = location.state as {
      message?: string;
      email?: string;
      invitationToken?: string;
    };
    if (state?.message) {
      hasShownMessage.current = true;
      toast({
        title: state.invitationToken
          ? "Thông báo - Lời mời đang chờ"
          : "Thông báo",
        description: state.message,
      });
      if (state.email) {
        setEmail(state.email);
      }
      // Keep the state if there's an invitation token (don't clear it)
      // so onSuccess can use it to redirect
      if (!state.invitationToken) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, toast]);

  const { mutate: login, isPending } = useLoginMutation({
    onSuccess: (data) => {
      console.log("🔵 [LoginPage] Login successful, user data:", data.user);
      loginAction(data.user, data.accessToken);

      // Check if there's an invitation token in the state (from registration or email verification)
      const state = location.state as { invitationToken?: string };
      console.log(
        "🔵 [LoginPage] Checking for invitation token in state:",
        state
      );

      if (state?.invitationToken) {
        const redirectUrl = `/accept-invitation?token=${state.invitationToken}`;
        console.log(
          "🎉 [LoginPage] User has pending invitation, redirecting to accept-invitation page with token:",
          state.invitationToken
        );
        console.log("🔵 [LoginPage] Full redirect URL:", redirectUrl);
        console.log("🔵 [LoginPage] Calling navigate() now...");

        // Try using setTimeout to ensure state is updated first
        setTimeout(() => {
          console.log("🔵 [LoginPage] Executing navigate inside setTimeout...");
          navigate(redirectUrl, {
            replace: true,
          });
          console.log("🔵 [LoginPage] navigate() called successfully");
        }, 100);

        return;
      }

      console.log("ℹ️ [LoginPage] No invitation token found in state");

      // Check if there's a redirect parameter (e.g., for invitation flow)
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        console.log("🔵 [LoginPage] Redirecting to:", redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        console.log("🔵 [LoginPage] Redirecting to default /inbox");
        navigate("/inbox");
      }
    },
    onError: (error: any) => {
      if (
        error.response?.status === 401 &&
        error.response?.data?.errorCode === "2FA_REQUIRED"
      ) {
        sessionStorage.setItem("emailFor2fa", email);
        navigate("/verify-2fa");
      } else {
        toast({
          title: "Lỗi",
          description:
            error.response?.data?.message ||
            "Email hoặc mật khẩu không hợp lệ.",
          variant: "destructive",
        });
      }
    },
  });

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const googleAuthUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  return (
    <AuthLayout title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục">
      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email-address"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <Input
              id="email-address"
              type="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending || isGoogleLoading}
              className="h-11"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending || isGoogleLoading}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          disabled={isPending || isGoogleLoading}
        >
          {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-medium">
            Hoặc
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11"
        onClick={handleGoogleLogin}
        disabled={isPending || isGoogleLoading}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isGoogleLoading ? "Đang chuyển hướng..." : "Tiếp tục với Google"}
      </Button>

      <div className="mt-6 space-y-3">
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary/90 transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Chưa nhận được email xác thực?{" "}
          <Link
            to="/resend-verification"
            className="font-medium text-primary hover:text-primary/90 transition-colors"
          >
            Gửi lại
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
