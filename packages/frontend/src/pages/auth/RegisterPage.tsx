import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRegisterMutation } from "../../services/authApi";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import AuthLayout from "../../components/layout/AuthLayout";
import { useToast } from "../../components/ui/use-toast";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import {
  getInvitationDetails,
  acceptInvitation,
} from "../../services/projectApi";
import { ProjectRole } from "@live-chat/shared-types";
import type { InvitationResponseDto } from "@live-chat/shared-dtos";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginAction = useAuthStore((state) => state.login);
  const { toast } = useToast();

  // Invitation-related state
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationResponseDto | null>(
    null,
  );
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  useEffect(() => {
    const token = searchParams.get("invitation_token");

    // CRITICAL: If user is already authenticated and has an invitation token,
    // redirect to accept invitation page IMMEDIATELY
    if (isAuthenticated && token) {
      console.log(
        "[RegisterPage] User already authenticated with invitation token, redirecting to accept-invitation",
      );
      navigate(`/accept-invitation?token=${token}`, { replace: true });
      return;
    }

    // Otherwise, redirect authenticated users without invitation to inbox
    if (isAuthenticated && !token) {
      console.log(
        "[RegisterPage] User already authenticated without invitation, redirecting to inbox",
      );
      navigate("/inbox", { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Load invitation details if token is present
  useEffect(() => {
    const token = searchParams.get("invitation_token");
    if (token) {
      setInvitationToken(token);
      setLoadingInvitation(true);

      getInvitationDetails(token)
        .then((invitationData) => {
          setInvitation(invitationData);
          setEmail(invitationData.email); // Pre-fill email
        })
        .catch((error) => {
          console.error("Error loading invitation:", error);
          toast({
            title: t("common.error"),
            description: t("auth.invitationLoadError"),
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoadingInvitation(false);
        });
    }
  }, [searchParams, toast]);

  const { mutate: register, isPending } = useRegisterMutation({
    onSuccess: async (data) => {
      // For invitation registration, show special message
      if (invitationToken) {
        toast({
          title: t("auth.registerSuccess"),
          description: t("auth.registerSuccessInvitation"),
        });
      }

      // Redirect to login page with pre-filled email
      navigate("/login", {
        state: {
          message: data.message,
          email: email.trim(),
          invitationToken: invitationToken, // Pass token to login page
        },
      });
    },
    onError: (error: any) => {
      console.error("Registration error:", error);

      let errorMessage = "An error occurred during registration.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === "NETWORK_ERROR" || !error.response) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      }

      toast({
        title: t("auth.registerFailed"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // [2] State for password confirmation
  const [showPassword, setShowPassword] = useState(false); // [3] State to hide/show password

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.fillAll"),
        variant: "destructive",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({
        title: t("common.error"),
        description: t("auth.invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordMin"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    console.log("🔵 [RegisterPage] Submitting registration with:");
    console.log("  - Email:", email.trim());
    console.log("  - Has invitationToken:", !!invitationToken);
    console.log("  - InvitationToken value:", invitationToken);

    register({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      invitationToken: invitationToken || undefined, // Pass invitation token if present
    });
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>{t("auth.loadingInvitation")}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title={t("auth.createAccount")}
      subtitle={t("auth.startJourney")}
    >
      {invitation && (
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-semibold text-primary">
              {t("auth.hasInvitation")}
            </span>
          </div>
          <p className="text-sm">
            {t("auth.role")}:{" "}
            <span className="font-bold">
              {invitation.role === ProjectRole.AGENT
                ? t("common.agent")
                : t("common.manager")}
            </span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {t("auth.fullName")}
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder={t("auth.fullNamePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isPending}
            className="h-11"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isPending || !!invitation}
            readOnly={!!invitation}
            className={`h-11 ${invitation ? "bg-muted/50" : ""}`}
          />
          {invitation && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("auth.emailFromInvite")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {t("auth.password")}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isPending}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("auth.minChars", { count: 8 })}
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {t("auth.confirmPassword")}
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isPending}
              className="h-11 pr-10"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isPending}>
          {isPending ? t("auth.creatingAccount") : t("auth.createAccountBtn")}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              {t("auth.or")}
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary/90 transition-colors"
          >
            {t("auth.loginNow")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
