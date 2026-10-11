import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBusService, EventTypes, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Purges tokenized payment methods when a user exercises their right to
 * erasure (GDPR Art. 17). Transactions are intentionally retained —
 * financial records carry a statutory retention obligation — but the
 * provider tokens that could charge the user again must not survive.
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
        await this.erasePaymentMethods(userId);
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to register ${EventTypes.USER_ERASURE_REQUESTED} handler`,
          error
        );
      });
  }

  private async erasePaymentMethods(userId: string): Promise<void> {
    try {
      const { count } = await this.prisma.paymentMethod.deleteMany({
        where: { userId },
      });
      this.logger.log(`Erasure: removed ${count} payment method(s) for user ${userId}`);
    } catch (error: unknown) {
      this.logger.error(
        `Erasure purge failed in payment DB for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
