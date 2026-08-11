import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { FeatureFlagsService } from './feature-flags.service';
import { StaleFlagSweepService } from './stale-flag-sweep.service';
import { AuditLogService } from '../audit/audit.service';

jest.mock('axios');

describe('StaleFlagSweepService', () => {
  let service: StaleFlagSweepService;
  let flagsService: { getStaleFlags: jest.Mock };
  let flagStore: { getFlag: jest.Mock; setFlag: jest.Mock };
  let audit: { log: jest.Mock };

  const staleFlag = (key: string, extra: Record<string, unknown> = {}) => ({
    key,
    enabled: true,
    staleAfter: '2020-01-01',
    owner: 'payments',
    ...extra,
  });

  beforeEach(async () => {
    flagsService = { getStaleFlags: jest.fn() };
    flagStore = { getFlag: jest.fn(), setFlag: jest.fn().mockResolvedValue(undefined) };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleFlagSweepService,
        { provide: FeatureFlagsService, useValue: flagsService },
        { provide: FeatureFlagService, useValue: flagStore },
        { provide: AuditLogService, useValue: audit },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const env: Record<string, unknown> = {
                NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
                ADMIN_BASE_URL: 'http://localhost:4016',
                STALE_FLAG_NOTIFY_EMAIL: 'ops@azeebo.plus',
                FLAG_OWNER_EMAILS: JSON.stringify({ payments: 'pay@azeebo.plus' }),
                STALE_FLAG_SWEEP_INTERVAL_MS: 60_000,
              };
              return env[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(StaleFlagSweepService);
    jest.clearAllMocks();
    (axios.post as jest.Mock).mockResolvedValue({ status: 200 });
  });

  it('notifies the mapped owner email once and stamps staleNotifiedAt', async () => {
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    flagStore.getFlag.mockResolvedValue({
      key: 'expired_a',
      enabled: true,
      staleAfter: '2020-01-01',
      owner: 'payments',
    });

    const result = await service.runSweep();

    expect(result.notified).toEqual(['expired_a']);
    expect(axios.post).toHaveBeenCalledWith(
      'http://notification-service:3006/v1/notifications/email',
      expect.objectContaining({
        to: 'pay@azeebo.plus',
        template: 'flag-stale',
        data: expect.objectContaining({
          flagKey: 'expired_a',
          owner: 'payments',
          staleAfter: '2020-01-01',
          adminUrl: 'http://localhost:4016/admin/global-feature-flags',
        }),
      })
    );
    // Stamped exactly once, preserving the stored flag.
    expect(flagStore.setFlag).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'expired_a',
        staleAfter: '2020-01-01',
        staleNotifiedAt: expect.any(String),
      })
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.stale_notified',
        targetId: 'expired_a',
        details: expect.objectContaining({ recipient: 'pay@azeebo.plus', channel: 'email' }),
      })
    );
  });

  it('skips flags that were already notified (dedupe)', async () => {
    flagsService.getStaleFlags.mockResolvedValue([
      staleFlag('already_done', { staleNotifiedAt: '2026-08-01T00:00:00.000Z' }),
      staleFlag('new_one'),
    ]);
    flagStore.getFlag.mockResolvedValue({ key: 'new_one', enabled: true });

    const result = await service.runSweep();

    expect(result.alreadyNotified).toEqual(['already_done']);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(flagStore.setFlag).toHaveBeenCalledTimes(1);
  });

  it('does NOT stamp when the notification send fails (retried next sweep)', async () => {
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    (axios.post as jest.Mock).mockRejectedValue(new Error('notification-service down'));

    const result = await service.runSweep();

    expect(result.failed).toEqual(['expired_a']);
    expect(result.notified).toEqual([]);
    expect(flagStore.setFlag).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'feature_flag.stale_notified' })
    );
  });

  it('falls back to the ops digest email for owners without a mapping', async () => {
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a', { owner: 'unknown-team' })]);
    flagStore.getFlag.mockResolvedValue({ key: 'expired_a', enabled: true, owner: 'unknown-team' });

    const result = await service.runSweep();

    expect(result.notified).toEqual(['expired_a']);
    expect(axios.post).toHaveBeenCalledWith(
      'http://notification-service:3006/v1/notifications/email',
      expect.objectContaining({ to: 'ops@azeebo.plus' })
    );
  });

  it('stamps without email when no recipient is configured (idempotent dev mode)', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleFlagSweepService,
        { provide: FeatureFlagsService, useValue: flagsService },
        { provide: FeatureFlagService, useValue: flagStore },
        { provide: AuditLogService, useValue: audit },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const env: Record<string, unknown> = {
                NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
                ADMIN_BASE_URL: 'http://localhost:4016',
                STALE_FLAG_SWEEP_INTERVAL_MS: 60_000,
              };
              return env[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();
    const noRecipientService = module.get(StaleFlagSweepService);
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    flagStore.getFlag.mockResolvedValue({ key: 'expired_a', enabled: true });

    const result = await noRecipientService.runSweep();

    expect(result.noRecipientStamped).toEqual(['expired_a']);
    expect(axios.post).not.toHaveBeenCalled();
    expect(flagStore.setFlag).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'expired_a', staleNotifiedAt: expect.any(String) })
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'feature_flag.stale_notified',
        details: expect.objectContaining({ channel: 'no-recipient' }),
      })
    );
  });

  it('no stale flags → empty summary and no side effects', async () => {
    flagsService.getStaleFlags.mockResolvedValue([]);

    const result = await service.runSweep();

    expect(result).toEqual({
      checked: 0,
      stale: 0,
      notified: [],
      alreadyNotified: [],
      failed: [],
      noRecipientStamped: [],
    });
    expect(axios.post).not.toHaveBeenCalled();
    expect(flagStore.setFlag).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('tolerates invalid FLAG_OWNER_EMAILS JSON (falls back to ops digest)', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaleFlagSweepService,
        { provide: FeatureFlagsService, useValue: flagsService },
        { provide: FeatureFlagService, useValue: flagStore },
        { provide: AuditLogService, useValue: audit },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const env: Record<string, unknown> = {
                NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
                ADMIN_BASE_URL: 'http://localhost:4016',
                STALE_FLAG_NOTIFY_EMAIL: 'ops@azeebo.plus',
                FLAG_OWNER_EMAILS: '{not valid json',
                STALE_FLAG_SWEEP_INTERVAL_MS: 60_000,
              };
              return env[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();
    const svc = module.get(StaleFlagSweepService);
    flagsService.getStaleFlags.mockResolvedValue([staleFlag('expired_a')]);
    flagStore.getFlag.mockResolvedValue({ key: 'expired_a', enabled: true });

    const result = await svc.runSweep();

    expect(result.notified).toEqual(['expired_a']);
    expect(axios.post).toHaveBeenCalledWith(
      'http://notification-service:3006/v1/notifications/email',
      expect.objectContaining({ to: 'ops@azeebo.plus' })
    );
  });
});
