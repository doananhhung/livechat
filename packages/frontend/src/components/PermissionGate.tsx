import type { ReactNode } from "react";
import { ProjectRole } from "@live-chat/shared";
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
 *
 * @example
 * // Only show for managers
 * <PermissionGate projectId={projectId} requiredRole={ProjectRole.MANAGER}>
 *   <button>Mời thành viên</button>
 * </PermissionGate>
 *
 * @example
 * // Show for managers and agents (allowHigherRoles doesn't apply here since agent is lower)
 * <PermissionGate projectId={projectId} requiredRole={ProjectRole.AGENT} allowHigherRoles>
 *   <div>All project members can see this</div>
 * </PermissionGate>
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
