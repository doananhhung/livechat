import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForgotPasswordMutation } from "../../services/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
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
        title: data.isOAuthUser ? t("auth.googleAccount") : t("auth.emailSent"),
        description: data.message,
        variant: data.isOAuthUser ? "default" : "default",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description:
          error.response?.data?.message || t("auth.tryAgainLater"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.enterEmail"),
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
      <AuthLayout title={t("auth.googleOAuthAccount")}>
        <div className="space-y-6">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {t("auth.googleLoginAccount")}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t("auth.googleNoPasswordReset", { email })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t("auth.toLoginToAccount")}:
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
              {t("auth.loginWithGoogle")}
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
              {t("auth.tryOtherEmail")}
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLogin")}
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
        title={t("auth.checkEmail")}
        subtitle={t("auth.resetInstructionsSent")}
      >
        <div className="space-y-6">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <Mail className="mx-auto h-12 w-12 text-primary mb-3" />
            <p className="text-sm text-foreground">
              {t("auth.ifEmailExists", { email })}
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{t("auth.noEmailReceived")}</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>{t("auth.checkSpam")}</li>
              <li>{t("auth.checkEmailCorrect")}</li>
              <li>{t("auth.waitAndCheck")}</li>
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
              {t("auth.tryOtherEmail")}
            </Button>

            <Link to="/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.backToLogin")}
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
      title={t("auth.forgotPassword")}
      subtitle={t("auth.enterEmailForReset")}
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
          {isPending ? t("auth.sending") : t("auth.sendResetInstructions")}
        </Button>

        <Link to="/login">
          <Button variant="ghost" className="w-full" disabled={isPending}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("auth.backToLogin")}
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
