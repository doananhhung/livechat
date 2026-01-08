import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resendVerificationEmail } from "../../services/authApi";
import AuthLayout from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/use-toast";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

const ResendVerificationPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: t("common.error"),
        description: t("auth.emailRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await resendVerificationEmail(email.trim());
      toast({
        title: t("common.success"),
        description: t("auth.resendSuccess"),
      });
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: t("auth.resendSuccess"), // Using the same translation key for consistency
            email: email.trim(),
          },
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("auth.resendError"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={t("auth.resendVerification")}>
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">{t("auth.resendVerification")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.resendDescription")}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("auth.sending")}
              </>
            ) : (
              t("auth.resend")
            )}
          </Button>
          <div className="text-center text-sm">
            <Link
              to="/login"
              className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResendVerificationPage;
