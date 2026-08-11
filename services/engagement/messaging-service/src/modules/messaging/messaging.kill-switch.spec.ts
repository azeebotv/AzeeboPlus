import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { MessagingController } from './messaging.controller.js';
import { MessagingService } from './messaging.service.js';
import { FeatureFlagGuard, FeatureFlagService, messagingFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));

import { RateLimitGuard, ServiceAuthGuard } from '@azeebo/security';

class MockServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  }
}
class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockMessagingService = {
  getConversations: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getMessages: jest.fn().mockResolvedValue({ success: true, data: [] }),
  createConversation: jest.fn().mockResolvedValue({ success: true, data: {} }),
  sendMessage: jest.fn().mockResolvedValue({ success: true, data: {} }),
  markAsRead: jest.fn().mockResolvedValue({ success: true }),
  deleteConversation: jest.fn().mockResolvedValue({ success: true, data: {} }),
  addParticipant: jest.fn().mockResolvedValue({ success: true, data: {} }),
  removeParticipant: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the messaging controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(messagingFlags.*) actually gate the routes.
 * With the flags off, the gated routes (read receipts) must 403 before the
 * service runs, while the DM routes (dmEnabled on) pass through.
 */
describe('Messaging kill-switch (messaging_* flags)', () => {
  let app: INestApplication;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all messaging flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
    jest.clearAllMocks();
  });

  it('403s the read-receipt endpoint when messaging_read_receipts is off', async () => {
    const res = await request(app.getHttpServer())
      .post('/messaging/conversations/c1/read')
      .set('Authorization', 'Bearer test')
      .send({ messageId: 'm1' });

    expect(res.status).toBe(403);
    expect(mockMessagingService.markAsRead).not.toHaveBeenCalled();
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      messagingFlags.readReceipts
    );
  });

  it('passes the DM routes through when messaging_dm_enabled is on', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === messagingFlags.dmEnabled)
    );

    const res = await request(app.getHttpServer())
      .get('/messaging/conversations')
      .set('Authorization', 'Bearer test');

    expect(res.status).toBe(200);
    expect(mockMessagingService.getConversations).toHaveBeenCalled();
  });
});
