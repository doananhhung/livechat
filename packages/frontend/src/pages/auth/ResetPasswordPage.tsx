import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useResetPasswordMutation } from "../../services/authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "../../components/ui/use-toast";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
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
        title: t("common.error"),
        description: t("auth.invalidToken"),
      });
      navigate("/forgot-password");
    }
  }, [token, navigate, toast]);

  const { mutate: resetPassword, isPending } = useResetPasswordMutation({
    onSuccess: (data) => {
      setIsSuccess(true);
      toast({
        title: t("common.success"),
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
        title: t("common.error"),
        description: error.response?.data?.message || t("auth.tryAgainLater"),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.enterNewPassword"),
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.passwordMinLength"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("auth.passwordMismatch"),
      });
      return;
    }

    if (token) {
      resetPassword({ token, newPassword });
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title={t("auth.resetPasswordSuccess")}>
        <div className="space-y-6 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <p className="text-foreground">
              {t("auth.passwordResetComplete")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("auth.redirectingToLogin")}
            </p>
          </div>
          <Link to="/login">
            <Button className="w-full">{t("auth.loginNow")}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("auth.resetPassword")}
      subtitle={t("auth.enterNewPasswordForAccount")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {t("auth.newPassword")}
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.enterNewPasswordPlaceholder")}
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
            {t("auth.confirmNewPassword")}
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={t("auth.reenterNewPassword")}
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
          <p className="font-medium mb-1">{t("auth.passwordMust")}:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>{t("auth.atLeast8Chars")}</li>
            <li>{t("auth.matchConfirmPassword")}</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("auth.resetting") : t("auth.resetPassword")}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:underline"
            onClick={(e) => {
              if (isPending) e.preventDefault();
            }}
          >
            {t("auth.backToLogin")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
