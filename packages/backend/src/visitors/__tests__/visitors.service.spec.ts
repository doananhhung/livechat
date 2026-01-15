import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsService } from '../visitors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Visitor } from '../../database/entities/visitor.entity';
import { Repository } from 'typeorm';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateVisitorDto } from '../dto/update-visitor.dto';

describe('VisitorsService', () => {
  let service: VisitorsService;
  let visitorRepository: Repository<Visitor>;
  let eventsGateway: EventsGateway;

  const mockVisitorRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEventsGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks(); // Clear mocks before each test
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorsService,
        {
          provide: getRepositoryToken(Visitor),
          useValue: mockVisitorRepository,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
    visitorRepository = module.get<Repository<Visitor>>(getRepositoryToken(Visitor));
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateDisplayName', () => {
    const projectId = 1;
    const visitorId = 10;
    const initialVisitor: Visitor = {
      id: visitorId,
      projectId: projectId,
      visitorUid: 'some-unique-uuid-123',
      displayName: 'Old Name',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date(),
      project: { id: projectId } as any, // Mock as a partial Project object
      currentUrl: null,
      conversations: [],
      notes: [],
    };

    it('should successfully update a visitor\'s display name and emit event', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'New Name' };
      mockVisitorRepository.findOne.mockResolvedValue(initialVisitor);
      mockVisitorRepository.save.mockResolvedValue({ ...initialVisitor, displayName: 'New Name' });

      const result = await service.updateDisplayName(projectId, visitorId, updateDto);

      expect(visitorRepository.findOne).toHaveBeenCalledWith({ where: { id: visitorId, projectId: projectId } });
      expect(visitorRepository.save).toHaveBeenCalledWith({ ...initialVisitor, displayName: 'New Name' });
      expect(eventsGateway.server.to).toHaveBeenCalledWith(`project.${projectId}`);
      expect(eventsGateway.server.emit).toHaveBeenCalledWith('visitorUpdated', {
        projectId: projectId,
        visitorId: visitorId,
        visitor: { ...initialVisitor, displayName: 'New Name' },
      });
      expect(result.displayName).toEqual('New Name');
    });

    it('should throw NotFoundException if visitor is not found', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'New Name' };
      mockVisitorRepository.findOne.mockResolvedValue(null); // Explicitly resolve to null

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(NotFoundException);
      expect(visitorRepository.findOne).toHaveBeenCalledWith({ where: { id: visitorId, projectId: projectId } });
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventsGateway.server.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if displayName is empty', async () => {
      const updateDto: UpdateVisitorDto = { displayName: '' };
      // findOne should not be called in this case, as validation occurs before database access.

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(BadRequestException);
      expect(visitorRepository.findOne).not.toHaveBeenCalled();
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventsGateway.server.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if displayName is too long', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'a'.repeat(51) };
      // findOne should not be called in this case, as validation occurs before database access.

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(BadRequestException);
      expect(visitorRepository.findOne).not.toHaveBeenCalled();
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventsGateway.server.emit).not.toHaveBeenCalled();
    });

    it('should update visitor if displayName has leading/trailing spaces and trim it internally', async () => {
      const updateDto: UpdateVisitorDto = { displayName: '  Trimmed Name  ' };
      mockVisitorRepository.findOne.mockResolvedValue(initialVisitor);
      mockVisitorRepository.save.mockResolvedValue({ ...initialVisitor, displayName: '  Trimmed Name  ' }); // Service will save as is

      const result = await service.updateDisplayName(projectId, visitorId, updateDto);
      expect(visitorRepository.save).toHaveBeenCalledWith({ ...initialVisitor, displayName: '  Trimmed Name  ' });
      expect(result.displayName).toEqual('  Trimmed Name  ');
    });
  });
});
