import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { FeatureFlagsService } from './feature-flags.service';
import { AuditLogService } from '../audit/audit.service';

/**
 * Stale-flag sweep: periodically finds flags whose `staleAfter` has passed and
 * notifies their owner (or the ops digest fallback) so nothing lingers past
 * its expiry.
 *
 * Each flag is notified at most once — the sweep stamps `staleNotifiedAt` on
 * the flag after a successful notification (or when no recipient is configured,
 * so dev runs stay quiet), and skips already-notified flags on later runs. A
 * failed send is NOT stamped, so the next sweep retries it.
 *
 * Recipients (env):
 *   FLAG_OWNER_EMAILS     JSON map of owner → email, e.g. {"payments":"p@x.dev"}
 *   STALE_FLAG_NOTIFY_EMAIL  ops digest fallback for flags without a mapped owner
 *   NOTIFICATION_SERVICE_URL  default http://notification-service:3006
 *   STALE_FLAG_SWEEP_INTERVAL_MS  default 6h (starts once at boot too)
 *   ADMIN_BASE_URL        link in the email, default http://localhost:4016
 *
 * Emails go through the notification-service's internal transactional endpoint
 * (POST /v1/notifications/email, template `flag-stale`) — the same path
 * auth-service uses for verification/reset emails.
 */
@Injectable()
export class StaleFlagSweepService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StaleFlagSweepService.name);
  private readonly notificationServiceUrl: string;
  private readonly ownerEmails: Record<string, string>;
  private readonly fallbackEmail?: string;
  private readonly adminBaseUrl: string;
  private readonly intervalMs: number;
  private interval?: NodeJS.Timeout;

  constructor(
    @Inject(FeatureFlagsService) private readonly flagsService: FeatureFlagsService,
    @Inject(FeatureFlagService) private readonly flagStore: FeatureFlagService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.notificationServiceUrl = this.configService.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://notification-service:3006'
    );
    this.adminBaseUrl = this.configService.get<string>(
      'ADMIN_BASE_URL',
      'http://localhost:4016'
    );
    this.fallbackEmail = this.configService.get<string>('STALE_FLAG_NOTIFY_EMAIL');
    const rawOwners = this.configService.get<string>('FLAG_OWNER_EMAILS', '{}');
    try {
      this.ownerEmails = JSON.parse(rawOwners) as Record<string, string>;
    } catch {
      this.logger.warn('FLAG_OWNER_EMAILS is not valid JSON — ignoring owner mapping');
      this.ownerEmails = {};
    }
    this.intervalMs = this.configService.get<number>(
      'STALE_FLAG_SWEEP_INTERVAL_MS',
      6 * 60 * 60 * 1000
    );
  }

  onModuleInit(): void {
    // Run once at boot, then on the configured interval (unref'd so tests /
    // short-lived processes never stay alive just because of the sweep).
    void this.runSweep();
    this.interval = setInterval(() => void this.runSweep(), this.intervalMs);
    this.interval.unref();
    this.logger.log(
      `Stale-flag sweep scheduled every ${Math.round(this.intervalMs / 60000)}m` +
        (this.fallbackEmail ? ` (ops digest → ${this.fallbackEmail})` : '')
    );
  }

  onModuleDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  /** One sweep pass: notify owners of newly-stale flags, stamping each once. */
  async runSweep(): Promise<{
    checked: number;
    stale: number;
    notified: string[];
    alreadyNotified: string[];
    failed: string[];
    noRecipientStamped: string[];
  }> {
    const stale = await this.flagsService.getStaleFlags();
    const notified: string[] = [];
    const alreadyNotified: string[] = [];
    const failed: string[] = [];
    const noRecipientStamped: string[] = [];

    for (const flag of stale) {
      if (flag.staleNotifiedAt) {
        alreadyNotified.push(flag.key);
        continue;
      }

      const recipient =
        (flag.owner ? this.ownerEmails[flag.owner] : undefined) ?? this.fallbackEmail;

      if (recipient) {
        try {
          await axios.post(`${this.notificationServiceUrl}/v1/notifications/email`, {
            to: recipient,
            template: 'flag-stale',
            data: {
              flagKey: flag.key,
              owner: flag.owner,
              staleAfter: flag.staleAfter,
              enabled: flag.enabled,
              description: flag.description,
              adminUrl: `${this.adminBaseUrl}/admin/global-feature-flags`,
            },
          });
          await this.stampNotified(flag.key, recipient, 'email');
          notified.push(flag.key);
          this.logger.log(`Notified ${recipient} about stale flag ${flag.key}`);
        } catch (error) {
          // Leave unstamped → retried on the next sweep.
          failed.push(flag.key);
          this.logger.warn(
            `Failed to notify about stale flag ${flag.key}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else {
        // No recipient configured (dev) — stamp + audit so the flag is flagged
        // once and the run stays idempotent, without spamming logs.
        await this.stampNotified(flag.key, undefined, 'no-recipient');
        noRecipientStamped.push(flag.key);
        this.logger.warn(
          `Stale flag ${flag.key} has no owner email and no STALE_FLAG_NOTIFY_EMAIL — ` +
            'stamped as notified (configure FLAG_OWNER_EMAILS to actually notify)'
        );
      }
    }

    this.logger.log(
      `Stale sweep: ${stale.length} stale (${notified.length} notified, ` +
        `${alreadyNotified.length} already notified, ${failed.length} failed, ` +
        `${noRecipientStamped.length} stamped without recipient)`
    );
    return {
      checked: stale.length,
      stale: stale.length,
      notified,
      alreadyNotified,
      failed,
      noRecipientStamped,
    };
  }

  /** Writes staleNotifiedAt onto the stored flag, preserving everything else. */
  private async stampNotified(key: string, recipient?: string, channel?: string): Promise<void> {
    const flag = (await this.flagStore.getFlag(key)) ?? { key, enabled: false };
    await this.flagStore.setFlag({
      ...flag,
      key,
      staleNotifiedAt: new Date().toISOString(),
    });
    await this.auditService.log({
      actorId: 'system',
      actorType: 'system',
      action: 'feature_flag.stale_notified',
      targetType: 'feature_flag',
      targetId: key,
      details: { staleAfter: flag?.staleAfter, notifiedAt: new Date().toISOString(), recipient, channel },
    });
  }
}
