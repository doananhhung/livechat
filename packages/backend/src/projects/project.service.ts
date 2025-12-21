import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import {
  UpdateProjectDto,
  CreateProjectDto,
  WidgetSettingsDto,
} from '@live-chat/shared-dtos';
import {
  Project,
  ProjectMember,
} from '../database/entities';

import { ProjectRole, ProjectWithRole } from '@live-chat/shared-types';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Validates if a user is a member of a project.
   * Throws a ForbiddenException if not.
   * @returns The project entity if validation is successful.
   */
  async validateProjectMembership(
    projectId: number,
    userId: string
  ): Promise<Project> {
    const membership = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId },
      relations: ['project'],
    });

    if (!membership) {
      throw new ForbiddenException('Access to this project is denied.');
    }

    return membership.project;
  }

  async create(
    createProjectDto: CreateProjectDto,
    userId: string
  ): Promise<Project> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // Create the project instance without userId
        const project = transactionalEntityManager.create(
          Project,
          createProjectDto
        );
        const savedProject = await transactionalEntityManager.save(project);

        // Automatically make the creator a member with the MANAGER role
        const membership = transactionalEntityManager.create(ProjectMember, {
          projectId: savedProject.id,
          userId: userId,
          role: ProjectRole.MANAGER,
        });
        await transactionalEntityManager.save(membership);

        return savedProject;
      }
    );
  }

  async findAllForUser(userId: string): Promise<ProjectWithRole[]> {
    const memberships = await this.entityManager.find(ProjectMember, {
      where: { userId },
      relations: ['project', 'project.members', 'project.members.user'],
    });

    // Map to include the user's role in each project
    return memberships.map((membership) => ({
      id: membership.project.id,
      name: membership.project.name,
      widgetSettings: membership.project.widgetSettings,
      whitelistedDomains: membership.project.whitelistedDomains,
      createdAt: membership.project.createdAt,
      members: membership.project.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: {
          id: member.user.id,
          fullName: member.user.fullName,
          email: member.user.email,
        },
      })),
      myRole: membership.role, // Add user's role in this project
    }));
  }

  async findByProjectId(projectId: number): Promise<Project | null> {
    return this.entityManager.findOneBy(Project, { id: projectId });
  }

  async findOne(id: number, userId: string): Promise<Project> {
    return this.validateProjectMembership(id, userId);
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
    userId: string
  ): Promise<Project> {
    // Step 1: Validate membership and get the managed entity.
    // 'project' is the actual entity from the database.
    const project = await this.validateProjectMembership(id, userId);

    // Step 2: Copy the properties from the DTO to the fetched entity.
    // Object.assign updates 'project' in place with new values from the DTO.
    Object.assign(project, updateProjectDto);

    // Step 3: Save the modified entity.
    // TypeORM knows this is an existing entity because it has an 'id'
    // and is managed, so it will perform an UPDATE query.
    return this.entityManager.save(project);
  }

  public async getWidgetSettings(
    id: number,
    origin: string | undefined
  ): Promise<WidgetSettingsDto | null> {
    const project = await this.entityManager.findOneBy(Project, { id });

    if (!project) {
      this.logger.warn(`Project with ID ${id} not found.`);
      return null;
    }

    // Start of new "fail-closed" logic
    if (!origin) {
      this.logger.warn(
        `Request for project ${id} is missing an Origin header. Access denied.`
      );
      return null;
    }

    if (
      !project.whitelistedDomains ||
      project.whitelistedDomains.length === 0
    ) {
      this.logger.warn(
        `Project ${id} has no whitelisted domains configured. Access denied for origin ${origin}.`
      );
      return null;
    }
    // End of new "fail-closed" logic

    this.logger.log(`Validating origin: ${origin} for project ${id}`);
    const originUrl = new URL(origin);
    const originDomain = originUrl.hostname;

    if (!project.whitelistedDomains.includes(originDomain)) {
      this.logger.warn(
        `Origin ${originDomain} is not whitelisted for project ${id}.`
      );
      return null;
    }

    return project.widgetSettings as WidgetSettingsDto;
  }

  async updateWidgetSettings(
    id: number,
    userId: string,
    settingsDto: WidgetSettingsDto
  ): Promise<Project> {
    const project = await this.validateProjectMembership(id, userId);

    project.widgetSettings = {
      ...project.widgetSettings,
      ...settingsDto,
    };

    return this.entityManager.save(Project, project);
  }

  /**
   * Get all members of a project with their user information
   */
  async getProjectMembers(projectId: number, userId: string) {
    // Validate that the user is a manager of this project
    await this.validateProjectMembership(projectId, userId);

    const members = await this.entityManager.find(ProjectMember, {
      where: { projectId },
      relations: ['user'],
    });

    return members.map((member) => ({
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      user: {
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
      },
    }));
  }

  /**
   * Update a member's role in a project
   */
  async updateMemberRole(
    projectId: number,
    targetUserId: string,
    newRole: ProjectRole,
    currentUserId: string
  ) {
    // Validate that current user is a manager
    await this.validateProjectMembership(projectId, currentUserId);

    // Cannot change own role
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const member = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId: targetUserId },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this project');
    }

    member.role = newRole;
    await this.entityManager.save(ProjectMember, member);

    return { success: true, message: 'Member role updated successfully' };
  }

  /**
   * Remove a member from a project
   */
  async removeMember(
    projectId: number,
    targetUserId: string,
    currentUserId: string
  ) {
    // Validate that current user is a manager
    await this.validateProjectMembership(projectId, currentUserId);

    // Cannot remove self
    if (targetUserId === currentUserId) {
      throw new ForbiddenException(
        'You cannot remove yourself from the project'
      );
    }

    const member = await this.entityManager.findOne(ProjectMember, {
      where: { projectId, userId: targetUserId },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this project');
    }

    await this.entityManager.remove(ProjectMember, member);

    return { success: true, message: 'Member removed successfully' };
  }
}
