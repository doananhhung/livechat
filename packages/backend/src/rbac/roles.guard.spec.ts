import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { GlobalRole, ProjectRole, User } from '@live-chat/shared';
import { ROLES_KEY } from './roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (user: Partial<User> | null) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({} as any),
      getClass: () => ({} as any),
    } as ExecutionContext);

  it('should return true if no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({} as User);
    expect(guard.canActivate(context)).toBe(true);
  });

  describe('Global Roles', () => {
    it('should return true if user has the required global role', () => {
      const requiredRoles = [GlobalRole.USER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { role: GlobalRole.USER } as User;
      const context = createMockContext(user);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true if user has a higher global role in hierarchy', () => {
      const requiredRoles = [GlobalRole.USER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { role: GlobalRole.ADMIN } as User;
      const context = createMockContext(user);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false if user does not have the required global role', () => {
      const requiredRoles = [GlobalRole.ADMIN];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { role: GlobalRole.USER } as User;
      const context = createMockContext(user);
      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('Project Roles', () => {
    it('should always return true for project roles as per current implementation', () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { role: GlobalRole.USER } as User; // Global role doesn't matter here
      const context = createMockContext(user);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true even if user has no specific project role attached yet', () => {
      const requiredRoles = [ProjectRole.MANAGER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const context = createMockContext({} as User);
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
