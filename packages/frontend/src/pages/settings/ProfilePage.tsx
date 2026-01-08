// src/pages/settings/ProfilePage.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
} from "../../services/settingsApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../components/ui/use-toast";
import type { UserResponse } from "@live-chat/shared-types";

interface ProfileFormData {
  fullName: string;
  avatarUrl: string;
  language: string;
  timezone: string;
}

const languageOptions = [
  { value: "vi", label: "🇻🇳 Tiếng Việt" },
  { value: "en", label: "🇺🇸 English" },
];

const timezoneOptions = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (GMT+7)" },
];

export function ProfilePage() {
  const { t } = useTranslation();
  const { data: user, isLoading, isError } = useUserProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();
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
    updateProfile.mutate(data, {
      onSuccess: (updatedUser) => {
        // Sync authStore to update i18n
        setUser(updatedUser as UserResponse);
        toast({
          title: t("common.success"),
          description: t("profile.updateSuccess"),
        });
      },
      onError: (error) => {
        toast({
          title: t("common.error"),
          description: error instanceof Error ? error.message : t("profile.updateError"),
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) return <div>{t("profile.loadingProfile")}</div>;
  if (isError) return <div>{t("profile.loadError")}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t("profile.title")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("profile.description")}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        {/* --- READ-ONLY FIELD --- */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            {t("profile.emailAddress")}
          </label>
          <Input id="email" value={user?.email || ""} disabled />
        </div>

        {/* --- EDITABLE FIELDS --- */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-foreground"
          >
            {t("profile.fullName")}
          </label>
          <Input id="fullName" {...register("fullName")} />
        </div>
        <div>
          <label
            htmlFor="avatarUrl"
            className="block text-sm font-medium text-foreground"
          >
            {t("profile.avatarUrl")}
          </label>
          <Input id="avatarUrl" {...register("avatarUrl")} />
        </div>
        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-foreground"
          >
            {t("profile.language")}
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
            {t("profile.timezone")}
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
          {updateProfile.isPending ? t("common.saving") : t("common.save")}
        </Button>

        {/* --- ADDITIONAL INFORMATION (READ-ONLY) --- */}
        <div className="pt-4 text-sm text-muted-foreground space-y-2">
          <p>
            {t("profile.accountStatus")}:{" "}
            <span className="font-medium text-foreground">{user?.status}</span>
          </p>
          <p>
            {t("profile.lastLogin")}:{" "}
            <span className="font-medium text-foreground">
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString()
                : t("common.na")}
            </span>
          </p>
          <p>
            {t("profile.memberSince")}:{" "}
            <span className="font-medium text-foreground">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : t("common.na")}
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
