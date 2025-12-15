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
    <AuthLayout title="Đăng ký tài khoản mới">
      {/* Show invitation info if present */}
      {loadingInvitation && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-md bg-blue-50 p-3 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Đang tải thông tin lời mời...</span>
        </div>
      )}

      {invitation && (
        <div className="mb-4 rounded-md bg-blue-50 p-4 text-blue-700">
          <p className="text-sm font-medium">
            🎉 Bạn đang đăng ký để tham gia dự án:{" "}
            <span className="font-bold">{invitation.project?.name}</span>
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Vai trò: {invitation.role === "AGENT" ? "Agent" : invitation.role}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tên đầy đủ"
          required
          disabled={isPending}
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Địa chỉ email"
          required
          disabled={isPending || !!invitation} // Disable if invitation present
          readOnly={!!invitation} // Make read-only if invitation present
          className={invitation ? "bg-gray-100 text-gray-900" : ""}
        />

        {/* [5] Wrap password Input in a div to place icon */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"} // [6] Dynamic type change
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 8 ký tự)"
            required
            disabled={isPending}
            className="pr-10" // Add padding so the icon doesn't overlap the text
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

        {/* [8] New input for password confirmation */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu"
            required
            disabled={isPending}
            className="pr-10"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Đang xử lý..." : "Tạo tài khoản"}
        </Button>
        <div className="text-center text-sm">
          <p>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
