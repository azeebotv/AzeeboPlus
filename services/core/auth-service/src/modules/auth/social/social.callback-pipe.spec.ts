import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { SocialAuthController } from './social.controller.js';
import { SocialAuthService } from './social.service.js';
import { FeatureFlagGuard, FeatureFlagService } from '@azeebo/feature-flags';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard.js';

/**
 * The DTO spec pins the rule; this pins the behaviour a client actually sees.
 *
 * The original defect was invisible to a DTO unit test in the sense that
 * mattered: the request path rejected Apple's cancellation with a
 * `ValidationPipe` 400 whose message was about `code`, and the handler's
 * provider-error branch never ran. Here the real pipe is installed, so the two
 * 400s are distinguishable by their messages.
 */

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('POST /auth/social/callback — validation pipe boundary', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockSocialAuthService = {
    validateState: jest.fn().mockResolvedValue({ provider: 'apple', redirect: '/home' }),
    verifyAppleToken: jest.fn().mockResolvedValue({ email: 'a@example.com', sub: 'a-1' }),
    verifyGoogleToken: jest.fn().mockResolvedValue({ email: 'g@example.com', sub: 'g-1' }),
    exchangeAppleCode: jest.fn().mockResolvedValue({ id_token: 'idt', access_token: 'at' }),
    exchangeGoogleCode: jest.fn().mockResolvedValue({ id_token: 'idt', access_token: 'at' }),
    socialLogin: jest.fn().mockResolvedValue({
      success: true,
      data: {
        user: { id: 'u-1', email: 'a@example.com', displayName: 'A', role: 'user' },
        access_token: 'z.z.z',
        refresh_token: 'z.z.z',
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
      providers: [
        { provide: SocialAuthService, useValue: mockSocialAuthService },
        // The provider guards are real, not overridden, so the controller
        // wires the same way it does in the running service.
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Same pipe configuration the real service applies.
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes an Apple cancellation to the handler instead of rejecting it as malformed', async () => {
    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state: 'state-abc', error: 'user_cancelled_authorize' })
      .expect(400);

    // The handler's branch, not the pipe's.
    expect(JSON.stringify(res.body)).toContain('provider reported an error');
    expect(JSON.stringify(res.body)).not.toContain('code should not be empty');
    // It must not have gone on to exchange anything.
    expect(mockSocialAuthService.validateState).not.toHaveBeenCalled();
  });

  it('still rejects a callback that omits both code and error', async () => {
    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state: 'state-abc' })
      .expect(400);

    expect(JSON.stringify(res.body)).toContain('code should not be empty');
  });

  it('rejects a callback with no state at all', async () => {
    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ code: 'auth-code' })
      .expect(400);

    expect(JSON.stringify(res.body)).toContain('state');
  });

  it('processes a normal success callback', async () => {
    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state: 'state-abc', code: 'auth-code' })
      .expect(201);

    expect(mockSocialAuthService.validateState).toHaveBeenCalledWith('state-abc');
    expect(mockSocialAuthService.exchangeAppleCode).toHaveBeenCalledWith('auth-code');
    expect(mockSocialAuthService.socialLogin).toHaveBeenCalled();
    // The return target from the state record rides back to the browser client.
    expect(res.body.redirect).toBe('/home');
  });
});
