import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import {
  ProjectRole,
  WidgetPosition,
  WidgetTheme,
} from "@live-chat/shared-types";
import type { HistoryVisibilityMode } from "@live-chat/shared-types";
import type { WidgetSettingsDto } from "@live-chat/shared-dtos";
import { WidgetPreview } from "../../components/features/projects/WidgetPreview";
import { StickyFooter } from "../../components/ui/StickyFooter";

export const ProjectWidgetSettingsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId } = useParams<{ projectId: string }>();

  // Widget settings form state
  const [theme, setTheme] = useState<WidgetTheme>(WidgetTheme.LIGHT);
  const [headerText, setHeaderText] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [position, setPosition] = useState<WidgetPosition>(
    WidgetPosition.BOTTOM_RIGHT,
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [agentDisplayName, setAgentDisplayName] = useState("");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [historyVisibility, setHistoryVisibility] =
    useState<HistoryVisibilityMode>("limit_to_active");
  const [offlineMessage, setOfflineMessage] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const currentProject = projects?.find((p) => p.id === Number(projectId));

  // Initialize widget settings when project loads
  useEffect(() => {
    if (currentProject?.widgetSettings) {
      const settings = currentProject.widgetSettings;
      setTheme(settings.theme || WidgetTheme.LIGHT);
      setHeaderText(settings.headerText || "");
      setWelcomeMessage(settings.welcomeMessage || "");
      setPosition(settings.position || WidgetPosition.BOTTOM_RIGHT);
      setCompanyLogoUrl(settings.companyLogoUrl || "");
      setAgentDisplayName(settings.agentDisplayName || "");
      setFontFamily(settings.fontFamily || "sans-serif");
      setHistoryVisibility(settings.historyVisibility || "limit_to_active");
      setOfflineMessage(settings.offlineMessage || "");
    }
  }, [currentProject]);

  const updateWidgetMutation = useMutation({
    mutationFn: (data: WidgetSettingsDto) =>
      projectApi.updateProjectSettings(Number(projectId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: t("common.success"),
        description: t("toast.widgetUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("settings.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleWidgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateWidgetMutation.mutate({
      theme,
      headerText: headerText.trim() || undefined,
      welcomeMessage: welcomeMessage.trim() || undefined,
      position,
      companyLogoUrl: companyLogoUrl.trim() || undefined,
      agentDisplayName: agentDisplayName.trim() || undefined,
      fontFamily: fontFamily.trim() || undefined,
      historyVisibility,
      offlineMessage: offlineMessage.trim() || undefined,
    });
  };

  const getThemeLabelKey = (theme: string) => {
    const camelCase = theme
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    return `settings.theme${camelCase}`;
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">
          {t("settings.projectNotFound")}
        </p>
        <Button onClick={() => navigate("/settings")}>
          {t("settings.backToProjectList")}
        </Button>
      </div>
    );
  }

  // Construct current settings object for preview
  const currentSettings: WidgetSettingsDto & { projectId: string } = {
    theme,
    headerText,
    welcomeMessage,
    position,
    companyLogoUrl,
    agentDisplayName,
    fontFamily,
    historyVisibility,
    offlineMessage,
    projectId: String(currentProject.id),
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="bg-card border rounded-lg p-6">
        <PermissionGate
          projectId={currentProject.id}
          requiredRole={ProjectRole.MANAGER}
          fallback={
            <p className="text-sm text-muted-foreground py-4">
              {t("settings.managerOnlyWidget")}
            </p>
          }
        >
          <form onSubmit={handleWidgetSubmit}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-card border-b -mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {t("settings.widgetSettings")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("settings.widgetSettingsDesc")}
                </p>
              </div>
              <Button type="submit" disabled={updateWidgetMutation.isPending}>
                {updateWidgetMutation.isPending
                  ? t("common.saving")
                  : t("common.save")}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Form Fields */}
              <div className="space-y-6">
                {/* History Visibility Mode */}
                <div className="border p-3 rounded-md bg-muted/20">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.chatHistory")}
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start space-x-2">
                      <input
                        type="radio"
                        id="mode-active-page"
                        name="historyVisibility"
                        value="limit_to_active"
                        checked={historyVisibility === "limit_to_active"}
                        onChange={() =>
                          setHistoryVisibility("limit_to_active")
                        }
                        disabled={updateWidgetMutation.isPending}
                        className="mt-1"
                      />
                      <label
                        htmlFor="mode-active-page"
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
                        id="mode-forever-page"
                        name="historyVisibility"
                        value="forever"
                        checked={historyVisibility === "forever"}
                        onChange={() => setHistoryVisibility("forever")}
                        disabled={updateWidgetMutation.isPending}
                        className="mt-1"
                      />
                      <label
                        htmlFor="mode-forever-page"
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.widgetTheme")}
                  </label>
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as WidgetTheme)
                    }
                    disabled={updateWidgetMutation.isPending}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    {Object.values(WidgetTheme).map((themeValue) => (
                      <option key={themeValue} value={themeValue}>
                        {t(getThemeLabelKey(themeValue))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.widgetHeader")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("widget.enterTitle")}
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    disabled={updateWidgetMutation.isPending}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {headerText.length}/50
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.fontFamily")}
                  </label>
                  <Input
                    type="text"
                    placeholder="sans-serif"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    disabled={updateWidgetMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.welcomeMessage")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("widget.enterGreeting")}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    disabled={updateWidgetMutation.isPending}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {welcomeMessage.length}/200
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.widgetPosition")}
                  </label>
                  <select
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as WidgetPosition)
                    }
                    disabled={updateWidgetMutation.isPending}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value={WidgetPosition.BOTTOM_RIGHT}>
                      {t("settings.bottomRight")}
                    </option>
                    <option value={WidgetPosition.BOTTOM_LEFT}>
                      {t("settings.bottomLeft")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.companyLogoUrl")}
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={companyLogoUrl}
                    onChange={(e) => setCompanyLogoUrl(e.target.value)}
                    disabled={updateWidgetMutation.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("settings.agentDisplayName")}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("members.agent")}
                    value={agentDisplayName}
                    onChange={(e) => setAgentDisplayName(e.target.value)}
                    disabled={updateWidgetMutation.isPending}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {agentDisplayName.length}/100
                  </p>
                </div>
              </div>

              {/* Right Column: Preview (Desktop) */}
              <div className="hidden lg:flex flex-col items-center justify-start bg-muted/20 rounded-lg p-6 border sticky top-6 self-start">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                  {t("common.preview")}
                </h3>
                <div className="w-full flex items-center justify-center scale-90 origin-top">
                  <WidgetPreview config={currentSettings} />
                </div>
              </div>
            </div>
          </form>
        </PermissionGate>
      </div>
    </div>
  );
};
