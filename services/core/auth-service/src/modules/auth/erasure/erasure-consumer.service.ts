import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBusService, EventTypes, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Purges identity PII from the auth DB when a user exercises their right
 * to erasure (GDPR Art. 17). The user-service anonymizes its own DB and
 * publishes `user.erasure.requested`; every owning service is responsible
 * for its own records — this service owns credentials, sessions, devices
 * and linked social accounts.
 */
@Injectable()
export class ErasureConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ErasureConsumerService.name);

  constructor(
    @Inject(EVENT_BUS_SERVICE) private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit(): void {
    void this.eventBus
      .subscribe(EventTypes.USER_ERASURE_REQUESTED, async (event) => {
        const userId = (event.data as { userId?: string }).userId;
        if (!userId) return;
        await this.eraseUserRecords(userId);
      })
      .catch((error: unknown) => {
        this.logger.error(`Failed to register ${EventTypes.USER_ERASURE_REQUESTED} handler`, error);
      });
  }

  private async eraseUserRecords(userId: string): Promise<void> {
    try {
      await this.prisma.session.deleteMany({ where: { userId } });
      await this.prisma.otp.deleteMany({ where: { userId } });
      await this.prisma.socialAccount.deleteMany({ where: { userId } });
      await this.prisma.registeredDevice.deleteMany({ where: { userId } });
      await this.prisma.deviceLinkCode.deleteMany({ where: { userId } });

      // Anonymize the identity row itself — the email/password/MFA secrets
      // must not survive erasure. password '' matches the column default
      // (no valid bcrypt hash), so the account can never authenticate.
      await this.prisma.user
        .update({
          where: { id: userId },
          data: {
            email: `deleted_${userId}@anonymized.local`,
            displayName: 'Deleted User',
            avatar: null,
            password: '',
            mfaSecret: null,
            mfaBackupCodes: null,
          },
        })
        .catch((error: unknown) => {
          // The auth DB row can already be gone (hard delete paths) — the
          // purge of the dependent rows above is what matters.
          this.logger.warn(
            `Could not anonymize auth user row ${userId}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        });

      this.logger.log(`Erasure completed in auth DB for user ${userId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Erasure purge failed in auth DB for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
