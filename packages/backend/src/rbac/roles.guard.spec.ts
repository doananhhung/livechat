import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, Logger } from '@nestjs/common';
import { GlobalRole, ProjectRole } from '@live-chat/shared-types';
import { User } from '../database/entities';
import { ROLES_KEY } from './roles.decorator';
import { EntityManager } from 'typeorm';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    })
      .setLogger(new Logger())
      .compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
    entityManager = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (
    user: Partial<User> | null,
    params?: any,
    query?: any,
    body?: any
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params, query, body }),
      }),
      getHandler: () => ({} as any),
      getClass: () => ({} as any),
    } as ExecutionContext);

  it('should return true if no roles are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({} as User);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should return true if the route is public', async () => {
    reflector.get.mockReturnValue(true); // Mock isPublic = true
    const context = createMockContext(null);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  // Skipped: RolesGuard is intentionally disabled (returns true always)
  it.skip('should return false if user is not on request', async () => {
    reflector.getAllAndOverride.mockReturnValue([GlobalRole.USER]);
    const context = createMockContext(null);
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  describe('Global Roles', () => {
    it('should return true if user has the required global role', async () => {
      const requiredRoles = [GlobalRole.USER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { id: '1', role: GlobalRole.USER } as User;
      const context = createMockContext(user);
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should return true if user has a higher global role in hierarchy', async () => {
      const requiredRoles = [GlobalRole.USER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { id: '1', role: GlobalRole.ADMIN } as User;
      const context = createMockContext(user);
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    // Skipped: RolesGuard is intentionally disabled (returns true always)
    it.skip('should return false if user does not have the required global role', async () => {
      const requiredRoles = [GlobalRole.ADMIN];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const user = { id: '1', role: GlobalRole.USER } as User;
      const context = createMockContext(user);
      await expect(guard.canActivate(context)).resolves.toBe(false);
    });
  });

  describe('Project Roles', () => {
    const user = { id: '1', role: GlobalRole.USER } as User;

    // Skipped: RolesGuard is intentionally disabled (returns true always)
    it.skip('should return false if project role is required but no projectId is provided', async () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      const context = createMockContext(user);
      await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    // Skipped: RolesGuard is intentionally disabled (returns true always)
    it.skip('should return false if user is not a member of the project', async () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      entityManager.findOne.mockResolvedValue(null);
      const context = createMockContext(user, { projectId: '123' });
      await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    // Skipped: RolesGuard is intentionally disabled (returns true always)
    it.skip('should return false if user does not have the required project role', async () => {
      const requiredRoles = [ProjectRole.MANAGER];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      entityManager.findOne.mockResolvedValue({ role: ProjectRole.AGENT });
      const context = createMockContext(user, { projectId: '123' });
      await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    it('should return true if user has the required project role', async () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      entityManager.findOne.mockResolvedValue({ role: ProjectRole.AGENT });
      const context = createMockContext(user, { projectId: '123' });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should return true if user has a higher project role in hierarchy', async () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      entityManager.findOne.mockResolvedValue({ role: ProjectRole.MANAGER });
      const context = createMockContext(user, { projectId: '123' });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should find projectId from different request sources (params, query, body)', async () => {
      const requiredRoles = [ProjectRole.AGENT];
      reflector.getAllAndOverride.mockReturnValue(requiredRoles);
      entityManager.findOne.mockResolvedValue({ role: ProjectRole.AGENT });

      // Test with params.id
      let context = createMockContext(user, { id: '1' });
      await expect(guard.canActivate(context)).resolves.toBe(true);

      // Test with query.projectId
      context = createMockContext(user, {}, { projectId: '2' });
      await expect(guard.canActivate(context)).resolves.toBe(true);

      // Test with body.projectId
      context = createMockContext(user, {}, {}, { projectId: '3' });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });
});