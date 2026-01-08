import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../services/authApi";
import AuthLayout from "../../components/layout/AuthLayout";
import { Spinner } from "../../components/ui/Spinner";
import { Button } from "../../components/ui/Button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

type VerificationStatus = "loading" | "success" | "error";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("");
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(t("auth.verify.invalidToken"));
      return;
    }

    const verify = async () => {
      try {
        console.log(
          "🔵 [VerifyEmailPage] Starting email verification with token:",
          token
        );
        const response = await verifyEmail(token);
        console.log("🔵 [VerifyEmailPage] Verification response:", response);
        setStatus("success");
        setMessage(response.message || t("auth.verify.successMsg"));

        // Check if there's a pending invitation
        if (response.invitationToken) {
          console.log(
            "🎉 [VerifyEmailPage] User has pending invitation:",
            response.invitationToken
          );
          setInvitationToken(response.invitationToken);
          toast({
            title: t("auth.verify.success"),
            description: t("auth.verify.successMsg"),
          });
        } else {
          console.log(
            "ℹ️ [VerifyEmailPage] No pending invitation found for this user. Auto redirecting to login."
          );
          // Auto redirect to login if no invitation
          setTimeout(() => {
            navigate("/login");
          }, 3000);
          setMessage(t("auth.verify.successMsgNoInvite"));
          toast({
            title: t("auth.verify.success"),
            description: t("auth.verify.successMsgNoInvite"),
          });
        }
      } catch (error: any) {
        console.error("❌ [VerifyEmailPage] Verification failed:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message || t("auth.verify.failMsg")
        );
        toast({
          title: t("auth.verify.failed"),
          description:
            error.response?.data?.message || t("auth.verify.failMsg"),
          variant: "destructive",
        });
      }
    };

    verify();
  }, [searchParams, navigate, t]);

  return (
    <AuthLayout title={t("auth.verify.title")}>
      <div className="space-y-6 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <h1 className="text-2xl font-bold text-center">
              {t("auth.verify.title")}
            </h1>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("auth.verify.verifying")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-green-600">
                {t("auth.verify.successTitle")}
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </div>
            
            <div className="space-y-4">
              {invitationToken && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 text-sm text-center">
                  <p className="font-semibold">{t("auth.verify.hasInvitation")}</p>
                  <p>{t("auth.verify.invitationRedirect")}</p>
                </div>
              )}

              <Button 
                onClick={() => navigate(invitationToken ? `/login?invitationToken=${invitationToken}` : "/login")} 
                className="w-full"
              >
                {t("auth.loginNow")}
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-red-600">
                {t("auth.verify.failed")}
              </h2>
              <p className="text-red-500">{message}</p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
                {t("auth.backToLogin")}
              </Button>
              <div className="text-center">
                <Link
                  to="/register"
                  className="text-sm text-primary hover:underline"
                >
                  {t("auth.registerNew")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
