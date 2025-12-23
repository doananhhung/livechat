import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { EntityManager, Repository } from 'typeorm';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            preload: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) => cb(entityManager)),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            findOneBy: jest.fn(),
          } as any,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    entityManager = module.get(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const user = new User();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.findOneById('1');
      expect(result).toEqual(user);
    });

    it('should throw an error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.findOneById('1')).rejects.toThrow();
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const user = new User();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.findOneByEmail('test@test.com');
      expect(result).toEqual(user);
    });

    it('should return null if user not found by email', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const result = await service.findOneByEmail('test@test.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = { email: 'test@test.com', fullName: 'Test User', passwordHash: 'hashed' };
      const user = new User();
      userRepository.create.mockReturnValue(user);
      entityManager.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(user);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const user = new User();
      user.id = '1';
      user.fullName = 'Updated Name';
      userRepository.preload.mockResolvedValue(user);
      entityManager.save.mockResolvedValue(user);

      const result = await service.updateProfile('1', { fullName: 'Updated Name' });

      expect(userRepository.preload).toHaveBeenCalledWith({
        id: '1',
        fullName: 'Updated Name',
      });
      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw error if user not found', async () => {
      userRepository.preload.mockResolvedValue(undefined);

      await expect(
        service.updateProfile('1', { fullName: 'Updated Name' })
      ).rejects.toThrow();
    });
  });

  describe('updateLastLogin', () => {
    it('should update the last login timestamp', async () => {
      await service.updateLastLogin('1');
      expect(userRepository.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ lastLoginAt: expect.any(Date) })
      );
    });
  });

  describe('markEmailAsVerified', () => {
    it('should mark user email as verified', async () => {
      const user = new User();
      user.isEmailVerified = false;
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, isEmailVerified: true });

      const result = await service.markEmailAsVerified('1');

      expect(result.isEmailVerified).toBe(true);
    });
  });
});