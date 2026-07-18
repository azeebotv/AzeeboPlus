import { NotificationProcessor, NotificationJobData } from './notification.processor';
import { EmailService, FirebaseService, SmsService } from '@azeebo/shared-services';
import { Job } from 'bullmq';

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let emailService: jest.Mocked<EmailService>;
  let firebaseService: jest.Mocked<FirebaseService>;
  let smsService: jest.Mocked<SmsService>;

  beforeEach(() => {
    emailService = { sendCustomEmail: jest.fn() } as unknown as jest.Mocked<EmailService>;
    firebaseService = {
      sendPushNotification: jest.fn(),
    } as unknown as jest.Mocked<FirebaseService>;
    smsService = { sendSms: jest.fn() } as unknown as jest.Mocked<SmsService>;

    processor = new NotificationProcessor(emailService, firebaseService, smsService);
  });

  afterEach(() => jest.clearAllMocks());

  function makeJob(data: NotificationJobData): Job<NotificationJobData> {
    return {
      id: 'job-1',
      data,
      attemptsMade: 0,
    } as unknown as Job<NotificationJobData>;
  }

  describe('process - push', () => {
    it('should send push notification to all tokens', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'push',
          title: 'Hello',
          message: 'World',
          pushTokens: ['token-a', 'token-b'],
        })
      );

      expect(firebaseService.sendPushNotification).toHaveBeenCalledTimes(2);
      expect(firebaseService.sendPushNotification).toHaveBeenCalledWith(
        'token-a',
        'Hello',
        'World',
        undefined
      );
    });

    it('should handle empty push tokens gracefully', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'push',
          title: 'Hello',
          message: 'World',
          pushTokens: [],
        })
      );

      expect(firebaseService.sendPushNotification).not.toHaveBeenCalled();
    });
  });

  describe('process - email', () => {
    it('should send email when address is provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Welcome',
          message: 'Welcome to Azeebo+',
          email: 'user@example.com',
        })
      );

      expect(emailService.sendCustomEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Welcome',
        '<p>Welcome to Azeebo+</p>'
      );
    });

    it('should escape HTML in email body', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Alert',
          message: '<script>alert("xss")</script>',
          email: 'user@example.com',
        })
      );

      expect(emailService.sendCustomEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Alert',
        '<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>'
      );
    });

    it('should skip email when no address provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'email',
          title: 'Hello',
          message: 'World',
        })
      );

      expect(emailService.sendCustomEmail).not.toHaveBeenCalled();
    });
  });

  describe('process - sms', () => {
    it('should send SMS when phone number is provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'sms',
          title: 'Alert',
          message: 'Your code is 1234',
          phone: '+2348012345678',
        })
      );

      expect(smsService.sendSms).toHaveBeenCalledWith('+2348012345678', 'Your code is 1234');
    });

    it('should skip SMS when no phone number provided', async () => {
      await processor.process(
        makeJob({
          userId: 'user-1',
          type: 'sms',
          title: 'Alert',
          message: 'Your code is 1234',
        })
      );

      expect(smsService.sendSms).not.toHaveBeenCalled();
    });
  });

  describe('process - unknown type', () => {
    it('should throw for unknown notification type', async () => {
      await expect(
        processor.process(
          makeJob({
            userId: 'user-1',
            type: 'unknown' as NotificationJobData['type'],
            title: 'Hello',
            message: 'World',
          })
        )
      ).rejects.toThrow('Unknown notification type: unknown');
    });
  });
});
