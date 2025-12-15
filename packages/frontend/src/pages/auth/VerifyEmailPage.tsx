import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../services/authApi";
import AuthLayout from "../../components/layout/AuthLayout";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { CheckCircle, XCircle } from "lucide-react";

type VerificationStatus = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasVerified.current) {
      return;
    }

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token xác thực không hợp lệ.");
      return;
    }

    const verify = async () => {
      try {
        hasVerified.current = true;
        console.log(
          "🔵 [VerifyEmailPage] Starting email verification with token:",
          token
        );
        const response = await verifyEmail(token);
        console.log("🔵 [VerifyEmailPage] Verification response:", response);
        setStatus("success");
        setMessage(response.message || "Xác thực email thành công!");

        // Check if there's a pending invitation
        if (response.invitationToken) {
          console.log(
            "🎉 [VerifyEmailPage] User has pending invitation:",
            response.invitationToken
          );
          setInvitationToken(response.invitationToken);
        } else {
          console.log(
            "ℹ️ [VerifyEmailPage] No pending invitation found for this user"
          );
        }
      } catch (error: any) {
        console.error("❌ [VerifyEmailPage] Verification failed:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Xác thực email thất bại. Token có thể đã hết hạn hoặc không hợp lệ."
        );
      }
    };

    verify();
  }, [searchParams]);

  const handleNavigateToLogin = () => {
    if (invitationToken) {
      console.log(
        "🔵 [VerifyEmailPage] Navigating to login with invitation token:",
        invitationToken
      );
      // If user has pending invitation, redirect to login with invitation token
      navigate("/login", {
        state: {
          message:
            "Email đã được xác thực thành công. Vui lòng đăng nhập để tham gia dự án.",
          invitationToken: invitationToken,
        },
      });
    } else {
      console.log(
        "🔵 [VerifyEmailPage] Navigating to login without invitation token"
      );
      navigate("/login", {
        state: {
          message:
            status === "success"
              ? "Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ."
              : undefined,
        },
      });
    }
  };

  return (
    <AuthLayout title="Xác thực Email">
      <div className="space-y-6 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <Spinner />
            <p className="text-muted-foreground">
              Đang xác thực email của bạn...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Xác thực thành công! 🎉
              </h2>
              <p className="text-muted-foreground">{message}</p>
              {invitationToken && (
                <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                  <p className="font-medium">
                    🎉 Bạn có lời mời tham gia dự án đang chờ!
                  </p>
                  <p className="mt-1 text-xs">
                    Sau khi đăng nhập, bạn sẽ được chuyển đến trang chấp nhận
                    lời mời.
                  </p>
                </div>
              )}
            </div>
            <Button onClick={handleNavigateToLogin} className="w-full">
              Đăng nhập ngay
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Xác thực thất bại
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <div className="space-y-2 w-full">
              <Button onClick={handleNavigateToLogin} className="w-full">
                Quay lại đăng nhập
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/register")}
                className="w-full"
              >
                Đăng ký tài khoản mới
              </Button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
