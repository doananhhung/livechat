import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const expected = 'Hello World!';
      appService.getHello.mockReturnValue(expected);

      const result = appController.getHello();

      expect(appService.getHello).toHaveBeenCalled();
      expect(result).toBe(expected);
    });
  });
});