import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { CircuitBreakerOpenError } from '@azeebo/shared-types';

jest.mock('@sendgrid/mail');
const mockedSgMail = sgMail as jest.Mocked<typeof sgMail>;

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'SENDGRID_API_KEY') return 'test-api-key';
              if (key === 'SENDGRID_FROM_EMAIL') return 'no-reply@test.com';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email successfully (happy path)', async () => {
      mockedSgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        'welcome',
        { displayName: 'Test User' }
      );

      expect(result).toBe(true);
      expect(mockedSgMail.send).toHaveBeenCalled();
    });

    it('should return false when email is disabled', async () => {
      const mockConfigService = {
        get: jest.fn(() => null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      await disabledService.onModuleInit();

      const result = await disabledService.sendEmail(
        'test@example.com',
        'Test',
        'welcome',
        {}
      );

      expect(result).toBe(false);
    });

    it('should return false when template not found', async () => {
      const result = await service.sendEmail(
        'test@example.com',
        'Test',
        'non-existent-template',
        {}
      );

      expect(result).toBe(false);
    });

    it('should handle circuit breaker open error', async () => {
      mockedSgMail.send.mockImplementation(() => {
        throw new CircuitBreakerOpenError('Circuit breaker is open');
      });

      const result = await service.sendEmail(
        'test@example.com',
        'Test',
        'welcome',
        { displayName: 'Test' }
      );

      expect(result).toBe(false);
    });

    it('should handle send error gracefully', async () => {
      mockedSgMail.send.mockRejectedValue(new Error('Send failed'));

      const result = await service.sendEmail(
        'test@example.com',
        'Test',
        'welcome',
        { displayName: 'Test' }
      );

      expect(result).toBe(false);
    });
  });

  describe('sendCustomEmail', () => {
    it('should send custom email successfully', async () => {
      mockedSgMail.send.mockResolvedValue([{ statusCode: 202 }]);

      const result = await service.sendCustomEmail(
        'test@example.com',
        'Custom Subject',
        '<html>Test</html>'
      );

      expect(result).toBe(true);
      expect(mockedSgMail.send).toHaveBeenCalled();
    });

    it('should return false when email is disabled', async () => {
      const mockConfigService = {
        get: jest.fn(() => null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      await disabledService.onModuleInit();

      const result = await disabledService.sendCustomEmail(
        'test@example.com',
        'Test',
        '<html>Test</html>'
      );

      expect(result).toBe(false);
    });
  });

  describe('addTemplate', () => {
    it('should add a new template', () => {
      service.addTemplate('test-template', '<p>Hello {{name}}</p>');

      const result = service.sendEmail(
        'test@example.com',
        'Test',
        'test-template',
        { name: 'World' }
      );

      expect(result).resolves.toBe(true);
    });
  });

  describe('getCircuitBreakerStats', () => {
    it('should return circuit breaker stats', () => {
      const stats = service.getCircuitBreakerStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });
});