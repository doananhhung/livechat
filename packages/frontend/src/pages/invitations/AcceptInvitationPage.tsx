import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptInvitation } from "../../services/projectApi";
import { Button } from "../../components/ui/Button";
import AuthLayout from "../../components/layout/AuthLayout";
import { useToast } from "../../components/ui/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

const AcceptInvitationPage = () => {
  console.log(
    "🟢 [AcceptInvitationPage] COMPONENT RENDERING - This is the first line!"
  );

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasAccepted = useRef(false);

  console.log("🟢 [AcceptInvitationPage] After useState hooks");
  console.log("🟢 [AcceptInvitationPage] isAuthenticated:", isAuthenticated);
  console.log(
    "🟢 [AcceptInvitationPage] searchParams:",
    searchParams.toString()
  );

  useEffect(() => {
    const token = searchParams.get("token");
    console.log("🔵 [AcceptInvitationPage] Component mounted");
    console.log("🔵 [AcceptInvitationPage] Token from URL:", token);
    console.log("🔵 [AcceptInvitationPage] Is authenticated:", isAuthenticated);

    // Check if user is authenticated
    if (!isAuthenticated) {
      if (!token) {
        console.error("❌ [AcceptInvitationPage] No token provided");
        setStatus("error");
        setErrorMessage("Token không hợp lệ. Vui lòng kiểm tra lại liên kết.");
        return;
      }

      console.log(
        "⚠️ [AcceptInvitationPage] User not authenticated, redirecting to login"
      );
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để chấp nhận lời mời.",
        variant: "default",
      });
      // Redirect to login with return URL
      navigate(`/login?redirect=/accept-invitation?token=${token}`, {
        replace: true,
      });
      return;
    }

    if (!token) {
      console.error(
        "❌ [AcceptInvitationPage] No token in URL despite being authenticated"
      );
      setStatus("error");
      setErrorMessage("Token không hợp lệ. Vui lòng kiểm tra lại liên kết.");
      return;
    }

    // Prevent double execution in React Strict Mode
    // This is CRITICAL for API calls that should only happen once
    if (hasAccepted.current) {
      console.log(
        "⚠️ [AcceptInvitationPage] Already accepted, skipping duplicate call (React Strict Mode)"
      );
      return;
    }

    hasAccepted.current = true;

    const handleAcceptInvitation = async () => {
      try {
        console.log(
          "🚀 [AcceptInvitationPage] Accepting invitation with token:",
          token
        );
        await acceptInvitation(token);
        console.log(
          "✅ [AcceptInvitationPage] Invitation accepted successfully!"
        );
        setStatus("success");
        toast({
          title: "Thành công",
          description: "Bạn đã tham gia dự án thành công!",
        });

        // Redirect to inbox after 2 seconds
        setTimeout(() => {
          console.log("🔵 [AcceptInvitationPage] Redirecting to /inbox");
          navigate("/inbox", { replace: true });
        }, 2000);
      } catch (error: any) {
        console.error(
          "❌ [AcceptInvitationPage] Failed to accept invitation:",
          error
        );
        console.error(
          "❌ [AcceptInvitationPage] Error response:",
          error.response?.data
        );
        setStatus("error");
        const message =
          error.response?.data?.message ||
          "Không thể chấp nhận lời mời. Vui lòng thử lại sau.";
        setErrorMessage(message);
        toast({
          title: "Lỗi",
          description: message,
          variant: "destructive",
        });
      }
    };

    handleAcceptInvitation();
  }, [searchParams, navigate, toast, isAuthenticated]);

  return (
    <AuthLayout title="Chấp nhận lời mời">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Đang xử lý...</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Vui lòng đợi trong giây lát
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  Chấp nhận thành công!
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Bạn đã tham gia dự án. Đang chuyển hướng...
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-700">
                  Chấp nhận thất bại
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => navigate("/inbox")}>
                  Về trang chủ
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default AcceptInvitationPage;
