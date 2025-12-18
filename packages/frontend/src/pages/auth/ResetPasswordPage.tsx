import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useResetPasswordMutation } from "../../services/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Token không hợp lệ. Vui lòng thử lại.",
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast]);

  const { mutate: resetPassword, isPending } = useResetPasswordMutation({
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: "Thành công",
        description: data.message,
      });
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Đã xảy ra lỗi. Vui lòng thử lại sau.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập mật khẩu mới.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 8 ký tự.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp.",
      });
      return;
    }

    if (token) {
      resetPassword({ token, newPassword });
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Đặt lại mật khẩu thành công">
        <div className="space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <p className="text-foreground">
              Mật khẩu của bạn đã được đặt lại thành công!
            </p>
            <p className="text-sm text-muted-foreground">
              Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...
            </p>
          </div>
          <Link to="/login">
            <Button className="w-full">Đăng nhập ngay</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isPending}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isPending}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Mật khẩu phải:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Có ít nhất 8 ký tự</li>
            <li>Khớp với mật khẩu xác nhận</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline"
            onClick={(e) => {
              if (isPending) e.preventDefault();
            }}
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
