import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../../services/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation({
    onSuccess: (data) => {
      setIsSubmitted(true);
      if (data.isOAuthUser) {
        setIsOAuthUser(true);
      }
      toast({
        title: data.isOAuthUser ? "Tài khoản Google" : "Email đã được gửi",
        description: data.message,
        variant: data.isOAuthUser ? "default" : "default",
      });
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

    if (!email) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập địa chỉ email.",
      });
      return;
    }

    forgotPassword(email);
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  // OAuth User Screen
  if (isSubmitted && isOAuthUser) {
    return (
      <AuthLayout title="Tài khoản Google OAuth">
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Tài khoản này được đăng nhập bằng Google
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Email <strong>{email}</strong> được liên kết với tài khoản
                  Google. Bạn không thể đặt lại mật khẩu vì tài khoản này không
                  sử dụng mật khẩu.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Để đăng nhập vào tài khoản của bạn:
            </p>
            <Button onClick={handleGoogleLogin} className="w-full" size="lg">
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Đăng nhập bằng Google
            </Button>

            <Button
              onClick={() => {
                setIsSubmitted(false);
                setIsOAuthUser(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Thử email khác
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Regular Success Screen (Email sent)
  if (isSubmitted) {
    return (
      <AuthLayout
        title="Kiểm tra email của bạn"
        subtitle="Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn"
      >
        <div className="space-y-6">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <Mail className="mx-auto h-12 w-12 text-primary mb-3" />
            <p className="text-sm text-foreground">
              Nếu email <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ
              nhận được email hướng dẫn đặt lại mật khẩu trong vài phút.
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Không nhận được email?</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Kiểm tra thư mục spam hoặc rác</li>
              <li>Đảm bảo bạn đã nhập đúng địa chỉ email</li>
              <li>Đợi vài phút và kiểm tra lại</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Thử email khác
            </Button>

            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Forgot Password Form
  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Đang gửi..." : "Gửi hướng dẫn đặt lại mật khẩu"}
        </Button>

        <Link to="/login">
          <Button variant="ghost" className="w-full" disabled={isPending}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đăng nhập
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
