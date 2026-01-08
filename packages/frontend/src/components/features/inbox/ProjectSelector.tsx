// src/components/features/inbox/ProjectSelector.tsx

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type ProjectWithRole, ProjectRole } from "@live-chat/shared-types";
import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";
import { PermissionGate } from "../../PermissionGate";
import { ProjectManagementMenu } from "./ProjectManagementMenu";

interface ProjectSelectorProps {
  projects: ProjectWithRole[];
  activeProjectId?: string;
}

export const ProjectSelector = ({
  projects,
  activeProjectId,
}: ProjectSelectorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleProjectChange = (projectId: string) => {
    navigate(`/inbox/projects/${projectId}`);
  };

  // FIX: Convert 'projects' array to the format required by the 'Select' component
  const selectOptions = projects.map((project) => ({
    value: project.id.toString(),
    label: project.name,
  }));

  // Get current project's role
  const currentProject = projects.find(
    (p) => p.id.toString() === activeProjectId
  );
  const userRole = currentProject?.myRole;

  const getRoleBadgeText = (role: ProjectRole) => {
    return role === ProjectRole.MANAGER ? t("members.manager") : t("members.agent");
  };

  const getRoleBadgeVariant = (role: ProjectRole) => {
    return role === ProjectRole.MANAGER ? "default" : "secondary";
  };

  return (
    <div className="space-y-3">
      {/* Project Selector */}
      <Select
        value={activeProjectId || ""}
        onChange={handleProjectChange}
        options={selectOptions}
        placeholder="Select a project..."
      />

      {/* Role Badge and Management Menu */}
      <div className="flex items-center justify-between gap-2">
        {userRole && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("members.role")}:</span>
            <Badge variant={getRoleBadgeVariant(userRole)}>
              {getRoleBadgeText(userRole)}
            </Badge>
          </div>
        )}

        {/* Management Menu - Only for Managers */}
        {currentProject && (
          <PermissionGate
            projectId={currentProject.id}
            requiredRole={ProjectRole.MANAGER}
          >
            <ProjectManagementMenu project={currentProject} />
          </PermissionGate>
        )}
      </div>
    </div>
  );
};
