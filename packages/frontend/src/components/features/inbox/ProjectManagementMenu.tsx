import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, UserPlus, Info, BarChart } from "lucide-react";
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
import type { ProjectWithRole } from "@social-commerce/shared";

interface ProjectManagementMenuProps {
  project: ProjectWithRole;
}

export const ProjectManagementMenu = ({
  project,
}: ProjectManagementMenuProps) => {
  const navigate = useNavigate();
  const [showProjectInfo, setShowProjectInfo] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Quản lý
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate(`/projects/${project.id}/invite`)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Mời thành viên
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt dự án
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowProjectInfo(true)}>
            <Info className="h-4 w-4 mr-2" />
            Thông tin dự án
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              // TODO: Implement analytics
              console.log("Show analytics");
            }}
          >
            <BarChart className="h-4 w-4 mr-2" />
            Thống kê
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectInfoDialog
        project={project}
        open={showProjectInfo}
        onOpenChange={setShowProjectInfo}
      />
    </>
  );
};
