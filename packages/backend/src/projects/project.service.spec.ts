import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { EntityManager } from 'typeorm';
import {
  Project,
  ProjectMember,
} from '../database/entities';
import { UpdateProjectDto, WidgetSettingsDto } from '@live-chat/shared-dtos';
import { ProjectRole } from '@live-chat/shared-types';
import { ForbiddenException } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) => cb(entityManager)),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    entityManager = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateProjectMembership', () => {
    it('should return project if user is a member', async () => {
      const project = new Project();
      const membership = { project } as ProjectMember;
      entityManager.findOne.mockResolvedValue(membership);

      const result = await service.validateProjectMembership(1, '1');
      expect(result).toEqual(project);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      entityManager.findOne.mockResolvedValue(null);
      await expect(service.validateProjectMembership(1, '1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('create', () => {
    it('should create a project and assign the creator as manager', async () => {
      const createDto = { name: 'Test', whitelistedDomains: [] };
      const project = new Project();
      project.id = 1;
      project.name = createDto.name;
      project.whitelistedDomains = createDto.whitelistedDomains;

      const member = new ProjectMember();
      entityManager.create.mockImplementation((entity: any, data: any) => {
        if (entity === Project) {
          return project;
        }
        if (entity === ProjectMember) {
          member.role = data.role;
          return member;
        }
        return new entity();
      });
      entityManager.save.mockResolvedValue(project as any);

      await service.create(createDto, '1');

      expect(entityManager.save).toHaveBeenNthCalledWith(1, project);
      expect(entityManager.save).toHaveBeenNthCalledWith(2, expect.objectContaining({ role: ProjectRole.MANAGER }));
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const project = new Project();
      const updateDto: UpdateProjectDto = { name: 'New Name' };
      jest.spyOn(service, 'validateProjectMembership').mockResolvedValue(project);
      entityManager.save.mockResolvedValue(project);

      await service.update(1, updateDto, '1');

      expect(entityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' })
      );
    });
  });

  describe('updateWidgetSettings', () => {
    it('should update widget settings', async () => {
      const project = new Project();
      const settingsDto: WidgetSettingsDto = { primaryColor: 'blue' };
      jest.spyOn(service, 'validateProjectMembership').mockResolvedValue(project);
      entityManager.save.mockResolvedValue(project);

      await service.updateWidgetSettings(1, '1', settingsDto);

      expect(entityManager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({
          widgetSettings: { primaryColor: 'blue' },
        })
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should throw ForbiddenException when changing own role', async () => {
      jest.spyOn(service, 'validateProjectMembership').mockResolvedValue(new Project());
      await expect(
        service.updateMemberRole(1, '1', ProjectRole.AGENT, '1')
      ).rejects.toThrow('You cannot change your own role');
    });
  });

  describe('removeMember', () => {
    it('should throw ForbiddenException when removing self', async () => {
      jest.spyOn(service, 'validateProjectMembership').mockResolvedValue(new Project());
      await expect(service.removeMember(1, '1', '1')).rejects.toThrow(
        'You cannot remove yourself from the project'
      );
    });
  });
});