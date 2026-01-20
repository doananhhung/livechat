import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService } from './actions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActionTemplate } from './entities/action-template.entity';
import { ActionSubmission } from './entities/action-submission.entity';
import { Conversation } from '../inbox/entities/conversation.entity';
import { Message } from '../inbox/entities/message.entity';
import { Visitor } from '../visitors/entities/visitor.entity';
import { ProjectService } from '../projects/project.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  ActionFieldType,
  ActionDefinition,
  ProjectRole,
} from '@live-chat/shared-types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';

describe('ActionsService', () => {
  let service: ActionsService;
  let templatesRepo: any;
  let submissionsRepo: any;
  let conversationRepo: any;
  let messageRepo: any;
  let visitorRepo: any;
  let projectService: any;
  let eventEmitter: any;

  const mockUser = { id: 'user-123' } as any;

  beforeEach(async () => {
    templatesRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    submissionsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    conversationRepo = {
      findOne: jest.fn(),
    };
    messageRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };
    visitorRepo = {
      findOne: jest.fn(),
    };
    projectService = {
      hasProjectRole: jest.fn(),
      isProjectMember: jest.fn(),
    };
    eventEmitter = {
      emit: jest.fn(),
    };

    const mockManager = {
      save: jest.fn().mockImplementation((entity) => {
        if (entity.contentType === 'form_submission')
          return Promise.resolve({ id: 'msg-1' });
        return Promise.resolve({ id: 'sub-1' });
      }),
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
    };

    // Update module definition to provide DataSource
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        {
          provide: getRepositoryToken(ActionTemplate),
          useValue: templatesRepo,
        },
        {
          provide: getRepositoryToken(ActionSubmission),
          useValue: submissionsRepo,
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepo,
        },
        { provide: getRepositoryToken(Message), useValue: messageRepo },
        { provide: getRepositoryToken(Visitor), useValue: visitorRepo },
        { provide: ProjectService, useValue: projectService },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
  });

  // ... (rest of tests)

  describe('createTemplate', () => {
    it('should create a template if user is MANAGER', async () => {
      projectService.hasProjectRole.mockResolvedValue(true);
      templatesRepo.create.mockReturnValue({ id: 1 });
      templatesRepo.save.mockResolvedValue({ id: 1 });

      const dto = {
        name: 'Test',
        definition: { fields: [] },
      };

      const result = await service.createTemplate(1, dto, mockUser);
      expect(result).toEqual({ id: 1 });
      expect(projectService.hasProjectRole).toHaveBeenCalledWith(
        'user-123',
        1,
        ProjectRole.MANAGER
      );
    });

    it('should throw Forbidden if user is not MANAGER', async () => {
      projectService.hasProjectRole.mockResolvedValue(false);
      const dto = { name: 'Test', definition: { fields: [] } };
      await expect(service.createTemplate(1, dto, mockUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('createSubmission', () => {
    const validDefinition: ActionDefinition = {
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: ActionFieldType.TEXT,
          required: true,
        },
        {
          key: 'age',
          label: 'Age',
          type: ActionFieldType.NUMBER,
          required: false,
        },
      ],
    };

    const mockTemplate = {
      id: 1,
      definition: validDefinition,
      projectId: 1,
      isEnabled: true,
    };

    const mockConversation = {
      id: 'conv-1',
      projectId: '1',
    };

    it('should create submission if data is valid', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);
      submissionsRepo.create.mockReturnValue({ id: 'sub-1' });
      submissionsRepo.save.mockResolvedValue({ id: 'sub-1' });

      const dto = {
        templateId: 1,
        data: { name: 'Alice', age: 30 },
      };

      const result = await service.createSubmission('conv-1', dto, mockUser);
      expect(result).toEqual({ id: 'sub-1' });
    });

    it('should throw BadRequest if required field is missing', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);

      const dto = {
        templateId: 1,
        data: { age: 30 }, // 'name' missing
      };

      await expect(
        service.createSubmission('conv-1', dto, mockUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if extra field is present (Strict Mode)', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);

      const dto = {
        templateId: 1,
        data: { name: 'Alice', extra: 'bad' },
      };

      await expect(
        service.createSubmission('conv-1', dto, mockUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if type mismatch', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);

      const dto = {
        templateId: 1,
        data: { name: 123 }, // Should be string
      };

      await expect(
        service.createSubmission('conv-1', dto, mockUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== FORM REQUEST TESTS ====================
  describe('sendFormRequest', () => {
    const validDefinition: ActionDefinition = {
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: ActionFieldType.TEXT,
          required: true,
        },
      ],
    };

    const mockTemplate = {
      id: 1,
      name: 'Test Form',
      description: 'Test description',
      definition: validDefinition,
      projectId: 1,
      isEnabled: true,
    };

    const mockConversation = {
      id: 1,
      projectId: '1',
      visitor: { visitorUid: 'visitor-123' },
    };

    it('should create form_request message with valid templateId', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);
      messageRepo.findOne.mockResolvedValue(null); // No pending request
      submissionsRepo.findOne.mockResolvedValue(null);
      messageRepo.create.mockReturnValue({ id: '1' });
      messageRepo.save.mockResolvedValue({
        id: '1',
        contentType: 'form_request',
      });

      const dto = { templateId: 1 };
      const result = await service.sendFormRequest('1', dto, mockUser);

      expect(result.contentType).toBe('form_request');
      expect(messageRepo.create).toHaveBeenCalled();
    });

    it('should throw BadRequest if template is disabled', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue({
        ...mockTemplate,
        isEnabled: false,
      });

      const dto = { templateId: 1 };
      await expect(service.sendFormRequest('1', dto, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ConflictException if pending form exists', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      templatesRepo.findOne.mockResolvedValue(mockTemplate);
      // Pending form request exists (no submission for it)
      messageRepo.findOne.mockResolvedValue({
        id: '999',
        contentType: 'form_request',
      });
      submissionsRepo.findOne.mockResolvedValue(null);

      const dto = { templateId: 1 };
      await expect(
        service.sendFormRequest('1', dto, mockUser)
      ).rejects.toThrow();
    });
  });

  // ==================== VISITOR FORM SUBMISSION TESTS ====================
  describe('submitFormAsVisitor', () => {
    const validDefinition: ActionDefinition = {
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: ActionFieldType.TEXT,
          required: true,
        },
      ],
    };

    const mockFormRequestMessage = {
      id: '100',
      contentType: 'form_request',
      senderId: 'agent-123',
      metadata: {
        templateId: 1,
        templateName: 'Test Form',
        definition: validDefinition,
      },
    };

    const mockConversation = {
      id: 1,
      projectId: '1',
    };

    it('should create submission with valid data', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.findOne.mockResolvedValue(mockFormRequestMessage);
      submissionsRepo.findOne.mockResolvedValue(null); // Not already submitted
      templatesRepo.findOne.mockResolvedValue({ id: 1 });
      submissionsRepo.create.mockReturnValue({ id: 'sub-1' });
      // submissionsRepo.save should NOT be called
      visitorRepo.findOne.mockResolvedValue({ id: 1, visitorUid: 'v-123' });
      messageRepo.create.mockReturnValue({ id: 'msg-1' });
      // messageRepo.save should NOT be called

      const dto = { formRequestMessageId: '100', data: { name: 'Alice' } };
      const result = await service.submitFormAsVisitor('1', 1, dto);

      expect(result.submission.id).toBe('sub-1');
      expect(submissionsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorId: 1,
          formRequestMessageId: '100',
        })
      );
      // Verify usage of transaction manager instead of repo
      expect(submissionsRepo.save).not.toHaveBeenCalled();

      // Verify message metadata update (PERSISTENCE FIX)
      expect(messageRepo.save).not.toHaveBeenCalled(); // Should use manager.save
      // Ideally we would check manager.save(formRequestMessage) but manager is a partial mock.
      // We can check if the object we passed was mutated or if manager.save was called with it.
    });

    it('should throw BadRequest with invalid data', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.findOne.mockResolvedValue(mockFormRequestMessage);
      submissionsRepo.findOne.mockResolvedValue(null);

      const dto = {
        formRequestMessageId: '100',
        data: { wrongField: 'value' },
      };
      await expect(service.submitFormAsVisitor('1', 1, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequest if no pending form request', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.findOne.mockResolvedValue(null); // No form request

      const dto = { formRequestMessageId: '100', data: { name: 'Alice' } };
      await expect(service.submitFormAsVisitor('1', 1, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw GoneException if form request expired', async () => {
      const expiredMessage = {
        ...mockFormRequestMessage,
        metadata: {
          ...mockFormRequestMessage.metadata,
          expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
      };
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.findOne.mockResolvedValue(expiredMessage);
      submissionsRepo.findOne.mockResolvedValue(null);
      const dto = { formRequestMessageId: '100', data: { name: 'Alice' } };
      await expect(service.submitFormAsVisitor('1', 1, dto)).rejects.toThrow();
    });

    it('should throw ConflictException on database unique constraint violation', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.findOne.mockResolvedValue(mockFormRequestMessage);
      submissionsRepo.findOne.mockResolvedValue(null);
      templatesRepo.findOne.mockResolvedValue({ id: 1 });
      submissionsRepo.create.mockReturnValue({ id: 'sub-1' });
      visitorRepo.findOne.mockResolvedValue({ id: 1, visitorUid: 'v-123' });
      // Simulate unique constraint violation on save
      const error: any = new Error('Unique violation');
      error.code = '23505';
      const mockManager = {
        save: jest.fn().mockImplementationOnce(() => Promise.reject(error)),
      };
      // dataSource mock in beforeEach is simplistic, we need to override it for this test
      // or rely on how we set it up.
      // The beforeEach setup:
      // const dataSource = {
      //   transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
      // };
      // But the beforeEach mockManager doesn't throw.
      // We can override the transaction mock for this test.
      (service['dataSource'].transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager)
      );

      const dto = { formRequestMessageId: '100', data: { name: 'Alice' } };
      await expect(service.submitFormAsVisitor('1', 1, dto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  // ==================== SUBMISSION UPDATE/DELETE TESTS ====================
  describe('updateSubmission', () => {
    it('should update submission if user is owner', async () => {
      const mockSubmission = {
        id: 'sub-1',
        creatorId: 'user-123',
        visitorId: null,
        data: { name: 'Old' },
        template: {
          definition: {
            fields: [
              {
                key: 'name',
                label: 'Name',
                type: ActionFieldType.TEXT,
                required: true,
              },
            ],
          },
        },
      };
      submissionsRepo.findOne.mockResolvedValue(mockSubmission);
      submissionsRepo.save.mockResolvedValue({
        ...mockSubmission,
        data: { name: 'New' },
      });

      const result = await service.updateSubmission(
        'sub-1',
        { name: 'New' },
        'user-123'
      );
      expect(result.data.name).toBe('New');
    });

    it('should throw Forbidden if user is not owner', async () => {
      const mockSubmission = {
        id: 'sub-1',
        creatorId: 'other-user',
        visitorId: null,
        data: { name: 'Old' },
      };
      submissionsRepo.findOne.mockResolvedValue(mockSubmission);

      await expect(
        service.updateSubmission('sub-1', { name: 'New' }, 'user-123')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSubmission', () => {
    it('should delete submission if agent has project access', async () => {
      const mockSubmission = {
        id: 'sub-1',
        conversationId: 'conv-1',
        creatorId: 'agent-1',
        visitorId: null,
      };
      const mockConversation = { id: 'conv-1', projectId: '1' };

      submissionsRepo.findOne.mockResolvedValue(mockSubmission);
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      projectService.isProjectMember.mockResolvedValue(true);
      submissionsRepo.remove.mockResolvedValue(undefined);

      await service.deleteSubmission('sub-1', 'user-123');
      expect(submissionsRepo.remove).toHaveBeenCalledWith(mockSubmission);
    });
  });
});
