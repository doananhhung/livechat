
// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User, Invitation, Project } from '../database/entities';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService
  ) {
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
      from: `"Live Chat" <${this.configService.get<string>('MAIL_USER')}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Message sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      // Depending on your app's needs, you might want to throw the error
      // or handle it gracefully.
      throw new Error('Could not send email.');
    }
  }

  async sendUserConfirmation(user: User, token: string) {
    const { subject, html } = this.emailTemplateService.getUserConfirmationTemplate(user, token);
    await this.sendMail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user: User, token: string) {
    const { subject, html } = this.emailTemplateService.getPasswordResetTemplate(user, token);
    await this.sendMail(user.email, subject, html);
  }

  /**
   * Send email change verification to new email address
   * @param user User requesting email change
   * @param newEmail New email address
   * @param token Verification token
   */
  async sendEmailChangeVerification(
    user: User,
    newEmail: string,
    token: string
  ) {
    const { subject, html } = this.emailTemplateService.getEmailChangeVerificationTemplate(user, newEmail, token);
    await this.sendMail(newEmail, subject, html);
  }

  /**
   * Send confirmation to old email address after successful email change
   * @param oldEmail Old email address
   * @param newEmail New email address
   * @param userName User's full name
   */
  async sendEmailChangeConfirmation(
    oldEmail: string,
    newEmail: string,
    userName: string
  ) {
    const { subject, html } = this.emailTemplateService.getEmailChangeConfirmationTemplate(oldEmail, newEmail, userName);
    await this.sendMail(oldEmail, subject, html);
  }

  /**
   * Send notification to old email address about email change request
   * @param user User requesting email change
   * @param newEmail New email address
   */
  async sendEmailChangeNotification(user: User, newEmail: string) {
    const { subject, html } = this.emailTemplateService.getEmailChangeNotificationTemplate(user, newEmail);
    await this.sendMail(user.email, subject, html);
  }

  async sendInvitationEmail(invitation: Invitation, project: Project, existingUser?: User) {
    const { subject, html, invitationUrl } = this.emailTemplateService.getInvitationTemplate(invitation, project, existingUser);
    
    if (!existingUser) {
      this.logger.log(`Sending NEW USER invitation to ${invitation.email} - Link: ${invitationUrl}`);
    } else {
      this.logger.log(`Sending EXISTING USER invitation to ${invitation.email} (userId: ${existingUser.id}) - Link: ${invitationUrl}`);
    }

    await this.sendMail(invitation.email, subject, html);
  }
}
