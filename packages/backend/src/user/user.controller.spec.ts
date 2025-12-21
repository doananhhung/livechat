import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EmailChangeDto, UpdateUserDto } from '@live-chat/shared-dtos';
import { User } from '../database/entities';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findOneById: jest.fn(),
            updateProfile: jest.fn(),
            deactivate: jest.fn(),
            requestEmailChange: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the user profile without the password hash', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        passwordHash: 'hashed',
      } as User;
      const req = { user: { id: '1' } };
      userService.findOneById.mockResolvedValue(user);

      const result = await controller.getProfile(req);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('1');
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user profile without the password hash', async () => {
      const updateUserDto: UpdateUserDto = { fullName: 'New Name' };
      const updatedUser = {
        id: '1',
        fullName: 'New Name',
        passwordHash: 'hashed',
      } as User;
      const req = { user: { id: '1' } };
      userService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(req, updateUserDto);

      expect(userService.updateProfile).toHaveBeenCalledWith('1', updateUserDto);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.fullName).toBe('New Name');
    });
  });

  describe('deactivateAccount', () => {
    it('should deactivate the account and return a success message', async () => {
      const req = { user: { id: '1' } };
      userService.deactivate.mockResolvedValue(undefined as any);

      const result = await controller.deactivateAccount(req);

      expect(userService.deactivate).toHaveBeenCalledWith('1');
      expect(result.message).toContain('vô hiệu hóa');
    });
  });

  describe('requestEmailChange', () => {
    it('should call the service and return a success message', async () => {
      const req = { user: { id: '1' } };
      const emailChangeDto: EmailChangeDto = {
        newEmail: 'new@test.com',
        password: 'password',
      };
      userService.requestEmailChange.mockResolvedValue({
        message: 'Yêu cầu thay đổi email đã được gửi đến email mới',
        newEmail: emailChangeDto.newEmail,
      });

      const result = await controller.requestEmailChange(req, emailChangeDto);

      expect(userService.requestEmailChange).toHaveBeenCalledWith(
        '1',
        emailChangeDto.newEmail,
        emailChangeDto.password
      );
      expect(result.message).toContain('Yêu cầu thay đổi email đã được gửi');
    });
  });
});
