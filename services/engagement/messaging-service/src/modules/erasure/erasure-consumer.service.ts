import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBusService, EventTypes, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { PrismaService } from '../database/prisma.service.js';

/**
 * Nulls message content when a user exercises their right to erasure
 * (GDPR Art. 17). Rows are kept (conversations stay coherent for other
 * participants) but every trace of the erased user's words, media and
 * reactions is removed.
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
        await this.eraseMessageContent(userId);
      })
      .catch((error: unknown) => {
        this.logger.error(`Failed to register ${EventTypes.USER_ERASURE_REQUESTED} handler`, error);
      });
  }

  private async eraseMessageContent(userId: string): Promise<void> {
    try {
      const reactions = await this.prisma.messageReaction.deleteMany({
        where: { userId },
      });

      const { count } = await this.prisma.message.updateMany({
        where: { senderId: userId, isDeleted: false },
        data: {
          content: '[deleted]',
          mediaUrl: null,
          isDeleted: true,
        },
      });

      this.logger.log(
        `Erasure: nulled ${count} message(s) and removed ${reactions.count} reaction(s) for user ${userId}`
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erasure purge failed in messaging DB for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
