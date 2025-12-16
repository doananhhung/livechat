// src/rbac/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@social-commerce/shared';
import { GlobalRole, ProjectRole } from '@social-commerce/shared';
import { ROLES_KEY } from './roles.decorator';

// Defines the hierarchy of GLOBAL roles for system-level access
// An Admin has all the permissions of a User
const globalRoleHierarchy: Map<GlobalRole, GlobalRole[]> = new Map([
  [GlobalRole.ADMIN, [GlobalRole.USER]],
]);

// Defines the hierarchy of PROJECT roles for project-level access
// A Manager has all the permissions of an Agent
const projectRoleHierarchy: Map<ProjectRole, ProjectRole[]> = new Map([
  [ProjectRole.MANAGER, [ProjectRole.AGENT]],
]);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (GlobalRole | ProjectRole)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();

    // Check if required roles are GlobalRoles
    const requiresGlobalRole = requiredRoles.some((role) =>
      Object.values(GlobalRole).includes(role as GlobalRole)
    );

    if (requiresGlobalRole) {
      // Check user's global role (now a single value, not an array)
      // Build the effective roles set including inherited roles
      const userRoles = new Set<GlobalRole>([user.role]);
      const inheritedRoles = globalRoleHierarchy.get(user.role);
      if (inheritedRoles) {
        inheritedRoles.forEach((inheritedRole) => userRoles.add(inheritedRole));
      }

      // Check if the expanded set of roles includes any of the required roles
      return requiredRoles.some((role) => userRoles.has(role as GlobalRole));
    }

    // For ProjectRole checks, this guard only validates the decorator
    // Actual project role validation should be done in the service layer
    // where we have access to the projectId and can check ProjectMember table
    return true;
  }
}
