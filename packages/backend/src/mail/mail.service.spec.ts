import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { EmailTemplateService } from './email-template.service';
import * as nodemailer from 'nodemailer';
import { User } from '../database/entities';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<ConfigService>;
  let emailTemplateService: jest.Mocked<EmailTemplateService>;
  let transporter: jest.Mocked<nodemailer.Transporter>;

  beforeEach(async () => {
    transporter = {
      sendMail: jest.fn(),
    } as unknown as jest.Mocked<nodemailer.Transporter>;
    (nodemailer.createTransport as jest.Mock).mockReturnValue(transporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              if (key === 'MAIL_USER') return 'test@example.com';
              return key; // Return key for other mail config values
            }),
          },
        },
        {
          provide: EmailTemplateService,
          useValue: {
            getUserConfirmationTemplate: jest.fn().mockReturnValue({
              subject: 'Welcome - Verify Email',
              html: '<p>Test HTML with confirm-token</p>',
            }),
            getPasswordResetTemplate: jest.fn().mockReturnValue({
              subject: 'Password Reset',
              html: '<p>Test HTML with reset-token</p>',
            }),
            getEmailChangeVerificationTemplate: jest.fn().mockReturnValue({
              subject: 'Verify Email Change',
              html: '<p>Email change verification</p>',
            }),
            getEmailChangeConfirmationTemplate: jest.fn().mockReturnValue({
              subject: 'Email Changed',
              html: '<p>Email change confirmation</p>',
            }),
            getEmailChangeNotificationTemplate: jest.fn().mockReturnValue({
              subject: 'Email Change Notification',
              html: '<p>Email change notification</p>',
            }),
            getInvitationTemplate: jest.fn().mockReturnValue({
              subject: 'Invitation to Join',
              html: '<p>Invitation</p>',
              invitationUrl: 'http://localhost:3000/invite',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get(ConfigService);
    emailTemplateService = module.get(EmailTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should send an email with correct options', async () => {
      transporter.sendMail.mockResolvedValue({ messageId: '123' });
      await service.sendMail('to@test.com', 'Subject', '<p>Hello</p>');

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@test.com',
          subject: 'Subject',
          html: '<p>Hello</p>',
        })
      );
    });

    it('should throw an error if sending fails', async () => {
      transporter.sendMail.mockRejectedValue(new Error('Send failed'));
      await expect(service.sendMail('a', 'b', 'c')).rejects.toThrow(
        'Could not send email.'
      );
    });
  });

  describe('sendUserConfirmation', () => {
    it('should send a confirmation email', async () => {
      const user = { fullName: 'Tester', email: 'test@user.com' } as User;
      const token = 'confirm-token';
      transporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendUserConfirmation(user, token);

      expect(emailTemplateService.getUserConfirmationTemplate).toHaveBeenCalledWith(user, token);
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: 'Welcome - Verify Email',
        })
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      const user = { fullName: 'Tester', email: 'test@user.com' } as User;
      const token = 'reset-token';
      transporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendPasswordResetEmail(user, token);

      expect(emailTemplateService.getPasswordResetTemplate).toHaveBeenCalledWith(user, token);
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: 'Password Reset',
        })
      );
    });
  });
});
