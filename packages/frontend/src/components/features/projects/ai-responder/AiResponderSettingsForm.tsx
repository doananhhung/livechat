import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../ui/Button";
import { StickyFooter } from "../../../ui/StickyFooter";
import { useToast } from "../../../ui/use-toast";
import { updateProject } from "../../../../services/projectApi";
import type { UpdateProjectDto } from "@live-chat/shared-dtos";
import { type Project } from "@live-chat/shared-types";
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  GlobalToolConfig,
  AiConfig,
} from "@live-chat/shared-types";
import { WorkflowEditor } from "../../workflow/WorkflowEditor";
import { Switch } from "../../../ui/Switch";

interface AiResponderSettingsFormProps {
  project: Project;
}

export const AiResponderSettingsForm = ({
  project,
}: AiResponderSettingsFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"simple" | "orchestrator">("simple");

  // Workflow State
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [globalTools, setGlobalTools] = useState<GlobalToolConfig[]>([]);
  const [language, setLanguage] = useState<"en" | "vi">("en");

  useEffect(() => {
    setEnabled(project.aiResponderEnabled ?? false);
    setPrompt(project.aiResponderPrompt ?? "");
    setMode(project.aiMode ?? "simple");

    const config = project.aiConfig as AiConfig | null;
    setNodes(config?.nodes || []);
    setEdges(config?.edges || []);
    // Default to current interface language if not set, otherwise fallback to 'en'
    const currentLang =
      typeof window !== "undefined"
        ? (localStorage.getItem("i18nextLng") as "en" | "vi" | null)
        : "en";
    setLanguage(config?.language || (currentLang === "vi" ? "vi" : "en"));
    // Handle migration from old string[] format to new GlobalToolConfig[] format
    const rawGlobalTools = config?.globalTools || [];
    if (rawGlobalTools.length > 0 && typeof rawGlobalTools[0] === "string") {
      // Old format: convert to new format
      setGlobalTools(
        (rawGlobalTools as unknown as string[]).map((name) => ({
          name,
          enabled: true,
          instruction: "",
        })),
      );
    } else {
      setGlobalTools(rawGlobalTools as GlobalToolConfig[]);
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProjectDto) => updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: t("common.success"),
        description: t("toast.projectUpdated"),
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

  const handleWorkflowChange = useCallback(
    (
      newNodes: WorkflowNode[],
      newEdges: WorkflowEdge[],
      newGlobalTools: GlobalToolConfig[],
    ) => {
      setNodes(newNodes);
      setEdges(newEdges);
      setGlobalTools(newGlobalTools);
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: UpdateProjectDto = {
      aiResponderEnabled: enabled,
      aiResponderPrompt: prompt,
      aiMode: mode,
    };

    if (mode === "orchestrator") {
      // Basic validation: ensure at least one Start node exists
      const hasStartNode = nodes.some((node) => node.type === "start");

      if (!hasStartNode) {
        toast({
          title: t("common.error"),
          description: "Workflow must have at least one Start node.",
          variant: "destructive",
        });
        return;
      }

      updateData.aiConfig = {
        nodes,
        edges,
        globalTools,
        variables: (project.aiConfig as WorkflowDefinition)?.variables || {},
        language,
      } as AiConfig;
    } else {
      // preserve other config but update language if needed in simple mode?
      // Actually, simple mode doesn't strictly use AiConfig for prompts, but we should save the language preference regardless.
      // For simple mode, we might want to store it in aiConfig if that's where we agreed.
      // The Spec says "project.aiConfig JSON structure".
      updateData.aiConfig = {
        ...(project.aiConfig as object),
        language,
      } as any;
    }

    updateMutation.mutate(updateData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 transition-all duration-300 ease-in-out"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-card border-b -mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("settings.aiResponder")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("settings.aiResponderDesc")}
          </p>
        </div>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
        <div>
          <h3 className="font-medium text-foreground">
            {t("settings.aiResponderEnable")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.aiResponderEnableDesc")}
          </p>
        </div>
        <div className="flex items-center">
          <Switch
            checked={enabled}
            onChange={setEnabled}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-card">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("settings.aiOperationMode")}
        </label>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <input
              type="radio"
              id="mode-simple"
              name="aiMode"
              value="simple"
              checked={mode === "simple"}
              onChange={() => setMode("simple")}
              disabled={!enabled || updateMutation.isPending}
              className="mt-1"
            />
            <label htmlFor="mode-simple" className="text-sm cursor-pointer">
              <span className="font-semibold block">
                {t("settings.modeSimple")}
              </span>
              <span className="text-muted-foreground">
                {t("settings.modeSimpleDesc")}
              </span>
            </label>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="radio"
              id="mode-orchestrator"
              name="aiMode"
              value="orchestrator"
              checked={mode === "orchestrator"}
              onChange={() => setMode("orchestrator")}
              disabled={!enabled || updateMutation.isPending}
              className="mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="mode-orchestrator"
                className="text-sm cursor-pointer block mb-2"
              >
                <span className="font-semibold block">
                  {t("settings.modeOrchestrator")}
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {t("common.advanced")}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {t("settings.modeOrchestratorDesc")}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-card">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("settings.aiLanguage") || "AI Language"}
        </label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="aiLanguage"
                value="en"
                checked={language === "en"}
                onChange={() => setLanguage("en")}
                disabled={!enabled || updateMutation.isPending}
              />
              <span className="text-sm">English</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="aiLanguage"
                value="vi"
                checked={language === "vi"}
                onChange={() => setLanguage("vi")}
                disabled={!enabled || updateMutation.isPending}
              />
              <span className="text-sm">Tiếng Việt</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "vi"
              ? "AI sẽ được hướng dẫn trả lời và suy luận bằng Tiếng Việt."
              : "The AI will be instructed to reply and reason in English."}
          </p>
        </div>
      </div>

      <div className="space-y-4 border p-4 rounded-lg bg-card animate-in fade-in slide-in-from-top-2 duration-200">
        <label
          htmlFor="aiResponderPrompt"
          className="block text-sm font-medium text-foreground"
        >
          {mode === "orchestrator"
            ? t("settings.globalSystemPrompt")
            : t("settings.aiResponderPrompt")}
        </label>
        <p className="text-xs text-muted-foreground">
          {mode === "orchestrator"
            ? t("settings.globalSystemPromptDesc")
            : t("settings.aiResponderPromptDesc")}
        </p>
        <textarea
          id="aiResponderPrompt"
          rows={6}
          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t("settings.aiResponderPromptPlaceholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!enabled || updateMutation.isPending}
        />
      </div>

      {mode === "orchestrator" && (
        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
          <label className="block text-sm font-medium text-foreground">
            Workflow Logic
          </label>
          <div className="h-[600px] border rounded-lg overflow-hidden bg-muted/5 relative">
            <WorkflowEditor
              initialNodes={nodes}
              initialEdges={edges}
              initialGlobalTools={globalTools}
              onChange={handleWorkflowChange}
            />
          </div>
        </div>
      )}


    </form>
  );
};
