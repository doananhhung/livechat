// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const loginAction = useAuthStore((state) => state.login);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // [3] State to hide/show password

  const { mutate: login, isPending } = useLoginMutation({
    onSuccess: (data) => {
      loginAction(data.user, data.accessToken);
      navigate("/dashboard");
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
    <AuthLayout title="Đăng nhập vào tài khoản">
      <div className="w-full max-w-sm">
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-4">
            <Input
              id="email-address"
              type="email"
              autoComplete="email"
              required
              placeholder="Địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending || isGoogleLoading}
            />
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending || isGoogleLoading}
              />
              {/* [7] Button to hide/show password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || isGoogleLoading}
            >
              {isPending ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </div>
        </form>

        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>
        </div>

        <div>
          <Button
            type="button"
            className="w-full"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isPending || isGoogleLoading}
          >
            {isGoogleLoading ? "Đang chuyển hướng..." : "Đăng nhập bằng Google"}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:text-primary/90"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
