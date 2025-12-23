
// src/rbac/roles.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, ProjectMember } from '../database/entities';
import { GlobalRole, ProjectRole } from '@live-chat/shared-types';
import { ROLES_KEY } from './roles.decorator';
import { EntityManager } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly entityManager: EntityManager,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      (GlobalRole | ProjectRole)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler()
    );

    if (isPublic) {
      return true;
    }

    if (!user) {
      this.logger.warn('No user object found on request. Denying access.');
      return false;
    }

    this.logger.debug(
      `User ${user.id} attempting to access resource. Required roles: ${requiredRoles.join(
        ', '
      )}`
    );

    // Check if required roles are GlobalRoles
    const requiresGlobalRole = requiredRoles.some((role) =>
      Object.values(GlobalRole).includes(role as GlobalRole)
    );

    if (requiresGlobalRole) {
      const userRoles = new Set<GlobalRole>([user.role]);
      const inheritedRoles = globalRoleHierarchy.get(user.role);
      if (inheritedRoles) {
        inheritedRoles.forEach((inheritedRole) => userRoles.add(inheritedRole));
      }

      const hasPermission = requiredRoles.some((role) =>
        userRoles.has(role as GlobalRole)
      );

      if (!hasPermission) {
        this.logger.warn(
          `Access denied for user ${user.id}. User has global roles [${[
            ...userRoles,
          ].join(', ')}], but requires one of [${requiredRoles.join(', ')}].`
        );
      }

      return hasPermission;
    }

    // --- Logic for Project Roles ---
    // SECURITY FIX: Only accept projectId from route params to prevent parameter pollution attacks.
    // Do NOT fall back to query or body to avoid injection via conflicting parameters.
    const projectId = request.params.projectId || request.params.id;

    if (!projectId) {
      this.logger.error(
        `Access denied for user ${user.id}. No projectId found in route params for a route that requires a project role. ` +
          `Ensure projectId is passed as a route parameter, not in query or body.`
      );
      return false;
    }

    const cacheKey = `project_member:${projectId}:${user.id}`;
    let membership = await this.cacheManager.get<ProjectMember>(cacheKey);

    if (!membership) {
      const parsedProjectId = parseInt(projectId, 10);
      
      // Validate that projectId is a valid number
      if (isNaN(parsedProjectId)) {
        this.logger.error(
          `Access denied for user ${user.id}. Invalid projectId format: "${projectId}"`
        );
        return false;
      }
      
      const found = await this.entityManager.findOne(ProjectMember, {
        where: { projectId: parsedProjectId, userId: user.id },
      });
      membership = found ?? undefined;
      if (membership) {
        await this.cacheManager.set(cacheKey, membership, 60000); // Cache for 60 seconds
      }
    }

    if (!membership) {
      this.logger.warn(
        `Access denied for user ${user.id} in project ${projectId}. User is not a member.`
      );
      return false;
    }

    const userProjectRoles = new Set<ProjectRole>([membership.role]);
    const inheritedProjectRoles = projectRoleHierarchy.get(membership.role);
    if (inheritedProjectRoles) {
      inheritedProjectRoles.forEach((inheritedRole) =>
        userProjectRoles.add(inheritedRole)
      );
    }

    const hasPermission = requiredRoles.some((role) =>
      userProjectRoles.has(role as ProjectRole)
    );

    if (!hasPermission) {
      this.logger.warn(
        `Access denied for user ${user.id} in project ${projectId}. User has project roles [${[
          ...userProjectRoles,
        ].join(', ')}], but requires one of [${requiredRoles.join(', ')}].`
      );
    }

    return hasPermission;
  }
}
