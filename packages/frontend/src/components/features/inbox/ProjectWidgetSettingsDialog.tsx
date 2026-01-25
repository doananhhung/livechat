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
import type { ProjectWithRole } from "@live-chat/shared-types";
import { WidgetTheme } from "@live-chat/shared-types";
import type { WidgetSettingsDto } from "@live-chat/shared-dtos";
import { WidgetPreview } from "../projects/WidgetPreview";
import { Monitor, Smartphone } from "lucide-react";

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

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const [settings, setSettings] = useState<WidgetSettingsDto>({
    theme: WidgetTheme.LIGHT,
    headerText: "",
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
        welcomeMessage: project.widgetSettings.welcomeMessage || "",
        position: project.widgetSettings.position || ("bottom-right" as any),
        companyLogoUrl: project.widgetSettings.companyLogoUrl,
        agentDisplayName: project.widgetSettings.agentDisplayName,
        offlineMessage: project.widgetSettings.offlineMessage,
        autoOpenDelay: project.widgetSettings.autoOpenDelay,
        backgroundImageUrl: project.widgetSettings.backgroundImageUrl,
        backgroundOpacity: project.widgetSettings.backgroundOpacity,
        fontFamily: project.widgetSettings.fontFamily || "sans-serif",
        historyVisibility:
          project.widgetSettings.historyVisibility || "limit_to_active",
      });
    }
  }, [project]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: WidgetSettingsDto) =>
      updateProjectSettings(project.id, data),
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

  const getThemeLabelKey = (theme: string) => {
    const camelCase = theme
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `settings.theme${camelCase}`;
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      className="max-w-5xl w-full" 
    >
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>{t("settings.widgetSettings")}</DialogTitle>
          <DialogDescription>
            {t("widget.customizeFor", { projectName: project.name })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh] max-h-[700px] min-h-[400px]"
        >
          {/* Left Column: Form Fields */}
          <div className="flex flex-col h-full overflow-hidden">
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
                        checked={settings.historyVisibility === "limit_to_active"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            historyVisibility: "limit_to_active",
                          })
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="mode-active"
                        className="text-sm cursor-pointer"
                      >
                        <span className="font-semibold block">
                          {t("settings.ticketStyleDefault")}
                        </span>
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
                        checked={settings.historyVisibility === "forever"}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            historyVisibility: "forever",
                          })
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="mode-forever"
                        className="text-sm cursor-pointer"
                      >
                        <span className="font-semibold block">
                          {t("settings.chatStyle")}
                        </span>
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
                      setSettings({
                        ...settings,
                        theme: e.target.value as WidgetTheme,
                      })
                    }
                  >
                    {Object.values(WidgetTheme).map((themeValue) => (
                      <option key={themeValue} value={themeValue}>
                        {t(getThemeLabelKey(themeValue))}
                      </option>
                    ))}
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
                      setSettings({
                        ...settings,
                        position: e.target.value as any,
                      })
                    }
                  >
                    <option value="bottom-right">
                      {t("settings.bottomRight")}
                    </option>
                    <option value="bottom-left">
                      {t("settings.bottomLeft")}
                    </option>
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
                      setSettings({
                        ...settings,
                        agentDisplayName: e.target.value,
                      })
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
          </div>

          {/* Right Column: Preview (Desktop Only) */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-muted/20 rounded-lg p-6 border h-full overflow-hidden relative">
            <div className="flex items-center justify-between w-full max-w-[380px] mb-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("common.preview")}
              </h3>
              
              <div className="flex items-center space-x-2 bg-background border rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-sm transition-colors ${
                    previewMode === "desktop"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  title={t("settings.desktopView")}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-sm transition-colors ${
                    previewMode === "mobile"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  title={t("settings.mobileView")}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={`w-full h-full flex items-center justify-center origin-center transition-all ${
              previewMode === "desktop" ? "scale-90" : "scale-100 p-0"
            }`}>
               <WidgetPreview 
                 config={{ ...settings, projectId: String(project.id) }} 
                 viewMode={previewMode}
               />
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};