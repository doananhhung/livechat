import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendTestEmail', () => {
    it('should call mailService.sendMail and return a success message', async () => {
      const to = 'test@example.com';
      const result = await controller.sendTestEmail(to);

      expect(mailService.sendMail).toHaveBeenCalledWith(
        to,
        'Email kiểm tra từ NestJS',
        expect.any(String)
      );
      expect(result.message).toContain(to);
    });
  });
});