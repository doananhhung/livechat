import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings, UserPlus, Info, Users, Sliders, ShieldAlert, MessageSquarePlus, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/DropdownMenu";
import { Button } from "../../ui/Button";
import { ProjectInfoDialog } from "./ProjectInfoDialog";
import { ProjectMembersDialog } from "./ProjectMembersDialog";
import { ProjectWidgetSettingsDialog } from "./ProjectWidgetSettingsDialog";
import type { ProjectWithRole } from "@live-chat/shared-types";
import { useAuthStore } from "../../../stores/authStore";

interface ProjectManagementMenuProps {
  project: ProjectWithRole;
}

export const ProjectManagementMenu = ({
  project,
}: ProjectManagementMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
          {t("settings.manage")}
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate(`/projects/${project.id}/invite`)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
          {t("members.inviteMember")}
        </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowMembers(true)}>
            <Users className="h-4 w-4 mr-2" />
          {t("members.manageMembers")}
        </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowWidgetSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
          {t("settings.quickWidgetSettings")}
        </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/settings/projects/${project.id}`)}
          >
            <Sliders className="h-4 w-4 mr-2" />
          {t("settings.detailedSettings")}
        </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/settings/projects/${project.id}/canned-responses`)}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
          {t("settings.cannedResponses")}
        </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/settings/projects/${project.id}/action-templates`)}
          >
            <Zap className="h-4 w-4 mr-2" />
          {t("settings.actionTemplates")}
        </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/settings/projects/${project.id}/audit-logs`)}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
          {t("settings.auditLogs")}
        </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowProjectInfo(true)}>
            <Info className="h-4 w-4 mr-2" />
          {t("settings.projectInfo")}
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectInfoDialog
        project={project}
        open={showProjectInfo}
        onOpenChange={setShowProjectInfo}
      />

      <ProjectMembersDialog
        projectId={project.id}
        projectName={project.name}
        currentUserId={currentUser?.id || ""}
        open={showMembers}
        onOpenChange={setShowMembers}
      />

      <ProjectWidgetSettingsDialog
        project={project}
        open={showWidgetSettings}
        onOpenChange={setShowWidgetSettings}
      />
    </>
  );
};
