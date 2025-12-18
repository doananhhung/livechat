import { Test, TestingModule } from '@nestjs/testing';
import { SqsService } from './sqs.service';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Logger } from '@nestjs/common';

jest.mock('@aws-sdk/client-sqs');

describe('SqsService', () => {
  let service: SqsService;
  let sqsClient: jest.Mocked<SQSClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AWS_SQS_QUEUE_NAME') return 'test-queue';
              return key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SqsService>(SqsService);
    sqsClient = (SQSClient as jest.Mock).mock.instances[0];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should get the queue URL and log success', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      (sqsClient.send as jest.Mock).mockResolvedValue({ QueueUrl: 'test-url' });
      await service.onModuleInit();
      expect(sqsClient.send).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        'Successfully connected to SQS queue: test-url'
      );
    });

    it('should log an error if getting queue URL fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (sqsClient.send as jest.Mock).mockRejectedValue(new Error('SQS Error'));
      await expect(service.onModuleInit()).rejects.toThrow('SQS Error');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    beforeEach(async () => {
      (sqsClient.send as jest.Mock).mockResolvedValue({ QueueUrl: 'test-url' });
      await service.onModuleInit();
      (sqsClient.send as jest.Mock).mockClear();
    });

    it('should send a message to SQS and log success', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      (sqsClient.send as jest.Mock).mockResolvedValue({});
      const payload = { type: 'test', payload: { projectId: 123 } };
      await service.sendMessage(payload);

      expect(sqsClient.send).toHaveBeenCalledWith(
        expect.any(SendMessageCommand)
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully sent message')
      );
    });

    it('should log an error if sending fails', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      (sqsClient.send as jest.Mock).mockRejectedValue(new Error('Send Error'));
      await expect(service.sendMessage({ payload: {} })).rejects.toThrow(
        'Send Error'
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
