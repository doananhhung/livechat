// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '@social-commerce/shared';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Create a transporter object using the SMTP transport
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'), // 'smtp.gmail.com'
      port: this.configService.get<number>('MAIL_PORT'), // 465
      secure: this.configService.get<boolean>('MAIL_SECURE'), // true
      auth: {
        user: this.configService.get<string>('MAIL_USER'), // Your Gmail address from .env
        pass: this.configService.get<string>('MAIL_APP_PASSWORD'), // Your App Password from .env
      },
    });
  }

  /**
   * Sends an email.
   * @param to The recipient's email address.
   * @param subject The subject of the email.
   * @param html The HTML content of the email.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"Social Commerce" <${this.configService.get<string>('MAIL_USER')}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      // Depending on your app's needs, you might want to throw the error
      // or handle it gracefully.
      throw new Error('Could not send email.');
    }
  }

  async sendUserConfirmation(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    const subject =
      'Chào mừng bạn đến với Social Commerce! Vui lòng xác thực email của bạn';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Social Commerce. Vui lòng nhấp vào liên kết bên dưới để xác thực địa chỉ email của bạn:</p>
      <a href="${url}">Xác thực Email</a>
      <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ Social Commerce</p>
    `;

    await this.sendMail(user.email, subject, html);
  }
}
