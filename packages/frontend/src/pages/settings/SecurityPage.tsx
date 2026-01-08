// src/pages/settings/SecurityPage.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import { useToast } from "../../components/ui/use-toast";
import { PinInput } from "../../components/ui/PinInput";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Download,
  Copy,
  Shield,
  Lock,
  Mail,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  useGenerate2faMutation,
  useTurnOn2faMutation,
  useDisable2faMutation,
  useChangePasswordMutation,
  useSetPasswordMutation,
  useRequestEmailChangeMutation,
  usePendingEmailChangeQuery,
  useCancelEmailChangeMutation,
  useLinkedAccountsQuery,
  useInitiateLinkGoogleMutation,
  useUnlinkOAuthAccountMutation,
} from "../../services/settingsApi";

// ========================================================================
// PASSWORD STRENGTH INDICATOR
// ========================================================================
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength;
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const { t } = useTranslation();
  const strength = getPasswordStrength(password);

  const requirements = [
    { label: t("security.passwordStrength.minChars"), met: password.length >= 8 },
    {
      label: t("security.passwordStrength.mixedCase"),
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: t("security.passwordStrength.number"), met: /\d/.test(password) },
    { label: t("security.passwordStrength.specialChar"), met: /[^a-zA-Z\d]/.test(password) },
  ];

  const strengthColors = [
    "bg-destructive",
    "bg-warning",
    "bg-warning",
    "bg-success",
    "bg-success",
  ];
  const strengthLabels = [
    t("security.passwordStrength.veryWeak"),
    t("security.passwordStrength.weak"),
    t("security.passwordStrength.medium"),
    t("security.passwordStrength.strong"),
    t("security.passwordStrength.veryStrong"),
  ];

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength ? strengthColors[strength - 1] : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          {strengthLabels[strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={req.met ? "text-foreground" : "text-muted-foreground"}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================================================================
// SECTION 1: TWO-FACTOR AUTHENTICATION
// 2FA Logic and JSX are placed here, kept 100% as is
// ========================================================================
const TwoFactorAuthSection = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const [isSetupDialogOpen, setSetupDialogOpen] = useState(false);
  const [isRecoveryCodesDialogOpen, setRecoveryCodesDialogOpen] =
    useState(false);
  const [qrCode, setQrCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [confirmSavedCodes, setConfirmSavedCodes] = useState(false);
  const [isDisableDialogOpen, setDisableDialogOpen] = useState(false);
  const [code, setCode] = useState("");

  const generate2FAMutation = useGenerate2faMutation();
  const turnOn2FAMutation = useTurnOn2faMutation();
  const disable2FAMutation = useDisable2faMutation();

  const handleGenerate2FA = () => {
    generate2FAMutation.mutate(undefined, {
      onSuccess: (data) => {
        setQrCode(data.qrCodeDataURL);
        setSetupDialogOpen(true);
      },
      onError: (error) => {
        console.error("Failed to generate 2FA secret:", error);
        toast({
          title: t("common.error"),
          description: t("security.2fa.error"), // Using generic error or specific one implies creation fail
          variant: "destructive",
        });
      },
    });
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode) {
      turnOn2FAMutation.mutate(twoFactorCode, {
        onSuccess: (data) => {
          setRecoveryCodes(data.recoveryCodes);
          setSetupDialogOpen(false);
          setRecoveryCodesDialogOpen(true);
          if (user) {
            setUser({ ...user, isTwoFactorAuthenticationEnabled: true });
          }
          toast({
            title: t("common.success"),
            description: t("security.2fa.enabledSuccess"),
          });
        },
        onError: (error) => {
          console.error("Failed to turn on 2FA:", error);
          toast({
            title: t("common.error"),
            description: t("security.2fa.error"),
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDisable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      disable2FAMutation.mutate(code, {
        onSuccess: () => {
          if (user) {
            setUser({ ...user, isTwoFactorAuthenticationEnabled: false });
          }
          setDisableDialogOpen(false);
          setCode("");
          toast({
            title: t("common.success"),
            description: t("security.2fa.disabledSuccess"),
          });
        },
        onError: (error) => {
          console.error("Failed to disable 2FA:", error);
          toast({
            title: t("common.error"),
            description: t("security.2fa.error"),
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDownloadRecoveryCodes = () => {
    const text = recoveryCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recovery-codes-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">{t("security.2fa.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("security.2fa.description")}
          </p>
        </div>
      </div>
      <div className="p-4 border rounded-lg max-w-md bg-card">
        {user?.isTwoFactorAuthenticationEnabled ? (
          <div className="flex items-center justify-between">
            <p className="text-sm">{t("security.2fa.enabled")}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDisableDialogOpen(true)}
            >
              {t("security.2fa.disableBtn")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm">{t("security.2fa.disabled")}</p>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate2FA}
              disabled={generate2FAMutation.isPending}
            >
              {generate2FAMutation.isPending ? t("security.2fa.generating") : t("security.2fa.enableBtn")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isSetupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("security.2fa.setupTitle")}</DialogTitle>
            <DialogDescription>
              {t("security.2fa.setupDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            {qrCode ? (
              <img src={qrCode} alt="2FA QR Code" />
            ) : (
              <p>{t("common.loading")}</p>
            )}
          </div>
          <form onSubmit={handleVerify2FA}>
            <PinInput
              length={6}
              onComplete={(value) => {
                setTwoFactorCode(value);
              }}
            />
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={turnOn2FAMutation.isPending}>
                {turnOn2FAMutation.isPending
                  ? t("security.2fa.verifying")
                  : t("security.2fa.verifyAndEnable")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRecoveryCodesDialogOpen}
        onOpenChange={setRecoveryCodesDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("security.2fa.recoveryTitle")}</DialogTitle>
            <DialogDescription>
              {t("security.2fa.recoveryDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 p-4 bg-muted rounded-md">
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="confirm-saved"
              checked={confirmSavedCodes}
              onChange={(e) => setConfirmSavedCodes(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="confirm-saved" className="text-sm">
              {t("security.2fa.iSaved")}
            </label>
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRecoveryCodes}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("security.2fa.download")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(recoveryCodes.join("\n"));
                toast({
                  title: t("toast.copied"),
                  description: t("toast.snippetCopied"), // Using reusable key
                });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              {t("project.list.copySnippet").split(' ')[0]} 
            </Button>
            <Button
              onClick={() => setRecoveryCodesDialogOpen(false)}
              disabled={!confirmSavedCodes}
              size="sm"
            >
              {t("security.2fa.savedClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("security.2fa.disableTitle")}</DialogTitle>
            <DialogDescription>
              {t("security.2fa.disableDesc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable2FA}>
            <PinInput
              length={6}
              onComplete={(value) => {
                setCode(value);
              }}
            />
            <DialogFooter className="mt-4">
              <Button
                type="submit"
                variant="destructive"
                disabled={disable2FAMutation.isPending}
              >
                {disable2FAMutation.isPending ? t("security.2fa.disabling") : t("security.2fa.disableConfirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ========================================================================
// SECTION 2: CHANGE PASSWORD
// New component for changing password
// ========================================================================
const ChangePasswordForm = () => {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const hasPassword = user?.hasPassword ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();
  const { toast } = useToast();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const changePasswordMutation = useChangePasswordMutation();
  const setPasswordMutation = useSetPasswordMutation();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch("newPassword", "");

  const onSubmit = (data: any) => {
    // If user has password, use change password endpoint
    if (hasPassword) {
      changePasswordMutation.mutate(
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        {
          onSuccess: (data) => {
            if (data.accessToken) {
              setAccessToken(data.accessToken);
            }
            toast({
              title: t("common.success"),
              description:
                data.message ||
                t("security.password.successChange"),
            });
            reset();
          },
          onError: (error: any) => {
            toast({
              title: t("common.error"),
              description:
                error.response?.data?.message || t("settings.updateError"),
              variant: "destructive",
            });
          },
        }
      );
    }
    // If user doesn't have password (OAuth account), use set password endpoint
    else {
      setPasswordMutation.mutate(
        { newPassword: data.newPassword },
        {
          onSuccess: (data) => {
            if (data.accessToken) {
              setAccessToken(data.accessToken);
            }
            toast({
              title: t("common.success"),
              description: data.message || t("security.password.successSet"),
            });
            reset();
            // Refresh user data to update hasPassword status
            window.location.reload();
          },
          onError: (error: any) => {
            toast({
              title: t("common.error"),
              description:
                error.response?.data?.message || t("settings.updateError"),
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const isLoading =
    changePasswordMutation.isPending || setPasswordMutation.isPending;

  return (
    <div className="pt-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 p-2 rounded-lg bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">
            {hasPassword ? t("security.password.changeTitle") : t("security.password.getTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasPassword
              ? t("security.password.changeDesc")
              : t("security.password.getDesc")}
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mt-4 p-6 border rounded-lg bg-card"
      >
        {hasPassword && (
          <div>
            <label
              className="block text-sm font-medium text-foreground mb-2"
              htmlFor="currentPassword"
            >
              {t("security.password.current")}
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                {...register("currentPassword", {
                  required: hasPassword
                    ? t("security.password.currentRequired")
                    : false,
                })}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentPassword.message as string}
              </p>
            )}
          </div>
        )}
        <div>
          <label
            className="block text-sm font-medium text-foreground mb-2"
            htmlFor="newPassword"
          >
            {t("security.password.new")}
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword", {
                required: t("security.password.newRequired"),
                minLength: {
                  value: 8,
                  message: t("auth.passwordMinLength"),
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <PasswordStrengthIndicator password={newPassword} />
          {errors.newPassword && (
            <p className="text-xs text-destructive mt-1">
              {errors.newPassword.message as string}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-foreground mb-2"
            htmlFor="confirmPassword"
          >
            {t("security.password.confirm")}
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: t("security.password.confirmRequired"),
                validate: (value) =>
                  value === watch("newPassword") || t("auth.passwordMismatch"),
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive mt-1">
              {errors.confirmPassword.message as string}
            </p>
          )}
        </div>
        <div className="pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("security.password.updating")
              : hasPassword
              ? t("security.password.updateBtn")
              : t("security.password.setBtn")}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ========================================================================
// SECTION 3: LINKED ACCOUNTS
// Component for managing linked OAuth accounts (Google, etc.)
// ========================================================================
const LinkedAccountsSection = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const { data: linkedAccounts, isLoading } = useLinkedAccountsQuery();
  const initiateLinkMutation = useInitiateLinkGoogleMutation();
  const unlinkMutation = useUnlinkOAuthAccountMutation();

  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<string | null>(null);

  const isGoogleLinked = linkedAccounts?.some(
    (account) => account.provider === "google"
  );

  const handleLinkGoogle = () => {
    initiateLinkMutation.mutate(undefined, {
      onSuccess: (data) => {
        // Redirect to Google OAuth
        window.location.href = data.redirectUrl;
      },
      onError: (error: any) => {
        toast({
          title: t("common.error"),
          description:
            error.response?.data?.message ||
            t("security.linkedAccounts.linkError"),
          variant: "destructive",
        });
      },
    });
  };

  const handleUnlinkAccount = (provider: string) => {
    setAccountToUnlink(provider);
    setIsUnlinkDialogOpen(true);
  };

  const confirmUnlink = () => {
    if (!accountToUnlink) return;

    unlinkMutation.mutate(
      { provider: accountToUnlink },
      {
        onSuccess: (data) => {
          toast({
            title: t("common.success"),
            description: data.message || t("security.linkedAccounts.unlinkSuccess"),
          });
          setIsUnlinkDialogOpen(false);
          setAccountToUnlink(null);
        },
        onError: (error: any) => {
          toast({
            title: t("common.error"),
            description:
              error.response?.data?.message || t("security.linkedAccounts.unlinkError"),
            variant: "destructive",
          });
        },
      }
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "google":
        return "Google";
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="mt-1 p-2 rounded-lg bg-primary/10">
          <LinkIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">{t("security.linkedAccounts.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("security.linkedAccounts.description")}
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        {/* Google Account */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                {getProviderIcon("google")}
              </div>
              <div>
                <p className="font-medium">Google</p>
                {isGoogleLinked ? (
                  <p className="text-xs text-muted-foreground">{t("security.linkedAccounts.linked")}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("security.linkedAccounts.notLinked")}</p>
                )}
              </div>
            </div>
            {isGoogleLinked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlinkAccount("google")}
                disabled={unlinkMutation.isPending}
              >
                <Unlink className="h-4 w-4 mr-2" />
                {t("security.linkedAccounts.unlink")}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleLinkGoogle}
                disabled={initiateLinkMutation.isPending}
              >
                {initiateLinkMutation.isPending ? (
                  t("security.linkedAccounts.linking")
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("security.linkedAccounts.link")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* List of linked accounts */}
        {isLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
      </div>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("security.linkedAccounts.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {!user?.hasPassword ? (
                <>
                  <p className="mb-2">
                    <strong>{t("security.linkedAccounts.warningNoPassword")}</strong>
                  </p>
                  <p>
                    {t("security.linkedAccounts.setPwdMessage", { provider: accountToUnlink ? getProviderName(accountToUnlink) : "" })}
                  </p>
                </>
              ) : (
                <>
                  {t("security.linkedAccounts.confirmMessage", { provider: accountToUnlink ? getProviderName(accountToUnlink) : "" })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnlinkDialogOpen(false)}
            >
              {t("security.linkedAccounts.cancel")}
            </Button>
            {user?.hasPassword && (
              <Button
                variant="destructive"
                onClick={confirmUnlink}
                disabled={unlinkMutation.isPending}
              >
                {unlinkMutation.isPending ? t("security.linkedAccounts.unlinking") : t("security.linkedAccounts.confirm")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ========================================================================
// SECTION 4: CHANGE EMAIL
// Component for changing email address
// ========================================================================
const ChangeEmailForm = () => {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const hasPassword = user?.hasPassword ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const { toast } = useToast();
  const requestEmailChangeMutation = useRequestEmailChangeMutation();
  const { data: pendingEmailChange, isLoading: isPendingLoading } =
    usePendingEmailChangeQuery();
  const cancelEmailChangeMutation = useCancelEmailChangeMutation();

  const handleCancelEmailChange = () => {
    cancelEmailChangeMutation.mutate(undefined, {
      onSuccess: (response) => {
        toast({
          title: t("security.email.cancelSuccess"),
          description:
            response.message || t("security.email.cancelSuccessDesc"),
        });
      },
      onError: (error: any) => {
        toast({
          title: t("common.error"),
          description:
            error.response?.data?.message || t("security.email.cancelError"),
          variant: "destructive",
        });
      },
    });
  };

  const onSubmit = (data: any) => {
    requestEmailChangeMutation.mutate(
      { newEmail: data.newEmail, password: data.password },
      {
        onSuccess: (response) => {
          const description = response.warning
            ? `${response.warning}\n\n${t("security.email.successDesc", { email: data.newEmail })}`
            : t("security.email.successDesc", { email: data.newEmail });

          toast({
            title: t("security.email.successTitle"),
            description,
          });
          reset();
        },
        onError: (error: any) => {
          toast({
            title: t("common.error"),
            description:
              error.response?.data?.message ||
              t("security.email.requestError"),
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="pt-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 p-2 rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">{t("security.email.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("security.email.current")} <strong>{user?.email}</strong>.
          </p>
        </div>
      </div>

      {/* Pending Email Change Alert */}
      {isPendingLoading ? (
        <div className="max-w-md mt-4 p-4 border rounded-lg bg-card animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      ) : pendingEmailChange ? (
        <div className="max-w-md mt-4 p-6 border rounded-lg bg-card border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                {t("security.email.pendingRequest")}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t("security.email.pendingDesc", { email: pendingEmailChange.newEmail })}
              </p>
              <div className="text-xs text-muted-foreground mb-4">
                <p>
                  ⏰ {t("security.email.expiresAt")}{" "}
                  {new Date(pendingEmailChange.expiresAt).toLocaleString(
                    // Using undefined locale/options for default browser behavior or specific if needed
                    // But to keep it simple and localized by dateUtils might be better, but staying consistent:
                    undefined, 
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEmailChange}
                disabled={cancelEmailChangeMutation.isPending}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {cancelEmailChangeMutation.isPending
                  ? t("security.email.cancelling")
                  : t("security.email.cancelBtn")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!hasPassword ? (
        // Show warning if user doesn't have password (OAuth account)
        <div className="max-w-md mt-4 p-6 border rounded-lg bg-card">
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <Shield className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-2">
                {t("security.email.noPwdTitle")}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                 {t("security.email.noPwdDesc")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("security.email.noPwdAction")}
              </p>
            </div>
          </div>
        </div>
      ) : pendingEmailChange ? (
        // Disable form if there's a pending request
        <div className="max-w-md mt-4 p-6 border rounded-lg bg-card opacity-50">
          <p className="text-sm text-muted-foreground text-center">
            {t("security.email.pendingWait")}
          </p>
        </div>
      ) : (
        // Show form if user has password
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-w-md mt-4 p-6 border rounded-lg bg-card"
        >
          <div>
            <label
              className="block text-sm font-medium text-foreground mb-2"
              htmlFor="newEmail"
            >
              {t("security.email.newEmail")}
            </label>
            <Input
              id="newEmail"
              type="email"
              {...register("newEmail", { required: t("security.email.newEmailRequired") })}
            />
            {errors.newEmail && (
              <p className="text-xs text-destructive mt-1">
                {errors.newEmail.message as string}
              </p>
            )}
          </div>
          <div>
            <label
              className="block text-sm font-medium text-foreground mb-2"
              htmlFor="password"
            >
              {t("security.email.verifyPwd")}
            </label>
            <Input
              id="password"
              type="password"
              {...register("password", {
                required: t("security.email.pwdRequired"),
              })}
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">
                {errors.password.message as string}
              </p>
            )}
          </div>
          <Button type="submit" disabled={requestEmailChangeMutation.isPending}>
            {requestEmailChangeMutation.isPending
              ? t("security.email.sending")
              : t("security.email.submitBtn")}
          </Button>
        </form>
      )}
    </div>
  );
};

// ========================================================================
// MAIN COMPONENT: Orchestrates all sections
// ========================================================================
export const SecurityPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  // Handle redirect from Google OAuth linking
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("linkSuccess")) {
      toast({
        title: t("common.success"),
        description: t("security.linkSuccess"),
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (urlParams.get("linkError")) {
      const error = urlParams.get("linkError");
      toast({
        title: t("common.error"),
        description: decodeURIComponent(
          error || t("security.genericLinkError")
        ),
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast, t]);

  return (
    <div className="space-y-6">
      <TwoFactorAuthSection />

      <hr className="my-6" />

      <ChangePasswordForm />

      <hr className="my-6" />

      <LinkedAccountsSection />

      <hr className="my-6" />

      <ChangeEmailForm />
    </div>
  );
};
