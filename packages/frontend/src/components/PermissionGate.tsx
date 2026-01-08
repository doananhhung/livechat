import type { ReactNode } from "react";
import { ProjectRole } from "@live-chat/shared-types";
import { useProjectRole } from "../hooks/useProjectRole";

interface PermissionGateProps {
  projectId: number | undefined;
  requiredRole: ProjectRole;
  /** If true, show content when user has the required role OR higher permissions */
  allowHigherRoles?: boolean;
  children: ReactNode;
  /** Optional fallback content to show when user doesn't have permission */
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user's project role
 */
export const PermissionGate = ({
  projectId,
  requiredRole,
  allowHigherRoles = true,
  children,
  fallback = null,
}: PermissionGateProps) => {
  const userRole = useProjectRole(projectId);

  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check permission based on role hierarchy
  // MANAGER > AGENT
  const hasPermission = allowHigherRoles
    ? userRole === requiredRole ||
      (requiredRole === ProjectRole.AGENT && userRole === ProjectRole.MANAGER)
    : userRole === requiredRole;

  return <>{hasPermission ? children : fallback}</>;
};
