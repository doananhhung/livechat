import { useQuery } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import { ArrowLeft, Code } from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import { ProjectRole } from "@live-chat/shared-types";
import { ProjectBasicSettingsForm } from "../../components/features/projects/ProjectBasicSettingsForm";
import { getWidgetSnippet } from "../../lib/widget";

export const ProjectGeneralSettingsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const currentProject = projects?.find((p) => p.id === Number(projectId));

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
          {t("settings.basicInfo")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings.basicInfoDesc")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="bg-card border rounded-lg p-6">
          <PermissionGate
            projectId={currentProject.id}
            requiredRole={ProjectRole.MANAGER}
            fallback={
              <p className="text-sm text-muted-foreground py-4">
                {t("settings.managerOnlyBasic")}
              </p>
            }
          >
            <ProjectBasicSettingsForm project={currentProject} />
          </PermissionGate>
        </div>

        {/* Widget Snippet */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
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
      </div>
    </div>
  );
};
