import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggerInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AUDIT_LOG_METADATA } from './auditable.decorator';
import { AuditAction } from './audit.entity';
import { RequestWithUser, AuthenticatedUser } from '../common/interfaces/request-with-user.interface';
import { DEFAULT_SENSITIVE_KEYS } from './audit.utils';

describe('AuditLoggerInterceptor', () => {
  let interceptor: AuditLoggerInterceptor;
  let auditService: AuditService;
  let reflector: Reflector;

  const mockAuditService = {
    log: jest.fn().mockReturnValue(Promise.resolve()),
  };

  const mockReflector = {
    get: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnThis(),
    getRequest: jest.fn<RequestWithUser, []>(),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  } as unknown as CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggerInterceptor,
        { provide: AuditService, useValue: mockAuditService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    interceptor = module.get<AuditLoggerInterceptor>(AuditLoggerInterceptor);
    auditService = module.get<AuditService>(AuditService);
    reflector = module.get<Reflector>(Reflector);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should skip logging if no metadata is present', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('response');
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should log audit event on success', (done) => {
    const metadata = {
      action: AuditAction.CREATE,
      entity: 'TestEntity',
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ id: '123' }));
    
    const mockRequest = {
      user: { id: 'user-1' } as AuthenticatedUser,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'TestAgent' },
      body: { name: 'test' },
      params: {},
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual({ id: '123' });
        expect(auditService.log).toHaveBeenCalledWith({
          actorId: 'user-1',
          actorType: 'USER',
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent',
          action: AuditAction.CREATE,
          entity: 'TestEntity',
          entityId: '123',
          metadata: {
            requestBody: mockRequest.body,
            params: mockRequest.params,
            responseBody: { id: '123' },
          },
        });
        done();
      },
    });
  });

  it('should use extractors if provided', (done) => {
    const metadata = {
      action: AuditAction.UPDATE,
      entity: 'TestEntity',
      entityIdExtractor: (data: any) => data.customId,
      metadataExtractor: (req: any, res: any) => ({ custom: 'meta' }),
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ customId: '999' }));
    
    const mockRequest = {
      user: undefined, // System action, user is undefined
      ip: '127.0.0.1',
      headers: {},
      body: {},
      params: {},
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
          entityId: '999',
          metadata: { custom: 'meta' },
          actorType: 'SYSTEM',
        }));
        done();
      },
    });
  });

  it('should log error metadata on failure and rethrow', (done) => {
    const metadata = {
      action: AuditAction.DELETE,
      entity: 'TestEntity',
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    const error = new Error('Test Error');
    (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => error));
    
    const mockRequest = {
      user: { id: 'user-1' } as AuthenticatedUser,
      params: { id: '555' },
      headers: {},
      ip: '127.0.0.1',
      body: {},
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
            action: AuditAction.DELETE,
            entityId: '555',
            metadata: expect.objectContaining({
                error: 'Test Error',
            })
        }));
        done();
      },
    });
  });

  it('should not crash if auditService.log fails (Fail Open)', (done) => {
    const metadata = {
      action: AuditAction.CREATE,
      entity: 'TestEntity',
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ id: '123' }));
    (mockAuditService.log as jest.Mock).mockRejectedValue(new Error('Audit DB Down'));
    
    const mockRequest = { 
      user: { id: 'user-1' } as AuthenticatedUser,
      headers: {},
      ip: '127.0.0.1',
      body: {},
      params: {} 
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        // Should still succeed even if audit log failed
        expect(result).toEqual({ id: '123' }); 
        done();
      },
      error: () => {
        done.fail('Should not have thrown error');
      }
    });
  });

  it('should sanitize sensitive data in request and response bodies by default on success', (done) => {
    const metadata = {
      action: AuditAction.CREATE,
      entity: 'User',
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ id: '123', token: 'secret-token' }));

    const mockRequest = {
      user: { id: 'user-1' } as AuthenticatedUser,
      ip: '127.0.0.1',
      headers: { authorization: 'Bearer abc' },
      body: { username: 'testuser', password: 'secretpassword' },
      params: {},
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
          metadata: expect.objectContaining({
            requestBody: { username: 'testuser', password: '[REDACTED]' },
            responseBody: { id: '123', token: '[REDACTED]' },
          }),
        }));
        done();
      },
    });
  });

  it('should sanitize sensitive data in request body by default on failure', (done) => {
    const metadata = {
      action: AuditAction.LOGIN,
      entity: 'Authentication',
    };
    (reflector.get as jest.Mock).mockReturnValue(metadata);
    const error = new Error('Invalid credentials');
    (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => error));

    const mockRequest = {
      user: undefined,
      ip: '127.0.0.1',
      headers: {},
      body: { username: 'failed_user', password: 'wrongpassword' },
      params: {},
    } as unknown as RequestWithUser;
    (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(mockRequest);

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
          metadata: expect.objectContaining({
            requestBody: { username: 'failed_user', password: '[REDACTED]' },
            error: 'Invalid credentials',
          }),
        }));
        done();
      },
    });
  });
});