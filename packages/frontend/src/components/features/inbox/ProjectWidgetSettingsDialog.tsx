import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/use-toast";
import { updateProjectSettings } from "../../../services/projectApi";
import type {
  ProjectWithRole,
  IWidgetSettingsDto,
} from "@live-chat/shared-types";
import { WidgetTheme } from "@live-chat/shared-types";

interface ProjectWidgetSettingsDialogProps {
  project: ProjectWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectWidgetSettingsDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectWidgetSettingsDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<Partial<IWidgetSettingsDto>>({
    theme: WidgetTheme.LIGHT,
    headerText: "",
    primaryColor: "",
    welcomeMessage: "",
    position: "bottom-right" as any,
    fontFamily: "sans-serif",
    historyVisibility: "limit_to_active", // Default
  });

  useEffect(() => {
    if (project.widgetSettings) {
      setSettings({
        theme: project.widgetSettings.theme || WidgetTheme.LIGHT,
        headerText: project.widgetSettings.headerText || "",
        primaryColor: project.widgetSettings.primaryColor || "",
        welcomeMessage: project.widgetSettings.welcomeMessage || "",
        position: project.widgetSettings.position || ("bottom-right" as any),
        companyLogoUrl: project.widgetSettings.companyLogoUrl,
        agentDisplayName: project.widgetSettings.agentDisplayName,
        offlineMessage: project.widgetSettings.offlineMessage,
        autoOpenDelay: project.widgetSettings.autoOpenDelay,
        backgroundImageUrl: project.widgetSettings.backgroundImageUrl,
        backgroundOpacity: project.widgetSettings.backgroundOpacity,
        fontFamily: project.widgetSettings.fontFamily || "sans-serif",
        historyVisibility: project.widgetSettings.historyVisibility || "limit_to_active",
      });
    }
  }, [project]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<IWidgetSettingsDto>) =>
      updateProjectSettings(project.id, data as IWidgetSettingsDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: t("common.success"),
        description: t("toast.widgetUpdated"),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("settings.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.widgetSettings")}</DialogTitle>
          <DialogDescription>
            {t("widget.customizeFor", { projectName: project.name })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-[60vh] max-h-[600px] min-h-[400px]"
        >
          <div className="flex-1 overflow-y-auto pr-4 -mr-4 px-1">
            <div className="space-y-4 pb-4">
              {/* History Visibility Mode */}
              <div className="border p-3 rounded-md bg-muted/20">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.chatHistory")}
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start space-x-2">
                    <input
                      type="radio"
                      id="mode-active"
                      name="historyVisibility"
                      value="limit_to_active"
                      checked={settings.historyVisibility === 'limit_to_active'}
                      onChange={(e) => setSettings({ ...settings, historyVisibility: 'limit_to_active' })}
                      className="mt-1"
                    />
                    <label htmlFor="mode-active" className="text-sm cursor-pointer">
                      <span className="font-semibold block">{t("settings.ticketStyleDefault")}</span>
                      <span className="text-muted-foreground">
                        {t("settings.ticketStyleDesc")}
                      </span>
                    </label>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input
                      type="radio"
                      id="mode-forever"
                      name="historyVisibility"
                      value="forever"
                      checked={settings.historyVisibility === 'forever'}
                      onChange={(e) => setSettings({ ...settings, historyVisibility: 'forever' })}
                      className="mt-1"
                    />
                    <label htmlFor="mode-forever" className="text-sm cursor-pointer">
                      <span className="font-semibold block">{t("settings.chatStyle")}</span>
                      <span className="text-muted-foreground">
                        {t("settings.chatStyleDesc")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("widget.theme")}
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({ ...settings, theme: e.target.value as WidgetTheme })
                  }
                >
                  <option value={WidgetTheme.LIGHT}>{t("settings.themeLight")}</option>
                  <option value={WidgetTheme.DARK}>{t("settings.themeDark")}</option>
                </select>
              </div>

              {/* Header Text */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("widget.headerTitle")}
                </label>
                <Input
                  type="text"
                  placeholder={t("widget.enterTitle")}
                  value={settings.headerText}
                  onChange={(e) =>
                    setSettings({ ...settings, headerText: e.target.value })
                  }
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("widget.maxChars", { count: 50 })}
                </p>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.primaryColor")}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="color"
                      value={settings.primaryColor || "#6d28d9"} // Default purple for picker preview
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={settings.primaryColor || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, primaryColor: e.target.value })
                    }
                    placeholder={t("settings.default")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSettings({ ...settings, primaryColor: "" })}
                    title={t("settings.useDefaultColor")}
                  >
                    {t("settings.default")}
                  </Button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.fontFamily")}
                </label>
                <Input
                  type="text"
                  placeholder="sans-serif"
                  value={settings.fontFamily}
                  onChange={(e) =>
                    setSettings({ ...settings, fontFamily: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("widget.fontHelp")}
                </p>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("widget.greeting")}
                </label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background"
                  placeholder={t("widget.enterGreeting")}
                  value={settings.welcomeMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, welcomeMessage: e.target.value })
                  }
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("widget.maxChars", { count: 200 })}
                </p>
              </div>

              {/* Widget Position */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.widgetPosition")}
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                  value={settings.position}
                  onChange={(e) =>
                    setSettings({ ...settings, position: e.target.value as any })
                  }
                >
                  <option value="bottom-right">{t("settings.bottomRight")}</option>
                  <option value="bottom-left">{t("settings.bottomLeft")}</option>
                </select>
              </div>

              {/* Company Logo URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.companyLogoUrl")}
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={settings.companyLogoUrl || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, companyLogoUrl: e.target.value })
                  }
                />
              </div>

              {/* Agent Display Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("settings.agentDisplayName")}
                </label>
                <Input
                  type="text"
                  placeholder={t("widget.headerTitle")}
                  value={settings.agentDisplayName || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, agentDisplayName: e.target.value })
                  }
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 mt-auto border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSettingsMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};