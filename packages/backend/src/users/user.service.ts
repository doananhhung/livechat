import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { SYSTEM_USER_ID, UserStatus } from '@live-chat/shared-types';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly entityManager: EntityManager
  ) {}

  /**
   * Create a new user and save it to the database.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.entityManager.transaction(async (entityManager) => {
      const newUser = this.userRepository.create(createUserDto);
      return await entityManager.save(newUser);
    });
  }

  /**
   * Find a user by their ID.
   */
  async findOneById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by their email.
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    return this.entityManager.transaction(async (entityManager) => {
      const user = await this.userRepository.preload({
        id,
        ...updateUserDto,
      });
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }
      return entityManager.save(user);
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async activate(id: string): Promise<User> {
    const user = await this.findOneById(id);
    user.status = UserStatus.ACTIVE;
    return this.userRepository.save(user);
  }

  async markEmailAsVerified(userId: string): Promise<User> {
    const user = await this.findOneById(userId);
    user.isEmailVerified = true;
    return this.userRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOneById(id);
    user.status = UserStatus.INACTIVE;
    return this.userRepository.save(user);
  }

  /**
   * Delete a user by ID.
   * The System user cannot be deleted.
   */
  async delete(id: string): Promise<void> {
    if (id === SYSTEM_USER_ID) {
      throw new ForbiddenException('Cannot delete system user');
    }
    const user = await this.findOneById(id);
    await this.userRepository.remove(user);
  }
}
