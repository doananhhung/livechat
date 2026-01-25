import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import {
  ChevronRight,
  ArrowLeft,
  Info,
  Palette,
  Code,
  ShieldAlert,
  MessageSquarePlus,
  Zap,
} from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import {
  ProjectRole,
  WidgetPosition,
  WidgetTheme,
} from "@live-chat/shared-types";
import type { HistoryVisibilityMode } from "@live-chat/shared-types";
import { ProjectBasicSettingsForm } from "../../components/features/projects/ProjectBasicSettingsForm";
import { AiResponderSettingsForm } from "../../components/features/projects/ai-responder/AiResponderSettingsForm";
import type { WidgetSettingsDto } from "@live-chat/shared-dtos";
import { getWidgetSnippet } from "../../lib/widget";
import { WidgetPreview } from "../../components/features/projects/WidgetPreview";
import { StickyFooter } from "../../components/ui/StickyFooter";

export const ProjectSettingsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId } = useParams<{ projectId: string }>();

  const [expandedSections, setExpandedSections] = useState<{
    basic: boolean;
    widget: boolean;
    ai: boolean;
    snippet: boolean;
  }>({
    basic: true,
    widget: false,
    ai: false,
    snippet: false,
  });

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
  // Offline message is missing in the state but used in ProjectWidgetSettingsDialog.
  // We should add it here to be consistent, although the original file didn't seem to have it in the state?
  // Checking original file: It had it in useEffect setters but maybe not useState initial?
  // Original file: `const [offlineMessage, setOfflineMessage] = useState("")` was NOT present in my read.
  // Wait, let me check the read output again.
  // Original file Line 40+: theme, headerText, welcomeMessage, position, companyLogoUrl, agentDisplayName, fontFamily, historyVisibility.
  // NO offlineMessage. But useEffect set it: `offlineMessage: project.widgetSettings.offlineMessage` was NOT in useEffect either.
  // Ah, the original ProjectSettingsPage seemed incomplete compared to the Dialog?
  // Let's stick to what was there, but `WidgetPreview` needs `offlineMessage`.
  // I'll add `offlineMessage` state to support the preview better.
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {t("settings.projectSettings")}: {currentProject.name}
        </h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Basic Settings */}
        <div
          className={`bg-card border rounded-lg ${
            expandedSections.basic ? "" : "overflow-hidden"
          }`}
        >
          <button
            onClick={() => toggleSection("basic")}
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.basicInfo")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.basicInfoDesc")}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                expandedSections.basic ? "rotate-90" : ""
              }`}
            />
          </button>
          {expandedSections.basic && (
            <div className="px-6 pb-6 border-t animate-slide-in">
              <PermissionGate
                projectId={currentProject.id}
                requiredRole={ProjectRole.MANAGER}
                fallback={
                  <p className="text-sm text-muted-foreground py-4">
                    {t("settings.managerOnlyBasic")}
                  </p>
                }
              >
                <div className="pt-6">
                  <ProjectBasicSettingsForm project={currentProject} />
                </div>
              </PermissionGate>
            </div>
          )}
        </div>

        {/* Widget Settings */}
        <div
          className={`bg-card border rounded-lg ${
            expandedSections.widget ? "" : "overflow-hidden"
          }`}
        >
          <button
            onClick={() => toggleSection("widget")}
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.widgetSettings")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.widgetSettingsDesc")}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                expandedSections.widget ? "rotate-90" : ""
              }`}
            />
          </button>
          {expandedSections.widget && (
            <div className="px-6 pb-6 border-t animate-slide-in">
              <PermissionGate
                projectId={currentProject.id}
                requiredRole={ProjectRole.MANAGER}
                fallback={
                  <p className="text-sm text-muted-foreground py-4">
                    {t("settings.managerOnlyWidget")}
                  </p>
                }
              >
                <form onSubmit={handleWidgetSubmit} className="pt-6">
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

                  <StickyFooter className="flex justify-end mt-6">
                    <Button
                      type="submit"
                      disabled={updateWidgetMutation.isPending}
                    >
                      {updateWidgetMutation.isPending
                        ? t("common.saving")
                        : t("common.save")}
                    </Button>
                  </StickyFooter>
                </form>
              </PermissionGate>
            </div>
          )}
        </div>

        {/* AI Responder Settings */}
        <div
          className={`bg-card border rounded-lg ${
            expandedSections.ai ? "" : "overflow-hidden"
          }`}
        >
          <button
            onClick={() => toggleSection("ai")}
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.aiResponder")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.aiResponderDesc")}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                expandedSections.ai ? "rotate-90" : ""
              }`}
            />
          </button>
          {expandedSections.ai && (
            <div className="px-6 pb-6 border-t animate-slide-in pt-6">
              <PermissionGate
                projectId={currentProject.id}
                requiredRole={ProjectRole.MANAGER}
                fallback={
                  <p className="text-sm text-muted-foreground py-4">
                    {t("settings.managerOnlyAi")}
                  </p>
                }
              >
                <AiResponderSettingsForm project={currentProject} />
              </PermissionGate>
            </div>
          )}
        </div>

        {/* Widget Snippet */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("snippet")}
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Code className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.embedCode")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.embedCodeDesc")}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                expandedSections.snippet ? "rotate-90" : ""
              }`}
            />
          </button>
          {expandedSections.snippet && (
            <div className="px-6 pb-6 border-t animate-slide-in pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                {t("settings.embedInstructions")}
              </p>
              <pre className="bg-muted text-muted-foreground p-4 rounded-md text-sm overflow-x-auto">
                <code>{getWidgetSnippet(currentProject.id)}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  navigator.clipboard.writeText(
                    getWidgetSnippet(currentProject.id),
                  );
                  toast({
                    title: t("settings.copied"),
                    description: t("settings.snippetCopied"),
                  });
                }}
              >
                {t("settings.copySnippet")}
              </Button>
            </div>
          )}
        </div>

        {/* Canned Responses Link */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <button
            onClick={() =>
              navigate(`/projects/${projectId}/settings/canned-responses`)
            }
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.cannedResponses")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.cannedResponsesDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
          </button>
        </div>

        {/* Action Templates Link */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <button
            onClick={() =>
              navigate(`/projects/${projectId}/settings/action-templates`)
            }
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.actionTemplates")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.actionTemplatesDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
          </button>
        </div>

        {/* Audit Logs Link */}
        <div className="bg-card border rounded-lg overflow-hidden">
          <button
            onClick={() =>
              navigate(`/projects/${projectId}/settings/audit-logs`)
            }
            className="group w-full px-6 py-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("settings.auditLogs")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("settings.auditLogsDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
