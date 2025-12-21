import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../database/entities';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let configService: jest.Mocked<ConfigService>;
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
              return key; // Return key for other mail config values
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get(ConfigService);
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
      service.sendMail = jest.fn(); // Mock sendMail directly

      await service.sendUserConfirmation(user, token);

      expect(service.sendMail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('xác thực email'),
        expect.stringContaining(token)
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      const user = { fullName: 'Tester', email: 'test@user.com' } as User;
      const token = 'reset-token';
      service.sendMail = jest.fn(); // Mock sendMail directly

      await service.sendPasswordResetEmail(user, token);

      expect(service.sendMail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('Đặt lại mật khẩu'),
        expect.stringContaining(token)
      );
    });
  });
});

