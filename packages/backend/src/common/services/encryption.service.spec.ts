import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { ConfigService } from '@nestjs/config';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    configService = module.get(ConfigService);
  });

  describe('with valid key', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('12345678901234567890123456789012');
      service = new EncryptionService(configService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should encrypt and decrypt a string successfully', () => {
      const text = 'my secret text';
      const encrypted = service.encrypt(text);
      const decrypted = service.decrypt(encrypted);

      expect(encrypted).not.toEqual(text);
      expect(decrypted).toEqual(text);
    });

    it('should return a string in the correct format', () => {
      const text = 'my secret text';
      const encrypted = service.encrypt(text);
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
    });

    it('should throw an error for invalid encrypted text format', () => {
      const invalidEncryptedText = 'invalid-text';
      expect(() => service.decrypt(invalidEncryptedText)).toThrow(
        'Could not decrypt token.'
      );
    });
  });

  describe('constructor validation', () => {
    it('should throw an error if encryption key is not configured', () => {
      configService.get.mockReturnValue(null);
      expect(() => new EncryptionService(configService)).toThrow(
        'ENCRYPTION_KEY must be defined in .env '
      );
    });

    it('should throw an error if encryption key is not 32 characters long', () => {
      configService.get.mockReturnValue('short-key');
      expect(() => new EncryptionService(configService)).toThrow(
        'ENCRYPTION_KEY must be 32 characters long.'
      );
    });
  });
});