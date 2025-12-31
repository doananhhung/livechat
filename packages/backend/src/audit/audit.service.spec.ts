import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditAction } from '@live-chat/shared-types';
import { AuditLog } from './audit.entity';
import { Repository } from 'typeorm';

const mockRepository = {
  save: jest.fn(),
  create: jest.fn().mockImplementation((dto) => dto),
};

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save audit log successfully', async () => {
    const dto = {
      actorId: 'user-1',
      actorType: 'USER' as const,
      action: AuditAction.CREATE,
      entity: 'Project',
      entityId: 'proj-1',
      metadata: { key: 'value' },
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    };

    mockRepository.save.mockResolvedValue({ id: 'log-1', ...dto });

    await service.log(dto);

    expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      actorId: dto.actorId,
      entity: dto.entity,
      action: dto.action
    }));
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should fail open (log error but not throw) when database save fails', async () => {
    const dto = {
      actorId: 'user-1',
      actorType: 'USER' as const,
      action: AuditAction.CREATE,
      entity: 'Project',
      entityId: 'proj-1',
      metadata: { key: 'value' },
    };

    const error = new Error('DB Error');
    mockRepository.save.mockRejectedValue(error);

    await expect(service.log(dto)).resolves.not.toThrow();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should handle circular reference in metadata by not saving', async () => {
     const circular: any = {};
     circular.self = circular;

     const dto = {
      actorId: 'user-1',
      actorType: 'USER' as const,
      action: AuditAction.CREATE,
      entity: 'Project',
      entityId: 'proj-1',
      metadata: circular,
    };
    
    await service.log(dto);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});