import { useQuery } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { ArrowLeft } from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import { ProjectRole } from "@live-chat/shared-types";
import { AiResponderSettingsForm } from "../../components/features/projects/ai-responder/AiResponderSettingsForm";

export const ProjectAiSettingsPage = () => {
  const { t } = useTranslation();
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
          {t("settings.aiResponder")}
        </h1>
        <p className="text-muted-foreground">
          {t("settings.aiResponderDesc")}
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
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
    </div>
  );
};
