
import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  ValidationPipe,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { EmailChangeDto, UpdateUserDto } from '@live-chat/shared-dtos';
import { User } from '../database/entities';
import { EmailChangeService } from './services/email-change.service';
import { AuditAction } from '@live-chat/shared-types';
import { Auditable } from '../audit/auditable.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailChangeService: EmailChangeService,
  ) {}

  @Get('me')
  async getProfile(
    @Request() req
  ): Promise<Omit<User, 'passwordHash'> & { hasPassword: boolean }> {
    const userId = req.user.id; // take user ID from the request after authentication
    const user = await this.userService.findOneById(userId);

    // Very important: Remove the passwordHash field before returning to the client
    const { passwordHash, ...result } = user;
    return {
      ...result,
      hasPassword: !!passwordHash,
    };
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'User' })
  @Patch('me')
  async updateProfile(
    @Request() req,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto
  ): Promise<Omit<User, 'passwordHash'> & { hasPassword: boolean }> {
    const userId = req.user.id;
    const updatedUser = await this.userService.updateProfile(
      userId,
      updateUserDto
    );

    const { passwordHash, ...result } = updatedUser;
    return {
      ...result,
      hasPassword: !!passwordHash,
    };
  }

  @Auditable({ action: AuditAction.DELETE, entity: 'User' })
  @Delete('me')
  async deactivateAccount(@Request() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.userService.deactivate(userId);
    return { message: 'Tài khoản của bạn đã được vô hiệu hóa thành công.' };
  }

  @Auditable({ action: AuditAction.UPDATE, entity: 'UserEmail' })
  @Post('request-email-change')
  async requestEmailChange(@Request() req, @Body() body: EmailChangeDto) {
    const userId = req.user.id;
    return await this.emailChangeService.requestEmailChange(
      userId,
      body.newEmail,
      body.password
    );
  }

  @Get('pending-email-change')
  async getPendingEmailChange(@Request() req) {
    const userId = req.user.id;
    const pendingRequest = await this.emailChangeService.getPendingEmailChange(userId);
    return pendingRequest
      ? {
          newEmail: pendingRequest.newEmail,
          expiresAt: pendingRequest.expiresAt,
        }
      : null;
  }

  @Post('cancel-email-change')
  async cancelEmailChange(@Request() req) {
    const userId = req.user.id;
    return await this.emailChangeService.cancelEmailChange(userId);
  }
}
