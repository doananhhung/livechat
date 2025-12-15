// src/pages/settings/ProfilePage.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
} from "../../services/settingsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

interface ProfileFormData {
  fullName: string;
  avatarUrl: string;
  language: string;
  timezone: string;
}

const languageOptions = [{ value: "vi", label: "Tiếng Việt" }];

const timezoneOptions = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (GMT+7)" },
];

export function ProfilePage() {
  const { data: user, isLoading, isError } = useUserProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        avatarUrl: user.avatarUrl || "",
        language: user.language || "vi",
        timezone: user.timezone || "Asia/Ho_Chi_Minh",
      });
    }
  }, [user, reset]);

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (isLoading) return <div>Đang tải hồ sơ...</div>;
  if (isError) return <div>Không thể tải hồ sơ.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Hồ sơ</h1>
      <p className="text-muted-foreground mb-6">
        Xem và quản lý thông tin cá nhân của bạn.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        {/* --- READ-ONLY FIELD --- */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Địa chỉ Email
          </label>
          <Input id="email" value={user?.email || ""} disabled />
        </div>

        {/* --- EDITABLE FIELDS --- */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-foreground"
          >
            Họ và Tên
          </label>
          <Input id="fullName" {...register("fullName")} />
        </div>
        <div>
          <label
            htmlFor="avatarUrl"
            className="block text-sm font-medium text-foreground"
          >
            URL ảnh đại diện
          </label>
          <Input id="avatarUrl" {...register("avatarUrl")} />
        </div>
        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-foreground"
          >
            Ngôn ngữ
          </label>
          <Select
            options={languageOptions}
            value={watch("language")}
            onChange={(value) =>
              setValue("language", value, { shouldDirty: true })
            }
          />
        </div>
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-foreground"
          >
            Múi giờ
          </label>
          <Select
            options={timezoneOptions}
            value={watch("timezone")}
            onChange={(value) =>
              setValue("timezone", value, { shouldDirty: true })
            }
          />
        </div>

        <Button type="submit" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>

        {/* --- ADDITIONAL INFORMATION (READ-ONLY) --- */}
        <div className="pt-4 text-sm text-muted-foreground space-y-2">
          <p>
            Trạng thái tài khoản:{" "}
            <span className="font-medium text-foreground">{user?.status}</span>
          </p>
          <p>
            Đăng nhập lần cuối:{" "}
            <span className="font-medium text-foreground">
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : "N/A"}
            </span>
          </p>
          <p>
            Tham gia từ:{" "}
            <span className="font-medium text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
