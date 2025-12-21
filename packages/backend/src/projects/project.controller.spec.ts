import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { InvitationService } from './invitation.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  WidgetSettingsDto,
  CreateInvitationDto,
} from '@live-chat/shared-dtos';
import { ProjectRole } from '@live-chat/shared-types';
import { User } from '../database/entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';

describe('ProjectController', () => {
  let controller: ProjectController;
  let projectService: jest.Mocked<ProjectService>;
  let invitationService: jest.Mocked<InvitationService>;

  const mockUser = { id: '1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            create: jest.fn(),
            findAllForUser: jest.fn(),
            update: jest.fn(),
            updateWidgetSettings: jest.fn(),
            getProjectMembers: jest.fn(),
            updateMemberRole: jest.fn(),
            removeMember: jest.fn(),
          },
        },
        {
          provide: InvitationService,
          useValue: {
            createInvitation: jest.fn(),
            getProjectInvitations: jest.fn(),
            cancelInvitation: jest.fn(),
            acceptInvitation: jest.fn(),
            getInvitationByToken: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
    projectService = module.get(ProjectService);
    invitationService = module.get(InvitationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call projectService.create', async () => {
      const createDto: CreateProjectDto = { name: 'Test', whitelistedDomains: [] };
      await controller.create(createDto, mockUser);
      expect(projectService.create).toHaveBeenCalledWith(createDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should call projectService.findAllForUser', async () => {
      await controller.findAll(mockUser);
      expect(projectService.findAllForUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('should call projectService.update', async () => {
      const updateDto: UpdateProjectDto = { name: 'New Name' };
      await controller.update(1, updateDto, mockUser);
      expect(projectService.update).toHaveBeenCalledWith(1, updateDto, mockUser.id);
    });
  });

  describe('updateWidgetSettings', () => {
    it('should call projectService.updateWidgetSettings', async () => {
      const settingsDto: WidgetSettingsDto = { primaryColor: 'blue' };
      await controller.updateWidgetSettings(1, mockUser, settingsDto);
      expect(projectService.updateWidgetSettings).toHaveBeenCalledWith(
        1,
        mockUser.id,
        settingsDto
      );
    });
  });

  describe('createInvitation', () => {
    it('should call invitationService.createInvitation', async () => {
      const createInvitationDto: CreateInvitationDto = {
        email: 'test@test.com',
        projectId: 1,
        role: ProjectRole.AGENT,
      };
      await controller.createInvitation(createInvitationDto, mockUser);
      expect(invitationService.createInvitation).toHaveBeenCalledWith(
        createInvitationDto,
        mockUser.id
      );
    });
  });

  describe('getProjectInvitations', () => {
    it('should call invitationService.getProjectInvitations', async () => {
      await controller.getProjectInvitations(1, mockUser);
      expect(invitationService.getProjectInvitations).toHaveBeenCalledWith(
        1,
        mockUser.id
      );
    });
  });

  describe('cancelInvitation', () => {
    it('should call invitationService.cancelInvitation', async () => {
      await controller.cancelInvitation(1, 'invite-id', mockUser);
      expect(invitationService.cancelInvitation).toHaveBeenCalledWith(
        'invite-id',
        mockUser.id
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should call invitationService.acceptInvitation', async () => {
      await controller.acceptInvitation('token', mockUser);
      expect(invitationService.acceptInvitation).toHaveBeenCalledWith(
        'token',
        mockUser.id
      );
    });
  });

  describe('getInvitationDetails', () => {
    it('should call invitationService.getInvitationByToken', async () => {
      await controller.getInvitationDetails('token');
      expect(invitationService.getInvitationByToken).toHaveBeenCalledWith('token');
    });
  });

  describe('getProjectMembers', () => {
    it('should call projectService.getProjectMembers', async () => {
      await controller.getProjectMembers(1, mockUser);
      expect(projectService.getProjectMembers).toHaveBeenCalledWith(1, mockUser.id);
    });
  });

  describe('updateMemberRole', () => {
    it('should call projectService.updateMemberRole', async () => {
      await controller.updateMemberRole(1, '2', ProjectRole.AGENT, mockUser);
      expect(projectService.updateMemberRole).toHaveBeenCalledWith(
        1,
        '2',
        ProjectRole.AGENT,
        mockUser.id
      );
    });
  });

  describe('removeMember', () => {
    it('should call projectService.removeMember', async () => {
      await controller.removeMember(1, '2', mockUser);
      expect(projectService.removeMember).toHaveBeenCalledWith(1, '2', mockUser.id);
    });
  });
});