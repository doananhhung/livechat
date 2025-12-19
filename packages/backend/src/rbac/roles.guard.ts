// src/rbac/roles.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private readonly entityManager: EntityManager
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return true;
    // const requiredRoles = this.reflector.getAllAndOverride<
    //   (GlobalRole | ProjectRole)[]
    // >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // if (!requiredRoles) {
    //   return true;
    // }

    // const request = context.switchToHttp().getRequest();
    // const user: User = request.user;
    // const isPublic = this.reflector.get<boolean>(
    //   'isPublic',
    //   context.getHandler()
    // );

    // if (isPublic) {
    //   return true;
    // }

    // if (!user) {
    //   this.logger.warn('No user object found on request. Denying access.');
    //   return false;
    // }

    // this.logger.debug(
    //   `User ${user.id} attempting to access resource. Required roles: ${requiredRoles.join(
    //     ', '
    //   )}`
    // );

    // // Check if required roles are GlobalRoles
    // const requiresGlobalRole = requiredRoles.some((role) =>
    //   Object.values(GlobalRole).includes(role as GlobalRole)
    // );

    // if (requiresGlobalRole) {
    //   const userRoles = new Set<GlobalRole>([user.role]);
    //   const inheritedRoles = globalRoleHierarchy.get(user.role);
    //   if (inheritedRoles) {
    //     inheritedRoles.forEach((inheritedRole) => userRoles.add(inheritedRole));
    //   }

    //   const hasPermission = requiredRoles.some((role) =>
    //     userRoles.has(role as GlobalRole)
    //   );

    //   if (!hasPermission) {
    //     this.logger.warn(
    //       `Access denied for user ${user.id}. User has global roles [${[
    //         ...userRoles,
    //       ].join(', ')}], but requires one of [${requiredRoles.join(', ')}].`
    //     );
    //   }

    //   return hasPermission;
    // }

    // // --- START of new logic for Project Roles ---
    // const projectId =
    //   request.params.id ||
    //   request.params.projectId ||
    //   request.query.projectId ||
    //   request.body?.projectId;

    // if (!projectId) {
    //   this.logger.error(
    //     `Access denied for user ${user.id}. No projectId found in request for a route that requires a project role.`
    //   );
    //   return false;
    // }

    // const membership = await this.entityManager.findOne(ProjectMember, {
    //   where: { projectId: parseInt(projectId, 10), userId: user.id },
    // });

    // if (!membership) {
    //   this.logger.warn(
    //     `Access denied for user ${user.id} in project ${projectId}. User is not a member.`
    //   );
    //   return false;
    // }

    // const userProjectRoles = new Set<ProjectRole>([membership.role]);
    // const inheritedProjectRoles = projectRoleHierarchy.get(membership.role);
    // if (inheritedProjectRoles) {
    //   inheritedProjectRoles.forEach((inheritedRole) =>
    //     userProjectRoles.add(inheritedRole)
    //   );
    // }

    // const hasPermission = requiredRoles.some((role) =>
    //   userProjectRoles.has(role as ProjectRole)
    // );

    // if (!hasPermission) {
    //   this.logger.warn(
    //     `Access denied for user ${user.id} in project ${projectId}. User has project roles [${[
    //       ...userProjectRoles,
    //     ].join(', ')}], but requires one of [${requiredRoles.join(', ')}].`
    //   );
    // }

    // return hasPermission;
    // --- END of new logic for Project Roles ---
  }
}
