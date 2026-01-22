import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../ui/Button";
import { Input } from "../../../../ui/Input"; // We might need a TextArea component if Input doesn't support multiline nicely, or just use <textarea> with styles
import { useToast } from "../../../../ui/use-toast";
import { updateProject } from "../../../../../services/projectApi";
import type { UpdateProjectDto } from "@live-chat/shared-dtos";
import { type Project } from "@live-chat/shared-types";
import { Switch } from "../../../../ui/Switch"; // Assuming we have a Switch component, if not we'll use a checkbox or implement one.

// If Switch component doesn't exist, I'll fallback to a simple checkbox implementation or verify its existence.
// Based on previous files, I haven't seen Switch. Let's assume standard HTML input type="checkbox" styled or check ui folder.
// I'll check ui folder in next step if needed, but for now I'll use standard input.

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

  useEffect(() => {
    setEnabled(project.aiResponderEnabled ?? false);
    setPrompt(project.aiResponderPrompt ?? "");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      aiResponderEnabled: enabled,
      aiResponderPrompt: prompt,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
        <div>
          <h3 className="font-medium text-foreground">{t("settings.aiResponderEnable")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.aiResponderEnableDesc")}
          </p>
        </div>
        <div className="flex items-center">
             <input
                type="checkbox"
                id="aiResponderEnabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-input bg-background text-primary focus:ring-ring"
                disabled={updateMutation.isPending}
              />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="aiResponderPrompt"
          className="block text-sm font-medium text-foreground"
        >
          {t("settings.aiResponderPrompt")}
        </label>
        <p className="text-xs text-muted-foreground">
          {t("settings.aiResponderPromptDesc")}
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

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
};
