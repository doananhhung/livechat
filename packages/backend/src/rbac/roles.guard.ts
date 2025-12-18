// src/rbac/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, ProjectMember } from '@live-chat/shared';
import { GlobalRole, ProjectRole } from '@live-chat/shared';
import { ROLES_KEY } from './roles.decorator';
import { EntityManager } from 'typeorm';

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
  constructor(
    private reflector: Reflector,
    private readonly entityManager: EntityManager
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      (GlobalRole | ProjectRole)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

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

    // --- START of new logic for Project Roles ---
    const projectId = request.params.id || request.params.projectId;

    if (!projectId) {
      // If there's no projectId in a route that requires a project role, deny access.
      // This is a safeguard against incorrect route configuration.
      return false;
    }

    const membership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId: parseInt(projectId, 10), userId: user.id },
    });

    if (!membership) {
      return false; // User is not a member of this project
    }

    // Build the effective roles set for the project, including inherited roles
    const userProjectRoles = new Set<ProjectRole>([membership.role]);
    const inheritedProjectRoles = projectRoleHierarchy.get(membership.role);
    if (inheritedProjectRoles) {
      inheritedProjectRoles.forEach((inheritedRole) =>
        userProjectRoles.add(inheritedRole)
      );
    }

    // Check if the user's effective roles satisfy any of the required roles
    return requiredRoles.some((role) =>
      userProjectRoles.has(role as ProjectRole)
    );
    // --- END of new logic for Project Roles ---
  }
}
