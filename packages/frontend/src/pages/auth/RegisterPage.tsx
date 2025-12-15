import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../../services/authApi";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { useToast } from "../../components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginAction = useAuthStore((state) => state.login);
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { mutate: register, isPending } = useRegisterMutation({
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: "Tạo tài khoản thành công!",
      });
      loginAction(data.user, data.accessToken);
      navigate("/dashboard"); // Redirect directly to dashboard
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

    register({ fullName: fullName.trim(), email: email.trim(), password });
  };

  return (
    <AuthLayout title="Đăng ký tài khoản mới">
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
          disabled={isPending}
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
