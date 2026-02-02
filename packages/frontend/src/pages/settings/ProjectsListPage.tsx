import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as projectApi from "../../services/projectApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import { UserPlus, Settings } from "lucide-react";
import { PermissionGate } from "../../components/PermissionGate";
import { ProjectRole } from "@live-chat/shared-types";
import { getWidgetSnippet } from "../../lib/widget";

export const ProjectsListPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newProjectName, setNewProjectName] = useState("");
  const [whitelistedDomains, setWhitelistedDomains] = useState([""]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const createProjectMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setNewProjectName("");
      setWhitelistedDomains([""]);
      toast({ title: t("common.success"), description: t("project.list.createSuccess") });
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : t("project.list.createError");
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...whitelistedDomains];
    newDomains[index] = value;
    setWhitelistedDomains(newDomains);
  };

  const addDomainInput = () => {
    setWhitelistedDomains([...whitelistedDomains, ""]);
  };

  const removeDomainInput = (index: number) => {
    const newDomains = whitelistedDomains.filter((_, i) => i !== index);
    setWhitelistedDomains(newDomains);
  };

  const handleCreateProject = () => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      toast({
        title: t("common.error"),
        description: t("settings.projectNameRequired"),
        variant: "destructive",
      });
      return;
    }

    const finalDomains = whitelistedDomains
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (finalDomains.length === 0) {
      toast({
        title: t("common.error"),
        description: t("settings.domainRequired"),
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      name: trimmedName,
      whitelistedDomains: finalDomains,
    });
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-foreground">
        {t("project.list.title")}
      </h1>

      <div className="bg-card text-card-foreground border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{t("project.list.createTitle")}</h2>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder={t("project.list.createPlaceholder")}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={createProjectMutation.isPending}
            className="max-w-md"
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("project.list.domainsLabel")}
            </label>
            <div className="space-y-2">
              {whitelistedDomains.map((domain, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder={t("project.list.domainPlaceholder")}
                    value={domain}
                    onChange={(e) => handleDomainChange(index, e.target.value)}
                    disabled={createProjectMutation.isPending}
                    className="flex-grow"
                  />
                  {whitelistedDomains.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDomainInput(index)}
                      disabled={createProjectMutation.isPending}
                    >
                      {t("common.delete")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={addDomainInput}
              disabled={createProjectMutation.isPending}
            >
              {t("project.list.addDomain")}
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <Button
            onClick={handleCreateProject}
            disabled={createProjectMutation.isPending}
          >
            {createProjectMutation.isPending
              ? t("project.list.creating")
              : t("project.list.createButton")}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          {t("project.list.myProjects")}
        </h2>
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-card text-card-foreground border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <div className="flex gap-2">
                  <PermissionGate
                    projectId={project.id}
                    requiredRole={ProjectRole.MANAGER}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/settings/projects/${project.id}/general`)
                      }
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {t("project.list.settings")}
                    </Button>
                  </PermissionGate>

                  <PermissionGate
                    projectId={project.id}
                    requiredRole={ProjectRole.MANAGER}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/projects/${project.id}/invite`)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t("project.list.invite")}
                    </Button>
                  </PermissionGate>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t("project.list.embedCode")}
                </label>
                <pre className="bg-muted text-muted-foreground p-4 rounded-md text-sm overflow-x-auto">
                  <code>{getWidgetSnippet(project.id)}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(getWidgetSnippet(project.id));
                    toast({
                      title: t("widget.copied"),
                      description: t("widget.snippetCopied"),
                    });
                  }}
                >
                  {t("project.list.copySnippet")}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {t("project.list.noProjects")}
          </p>
        )}
      </div>
    </div>
  );
};
