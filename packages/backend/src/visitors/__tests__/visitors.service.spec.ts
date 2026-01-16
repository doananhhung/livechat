import { Test, TestingModule } from '@nestjs/testing';
import { VisitorsService } from '../visitors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Visitor } from '../../database/entities/visitor.entity';
import { Repository } from 'typeorm';
import { EventsGateway } from '../../gateway/events.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateVisitorDto } from '../dto/update-visitor.dto';
import { RealtimeSessionService } from '../../realtime-session/realtime-session.service'; // ADDED
import { Visitor as SharedVisitorType } from '@live-chat/shared-types'; // ADDED
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('VisitorsService', () => {
  let service: VisitorsService;
  let visitorRepository: Repository<Visitor>;
  let eventsGateway: EventsGateway;
  let realtimeSessionService: RealtimeSessionService; // ADDED
  let eventEmitter: EventEmitter2;

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

  const mockRealtimeSessionService = { // ADDED
    isVisitorOnline: jest.fn(),
    getManyVisitorOnlineStatus: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
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
        { // ADDED
          provide: RealtimeSessionService,
          useValue: mockRealtimeSessionService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<VisitorsService>(VisitorsService);
    visitorRepository = module.get<Repository<Visitor>>(getRepositoryToken(Visitor));
    eventsGateway = module.get<EventsGateway>(EventsGateway);
    realtimeSessionService = module.get<RealtimeSessionService>(RealtimeSessionService); // ADDED
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => { // ADDED
    const projectId = 1;
    const visitorId = 10;
    const visitorEntity: Visitor = {
      id: visitorId,
      projectId: projectId,
      visitorUid: 'some-unique-uuid-123',
      displayName: 'Test Visitor',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date(),
      project: { id: projectId } as any, // FIXED: provide a mock Project object
      currentUrl: null,
      conversations: [],
      notes: [],
    };

    const expectedSharedVisitor: SharedVisitorType = { // ADDED
      id: visitorId,
      projectId: projectId,
      visitorUid: 'some-unique-uuid-123',
      displayName: 'Test Visitor',
      email: null,
      phone: null,
      customData: null,
      currentUrl: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnline: true,
    };

    it('should return a visitor with online status', async () => {
      mockVisitorRepository.findOne.mockResolvedValue(visitorEntity);
      mockRealtimeSessionService.isVisitorOnline.mockResolvedValue(true);

      const result = await service.findOne(projectId, visitorId);

      expect(visitorRepository.findOne).toHaveBeenCalledWith({ where: { id: visitorId, projectId: projectId } });
      expect(mockRealtimeSessionService.isVisitorOnline).toHaveBeenCalledWith(visitorEntity.visitorUid);
      expect(result).toEqual(expectedSharedVisitor); // UPDATED
    });

    it('should throw NotFoundException if visitor is not found', async () => {
      mockVisitorRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId, visitorId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDisplayName', () => {
    const projectId = 1;
    const visitorId = 10;
    const initialVisitorEntity: Visitor = {
      id: visitorId,
      projectId: projectId,
      visitorUid: 'some-unique-uuid-123',
      displayName: 'Old Name',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date(),
      project: { id: projectId } as any, // FIXED: provide a mock Project object
      currentUrl: null,
      conversations: [],
      notes: [],
    };
    const initialSharedVisitor: SharedVisitorType = { // UPDATED TO MATCH findOne mapping
      id: visitorId,
      projectId: projectId,
      visitorUid: 'some-unique-uuid-123',
      displayName: 'Old Name',
      email: null,
      phone: null,
      customData: null,
      currentUrl: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnline: true,
    };

    it('should successfully update a visitor\'s display name and emit event', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'New Name' };
      const updatedVisitorEntity = { ...initialVisitorEntity, displayName: 'New Name' };
      const updatedSharedVisitor: SharedVisitorType = { ...initialSharedVisitor, displayName: 'New Name' }; // UPDATED

      mockVisitorRepository.findOne
        .mockResolvedValueOnce(initialVisitorEntity) // For service.updateDisplayName -> visitorRepository.findOne
        .mockResolvedValueOnce(updatedVisitorEntity); // For service.updateDisplayName -> service.findOne -> visitorRepository.findOne

      mockVisitorRepository.save.mockResolvedValue(updatedVisitorEntity);
      mockRealtimeSessionService.isVisitorOnline.mockResolvedValue(true); // ADDED

      const result = await service.updateDisplayName(projectId, visitorId, updateDto);

      expect(visitorRepository.findOne).toHaveBeenCalledWith({ where: { id: visitorId, projectId: projectId } });
      expect(visitorRepository.save).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'New Name' })); // Use expect.objectContaining
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('visitor.updated', expect.objectContaining({
        projectId: projectId,
        visitorId: visitorId,
        visitor: updatedSharedVisitor,
      }));
      expect(result).toEqual(updatedSharedVisitor); // UPDATED
    });

    it('should throw NotFoundException if visitor is not found', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'New Name' };
      mockVisitorRepository.findOne.mockResolvedValue(null); // Explicitly resolve to null

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(NotFoundException);
      expect(visitorRepository.findOne).toHaveBeenCalledWith({ where: { id: visitorId, projectId: projectId } });
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if displayName is empty', async () => {
      const updateDto: UpdateVisitorDto = { displayName: '' };
      // findOne should not be called in this case, as validation occurs before database access.

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(BadRequestException);
      expect(visitorRepository.findOne).not.toHaveBeenCalled();
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if displayName is too long', async () => {
      const updateDto: UpdateVisitorDto = { displayName: 'a'.repeat(51) };
      // findOne should not be called in this case, as validation occurs before database access.

      await expect(service.updateDisplayName(projectId, visitorId, updateDto)).rejects.toThrow(BadRequestException);
      expect(visitorRepository.findOne).not.toHaveBeenCalled();
      expect(visitorRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should update visitor if displayName has leading/trailing spaces and trim it internally', async () => {
      const updateDto: UpdateVisitorDto = { displayName: '  Trimmed Name  ' };
      const updatedVisitorEntity = { ...initialVisitorEntity, displayName: '  Trimmed Name  ' };
      const updatedSharedVisitor: SharedVisitorType = { ...initialSharedVisitor, displayName: '  Trimmed Name  ' }; // UPDATED

      mockVisitorRepository.findOne
        .mockResolvedValueOnce(initialVisitorEntity) // For service.updateDisplayName -> visitorRepository.findOne
        .mockResolvedValueOnce(updatedVisitorEntity); // For service.updateDisplayName -> service.findOne -> visitorRepository.findOne

      mockVisitorRepository.save.mockResolvedValue(updatedVisitorEntity);
      mockRealtimeSessionService.isVisitorOnline.mockResolvedValue(true); // ADDED

      const result = await service.updateDisplayName(projectId, visitorId, updateDto);
      expect(visitorRepository.save).toHaveBeenCalledWith(expect.objectContaining({ displayName: '  Trimmed Name  ' }));
      expect(result).toEqual(updatedSharedVisitor); // UPDATED
    });
  });
});
