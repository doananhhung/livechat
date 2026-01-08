import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/use-toast";
import type { ProjectWithRole } from "@live-chat/shared-types";
import { getWidgetSnippet } from "../../../lib/widget";

interface ProjectInfoDialogProps {
  project: ProjectWithRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectInfoDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectInfoDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);

  const copyToClipboard = async (text: string, type: "snippet" | "id") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "snippet") {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      } else {
        setCopiedProjectId(true);
        setTimeout(() => setCopiedProjectId(false), 2000);
      }
      toast({
        title: t("project.info.copied"),
        description:
          type === "snippet" ? t("project.info.copiedSnippet") : t("project.info.copiedId"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("project.info.copyError"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("project.info.title")}</DialogTitle>
          <DialogDescription>
            {t("project.info.description", { name: project.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project ID */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("project.info.id")}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm">
                {project.id}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(project.id.toString(), "id")}
              >
                {copiedProjectId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("project.info.name")}
            </label>
            <p className="bg-muted px-3 py-2 rounded-md">{project.name}</p>
          </div>

          {/* Whitelisted Domains */}
          {project.whitelistedDomains &&
            project.whitelistedDomains.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("project.info.whitelistedDomains")} ({project.whitelistedDomains.length})
                </label>
                <div className="bg-muted px-3 py-2 rounded-md space-y-1">
                  {project.whitelistedDomains.map(
                    (domain: string, index: number) => (
                      <div key={index} className="text-sm">
                        • {domain}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Widget Snippet */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("project.info.widgetSnippet")}
            </label>
            <div className="relative">
              <pre className="bg-muted text-sm p-4 rounded-md overflow-x-auto">
                <code>{getWidgetSnippet(project.id)}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() =>
                  copyToClipboard(getWidgetSnippet(project.id), "snippet")
                }
              >
                {copiedSnippet ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("project.info.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {t("project.info.copySnippet")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Created Date */}
          {project.createdAt && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t("project.info.createdAt")}
              </label>
              <p className="bg-muted px-3 py-2 rounded-md">
                {new Date(project.createdAt).toLocaleDateString(t("momentLocale", { defaultValue: "vi-VN" }), {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
