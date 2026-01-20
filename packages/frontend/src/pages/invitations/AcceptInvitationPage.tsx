import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { acceptInvitation } from "../../services/projectApi";
import { Button } from "../../components/ui/Button";
import AuthLayout from "../../components/layout/AuthLayout";
import { useToast } from "../../components/ui/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

const AcceptInvitationPage = () => {
  console.log(
    "🟢 [AcceptInvitationPage] COMPONENT RENDERING - This is the first line!",
  );

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const hasAccepted = useRef(false);

  console.log("🟢 [AcceptInvitationPage] After useState hooks");
  console.log("🟢 [AcceptInvitationPage] isAuthenticated:", isAuthenticated);
  console.log(
    "🟢 [AcceptInvitationPage] searchParams:",
    searchParams.toString(),
  );

  useEffect(() => {
    const token = searchParams.get("token");
    console.log("🔵 [AcceptInvitationPage] Component mounted");
    console.log("🔵 [AcceptInvitationPage] Token from URL:", token);
    console.log("🔵 [AcceptInvitationPage] Is authenticated:", isAuthenticated);

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log("User not logged in, redirecting to login with token");
      toast({
        title: t("members.accept.requireLogin"),
        description: t("members.accept.requireLoginDesc"),
      });
      // Pass token in state to preserve it through login flow
      navigate("/login", {
        state: { invitationToken: token },
        replace: true,
      });
      return;
    }

    if (!token) {
      toast({
        title: t("common.error"),
        description: t("members.accept.invalidToken"),
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Prevent double execution in React Strict Mode
    // This is CRITICAL for API calls that should only happen once
    if (hasAccepted.current) {
      console.log(
        "⚠️ [AcceptInvitationPage] Already accepted, skipping duplicate call (React Strict Mode)",
      );
      return;
    }

    hasAccepted.current = true;

    const handleAcceptInvitation = async () => {
      try {
        console.log(
          "🚀 [AcceptInvitationPage] Accepting invitation with token:",
          token,
        );
        await acceptInvitation({ token });
        console.log(
          "✅ [AcceptInvitationPage] Invitation accepted successfully!",
        );
        setStatus("success");
        toast({
          title: t("common.success"),
          description: t("members.accept.successToast"),
        });

        // Redirect to inbox after 2 seconds
        setTimeout(() => {
          console.log("🔵 [AcceptInvitationPage] Redirecting to /inbox");
          navigate("/inbox", { replace: true });
        }, 2000);
      } catch (error: any) {
        console.error(
          "❌ [AcceptInvitationPage] Failed to accept invitation:",
          error,
        );
        console.error(
          "❌ [AcceptInvitationPage] Error response:",
          error.response?.data,
        );
        setStatus("error");
        const message =
          error.response?.data?.message || t("members.accept.genericError");
        setErrorMessage(message);
        toast({
          title: t("common.error"),
          description: message,
          variant: "destructive",
        });
      }
    };

    handleAcceptInvitation();
  }, [searchParams, navigate, toast, isAuthenticated, t]);

  const isPending = status === "loading";
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <AuthLayout
      title={t("members.accept.title")}
      subtitle={
        isPending
          ? t("members.accept.processing")
          : isSuccess
            ? t("members.accept.successTitle")
            : t("members.accept.title")
      }
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {isPending && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">
                {t("members.accept.wait")}
              </p>
            </div>
          )}

          {isSuccess && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  {t("members.accept.successTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("members.accept.redirecting")}
                </p>
              </div>
            </>
          )}

          {isError && (
            <>
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-destructive">
                  {t("members.accept.failTitle")}
                </h3>
                <p className="text-muted-foreground">{errorMessage}</p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    {t("members.accept.home")}
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    {t("members.accept.retry")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default AcceptInvitationPage;
