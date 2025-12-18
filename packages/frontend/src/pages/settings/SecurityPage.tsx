// src/pages/settings/SecurityPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
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
} from "lucide-react";
import {
  useGenerate2faMutation,
  useTurnOn2faMutation,
  useDisable2faMutation,
  useChangePasswordMutation,
  useRequestEmailChangeMutation,
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
  const strength = getPasswordStrength(password);

  const requirements = [
    { label: "Ít nhất 8 ký tự", met: password.length >= 8 },
    {
      label: "Chữ hoa và chữ thường",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "Ít nhất 1 số", met: /\d/.test(password) },
    { label: "Ít nhất 1 ký tự đặc biệt", met: /[^a-zA-Z\d]/.test(password) },
  ];

  const strengthColors = [
    "bg-destructive",
    "bg-warning",
    "bg-warning",
    "bg-success",
    "bg-success",
  ];
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

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
          title: "Lỗi",
          description: "Không thể tạo mã QR. Vui lòng thử lại.",
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
            title: "Thành công",
            description: "Xác thực hai yếu tố đã được bật.",
          });
        },
        onError: (error) => {
          console.error("Failed to turn on 2FA:", error);
          toast({
            title: "Lỗi",
            description: "Mã không chính xác. Vui lòng thử lại.",
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
            title: "Thành công",
            description: "Xác thực hai yếu tố đã được tắt.",
          });
        },
        onError: (error) => {
          console.error("Failed to disable 2FA:", error);
          toast({
            title: "Lỗi",
            description: "Mã không chính xác hoặc đã xảy ra lỗi.",
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
          <h3 className="text-lg font-medium">Xác thực hai yếu tố</h3>
          <p className="text-sm text-muted-foreground">
            Thêm một lớp bảo mật bổ sung cho tài khoản của bạn.
          </p>
        </div>
      </div>
      <div className="p-4 border rounded-lg max-w-md bg-card">
        {user?.isTwoFactorAuthenticationEnabled ? (
          <div className="flex items-center justify-between">
            <p className="text-sm">Xác thực hai yếu tố đã được bật</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDisableDialogOpen(true)}
            >
              Tắt 2FA
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm">Xác thực hai yếu tố chưa được kích hoạt</p>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerate2FA}
              disabled={generate2FAMutation.isPending}
            >
              {generate2FAMutation.isPending ? "Đang tạo..." : "Bật 2FA"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isSetupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cài đặt Xác thực hai yếu tố</DialogTitle>
            <DialogDescription>
              Quét mã QR bằng ứng dụng xác thực của bạn, sau đó nhập mã vào bên
              dưới.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            {qrCode ? (
              <img src={qrCode} alt="2FA QR Code" />
            ) : (
              <p>Đang tải mã QR...</p>
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
                  ? "Đang xác minh..."
                  : "Xác minh & Bật"}
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
            <DialogTitle>Lưu mã khôi phục của bạn</DialogTitle>
            <DialogDescription>
              Lưu trữ các mã này ở một nơi an toàn. Chúng có thể được sử dụng để
              giành lại quyền truy cập vào tài khoản của bạn nếu bạn mất thiết
              bị.
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
              Tôi đã lưu các mã khôi phục này.
            </label>
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadRecoveryCodes}
            >
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(recoveryCodes.join("\n"));
                toast({
                  title: "Đã copy",
                  description: "Mã khôi phục đã được copy vào clipboard",
                });
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={() => setRecoveryCodesDialogOpen(false)}
              disabled={!confirmSavedCodes}
              size="sm"
            >
              Đã lưu, đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tắt xác thực hai yếu tố</DialogTitle>
            <DialogDescription>
              Để tiếp tục, vui lòng nhập mã 6 chữ số từ ứng dụng xác thực của
              bạn.
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
                {disable2FAMutation.isPending ? "Đang tắt..." : "Tắt"}
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

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch("newPassword", "");

  const onSubmit = (data: any) => {
    changePasswordMutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: (data) => {
          if (data.accessToken) {
            setAccessToken(data.accessToken);
          }
          toast({
            title: "Thành công",
            description:
              "Đổi mật khẩu thành công, tự động đăng xuất khỏi tất cả thiết bị.",
          });
          reset();
        },
        onError: (error: any) => {
          toast({
            title: "Lỗi",
            description:
              error.response?.data?.message || "Không thể thay đổi mật khẩu.",
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
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Thay đổi mật khẩu</h3>
          <p className="text-sm text-muted-foreground">
            Chọn một mật khẩu mạnh mà bạn không sử dụng ở bất kỳ nơi nào khác.
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mt-4 p-6 border rounded-lg bg-card"
      >
        <div>
          <label
            className="block text-sm font-medium text-foreground mb-2"
            htmlFor="currentPassword"
          >
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              {...register("currentPassword", {
                required: "Mật khẩu hiện tại là bắt buộc.",
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
        <div>
          <label
            className="block text-sm font-medium text-foreground mb-2"
            htmlFor="newPassword"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword", {
                required: "Mật khẩu mới là bắt buộc.",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự.",
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
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Vui lòng xác nhận mật khẩu mới của bạn.",
                validate: (value) =>
                  value === watch("newPassword") || "Mật khẩu không khớp.",
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
          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending
              ? "Đang cập nhật..."
              : "Cập nhật mật khẩu"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ========================================================================
// SECTION 3: CHANGE EMAIL
// New component for changing email
// ========================================================================
const ChangeEmailForm = () => {
  const user = useAuthStore((state) => state.user);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const { toast } = useToast();
  const requestEmailChangeMutation = useRequestEmailChangeMutation();

  const onSubmit = (data: any) => {
    requestEmailChangeMutation.mutate(
      { newEmail: data.newEmail, password: data.password },
      {
        onSuccess: () => {
          toast({
            title: "Kiểm tra hộp thư đến của bạn",
            description: `Một liên kết xác nhận đã được gửi đến ${data.newEmail}.`,
          });
          reset();
        },
        onError: (error: any) => {
          toast({
            title: "Lỗi",
            description:
              error.response?.data?.message ||
              "Yêu cầu thay đổi email thất bại.",
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
          <h3 className="text-lg font-medium">Thay đổi địa chỉ Email</h3>
          <p className="text-sm text-muted-foreground">
            Địa chỉ email hiện tại của bạn là <strong>{user?.email}</strong>.
          </p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mt-4 p-6 border rounded-lg bg-card"
      >
        <div>
          <label
            className="block text-sm font-medium text-foreground"
            htmlFor="newEmail"
          >
            Địa chỉ Email mới
          </label>
          <Input
            id="newEmail"
            type="email"
            {...register("newEmail", { required: "Email mới là bắt buộc." })}
          />
          {errors.newEmail && (
            <p className="text-xs text-destructive mt-1">
              {errors.newEmail.message as string}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-foreground"
            htmlFor="password"
          >
            Xác minh bằng mật khẩu hiện tại
          </label>
          <Input
            id="password"
            type="password"
            {...register("password", {
              required: "Cần có mật khẩu để xác minh.",
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
            ? "Đang gửi..."
            : "Yêu cầu thay đổi Email"}
        </Button>
      </form>
    </div>
  );
};

// ========================================================================
// MAIN COMPONENT: Orchestrates all sections
// ========================================================================
export const SecurityPage = () => {
  return (
    <div className="space-y-6">
      <TwoFactorAuthSection />

      <hr className="my-6" />

      <ChangePasswordForm />

      <hr className="my-6" />

      <ChangeEmailForm />
    </div>
  );
};
