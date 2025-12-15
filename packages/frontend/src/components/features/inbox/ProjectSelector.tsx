// src/components/features/inbox/ProjectSelector.tsx

import { useNavigate } from "react-router-dom";
import { type Project } from "@social-commerce/shared";
import { Select } from "../../../components/ui/Select";

interface ProjectSelectorProps {
  projects: Project[];
  activeProjectId?: string;
}

export const ProjectSelector = ({
  projects,
  activeProjectId,
}: ProjectSelectorProps) => {
  const navigate = useNavigate();

  const handleProjectChange = (projectId: string) => {
    navigate(`/inbox/projects/${projectId}`);
  };

  // FIX: Convert 'projects' array to the format required by the 'Select' component
  const selectOptions = projects.map((project) => ({
    value: project.id.toString(),
    label: project.name,
  }));

  return (
    // FIX: Use 'Select' component with correct props
    <Select
      value={activeProjectId || ""}
      onChange={handleProjectChange}
      options={selectOptions}
      placeholder="Select a project..."
    />
  );
};
