// src/mail/mail.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { GlobalRole } from '@live-chat/shared-types';

@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  /**
   * Test endpoint for sending emails.
   * Restricted to ADMIN users only to prevent abuse.
   */
  @Post('test-send')
  @Roles(GlobalRole.ADMIN)
  async sendTestEmail(@Body('to') to: string) {
    const subject = 'Email kiểm tra từ NestJS';
    const html =
      '<h1>Đây là email được gửi từ MailService!</h1><p>Nếu bạn nhận được email này, mọi thứ đã hoạt động thành công.</p>';

    await this.mailService.sendMail(to, subject, html);

    return {
      message: `Đã gửi email kiểm tra tới ${to}`,
    };
  }
}
