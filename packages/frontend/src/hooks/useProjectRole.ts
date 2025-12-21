import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProjectRole } from "@live-chat/shared-types";
import { getProjects } from "../services/projectApi";

/**
 * Hook to get the current user's role in a specific project
 * @param projectId - The ID of the project
 * @returns The user's role in the project, or null if not a member
 */
export const useProjectRole = (
  projectId: number | undefined
): ProjectRole | null => {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  return useMemo(() => {
    if (!projectId) return null;
    const project = projects.find((p) => p.id === projectId);
    return project?.myRole ?? null;
  }, [projectId, projects]);
};

/**
 * Hook to check if the current user is a manager in a specific project
 * @param projectId - The ID of the project
 * @returns true if the user is a manager, false otherwise
 */
export const useIsProjectManager = (projectId: number | undefined): boolean => {
  const role = useProjectRole(projectId);
  return role === ProjectRole.MANAGER;
};

/**
 * Hook to check if the current user is an agent in a specific project
 * @param projectId - The ID of the project
 * @returns true if the user is an agent, false otherwise
 */
export const useIsProjectAgent = (projectId: number | undefined): boolean => {
  const role = useProjectRole(projectId);
  return role === ProjectRole.AGENT;
};
