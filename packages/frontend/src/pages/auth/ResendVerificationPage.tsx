import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resendVerificationEmail } from "../../services/authApi";
import AuthLayout from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/use-toast";
import { Mail } from "lucide-react";

const ResendVerificationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập địa chỉ email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await resendVerificationEmail(email.trim());
      toast({
        title: "Thành công",
        description: response.message,
      });
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư.",
            email: email.trim(),
          },
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Không thể gửi lại email xác thực. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Gửi lại Email Xác Thực">
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Mail className="h-16 w-16 text-primary" />
        </div>
        <p className="text-center text-muted-foreground">
          Nhập địa chỉ email của bạn để nhận email xác thực mới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Địa chỉ email"
            required
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang gửi..." : "Gửi lại email xác thực"}
          </Button>
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary hover:text-primary/90"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResendVerificationPage;
