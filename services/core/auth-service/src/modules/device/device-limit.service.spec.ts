import { Test, TestingModule } from '@nestjs/testing';
import { DeviceLimitService } from './device-limit.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, subscriptionFlags } from '@azeebo/feature-flags';
import axios from 'axios';

jest.mock('axios');

describe('DeviceLimitService', () => {
  let service: DeviceLimitService;
  let prisma: { registeredDevice: { count: jest.Mock } };
  let flagService: { isEnabled: jest.Mock };

  beforeEach(async () => {
    process.env.GATEWAY_SECRET = 'test-gateway-secret';
    prisma = {
      registeredDevice: { count: jest.fn().mockResolvedValue(2) },
    };
    flagService = { isEnabled: jest.fn().mockResolvedValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceLimitService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'DEFAULT_MAX_DEVICES') return 1;
              if (key === 'SUBSCRIPTION_SERVICE_URL') return 'http://subscription-service:3010';
              return defaultValue;
            }),
          },
        },
        { provide: FeatureFlagService, useValue: flagService },
      ],
    }).compile();

    service = module.get<DeviceLimitService>(DeviceLimitService);
    (axios.get as jest.Mock).mockReset();
  });

  it('uses the DEFAULT_MAX_DEVICES cap when subscription_device_limits is off', async () => {
    flagService.isEnabled.mockResolvedValue(false);

    const result = await service.checkDeviceLimit('user-1');

    expect(result.maxDevices).toBe(1);
    expect(result.source).toBe('default');
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('uses the plan maxDevices when the flag is on and the user has a plan', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === subscriptionFlags.deviceLimits)
    );
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          plan: { maxDevices: 3, maxStreams: 2 },
        },
      },
    });

    const result = await service.checkDeviceLimit('user-1');

    expect(result.maxDevices).toBe(3);
    expect(result.source).toBe('plan');
    expect(result.allowed).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(
      'http://subscription-service:3010/v1/subscriptions/current',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-user-id': 'user-1' }),
      })
    );
  });

  it('falls back to the default cap when the plan fetch fails', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === subscriptionFlags.deviceLimits)
    );
    (axios.get as jest.Mock).mockRejectedValue(new Error('subscription-service down'));

    const result = await service.checkDeviceLimit('user-1');

    expect(result.maxDevices).toBe(1);
    expect(result.source).toBe('default');
  });

  it('falls back to the default cap when the user has no active subscription', async () => {
    flagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === subscriptionFlags.deviceLimits)
    );
    (axios.get as jest.Mock).mockResolvedValue({ data: { data: null } });

    const result = await service.checkDeviceLimit('user-1');

    expect(result.maxDevices).toBe(1);
    expect(result.source).toBe('default');
  });
});
