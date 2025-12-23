
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useRegisterMutation } from "../../services/authApi";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { useToast } from "../../components/ui/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  getInvitationDetails,
  acceptInvitation,
  type InvitationWithProject,
} from "../../services/projectApi";
import { ProjectRole } from "@live-chat/shared-types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginAction = useAuthStore((state) => state.login);
  const { toast } = useToast();

  // Invitation-related state
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationWithProject | null>(
    null
  );
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  useEffect(() => {
    const token = searchParams.get("invitation_token");

    // CRITICAL: If user is already authenticated and has an invitation token,
    // redirect to accept invitation page IMMEDIATELY
    if (isAuthenticated && token) {
      console.log(
        "[RegisterPage] User already authenticated with invitation token, redirecting to accept-invitation"
      );
      navigate(`/accept-invitation?token=${token}`, { replace: true });
      return;
    }

    // Otherwise, redirect authenticated users without invitation to inbox
    if (isAuthenticated && !token) {
      console.log(
        "[RegisterPage] User already authenticated without invitation, redirecting to inbox"
      );
      navigate("/inbox", { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Load invitation details if token is present
  useEffect(() => {
    const token = searchParams.get("invitation_token");
    if (token) {
      setInvitationToken(token);
      setLoadingInvitation(true);

      getInvitationDetails(token)
        .then((invitationData) => {
          setInvitation(invitationData);
          setEmail(invitationData.email); // Pre-fill email
        })
        .catch((error) => {
          console.error("Error loading invitation:", error);
          toast({
            title: "Lỗi",
            description:
              "Không thể tải thông tin lời mời. Link có thể đã hết hạn.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoadingInvitation(false);
        });
    }
  }, [searchParams, toast]);

  const { mutate: register, isPending } = useRegisterMutation({
    onSuccess: async (data) => {
      // For invitation registration, show special message
      if (invitationToken) {
        toast({
          title: "Đăng ký thành công!",
          description:
            "Vui lòng kiểm tra email để xác thực tài khoản. Sau khi xác thực, bạn có thể đăng nhập và tự động tham gia dự án.",
        });
      }

      // Redirect to login page with pre-filled email
      navigate("/login", {
        state: {
          message: data.message,
          email: email.trim(),
          invitationToken: invitationToken, // Pass token to login page
        },
      });
    },
    onError: (error: any) => {
      console.error("Registration error:", error);

      let errorMessage = "An error occurred during registration.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      }

      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // [2] State for password confirmation
  const [showPassword, setShowPassword] = useState(false); // [3] State to hide/show password

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive",
      });
      return;
    }

    // Strict Email Validation
    if (!EMAIL_REGEX.test(email.trim())) {
      toast({
        title: "Lỗi",
        description: "Địa chỉ email không hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 8 ký tự.",
        variant: "destructive",
      });
      return;
    }

    // [4] New validation: Check if passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp.",
        variant: "destructive",
      });
      return;
    }

    console.log("🔵 [RegisterPage] Submitting registration with:");
    console.log("  - Email:", email.trim());
    console.log("  - Has invitationToken:", !!invitationToken);
    console.log("  - InvitationToken value:", invitationToken);

    register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      invitationToken: invitationToken || undefined, // Pass invitation token if present
    });
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Bắt đầu hành trình của bạn với chúng tôi"
    >
      {/* Show invitation info if present */}
      {loadingInvitation && (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Đang tải thông tin lời mời...
          </span>
        </div>
      )}

      {invitation && (
        <div className="mb-5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">🎉</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Lời mời tham gia dự án
              </p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <span className="font-bold">{invitation.project?.name}</span>
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Vai trò:{" "}
                <span className="font-medium">
                  {invitation.role === ProjectRole.AGENT
                    ? "Nhân viên"
                    : "Quản lý viên"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Họ và tên
          </label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            required
            disabled={isPending}
            className="h-11"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isPending || !!invitation}
            readOnly={!!invitation}
            className={`h-11 ${invitation ? "bg-muted/50" : ""}`}
          />
          {invitation && (
            <p className="mt-1 text-xs text-muted-foreground">
              Email được lấy từ lời mời
            </p>
          )}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isPending}
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
          <p className="mt-1 text-xs text-muted-foreground">
            Tối thiểu 8 ký tự
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isPending}
              className="h-11 pr-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isPending}>
          {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              Hoặc
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary/90 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
