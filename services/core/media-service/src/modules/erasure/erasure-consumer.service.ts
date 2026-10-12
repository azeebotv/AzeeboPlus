import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBusService, EventTypes, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { PrismaService } from '../database/prisma.service.js';
import { S3Service } from '../upload/s3.service.js';

const S3_DELETE_CHUNK = 10;

/**
 * Deletes a user's stored media objects when they exercise their right to
 * erasure (GDPR Art. 17). Asset rows in the media DB are the index; every
 * S3 object they point to is batch-deleted by key before the rows go.
 */
@Injectable()
export class ErasureConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ErasureConsumerService.name);

  constructor(
    @Inject(EVENT_BUS_SERVICE) private readonly eventBus: EventBusService,
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  onModuleInit(): void {
    void this.eventBus
      .subscribe(EventTypes.USER_ERASURE_REQUESTED, async (event) => {
        const userId = (event.data as { userId?: string }).userId;
        if (!userId) return;
        await this.eraseUserMedia(userId);
      })
      .catch((error: unknown) => {
        this.logger.error(`Failed to register ${EventTypes.USER_ERASURE_REQUESTED} handler`, error);
      });
  }

  private async eraseUserMedia(userId: string): Promise<void> {
    try {
      const uploads = await this.prisma.mediaUpload.findMany({
        where: { userId },
        select: { id: true, key: true },
      });

      let deleted = 0;
      for (let i = 0; i < uploads.length; i += S3_DELETE_CHUNK) {
        const chunk = uploads.slice(i, i + S3_DELETE_CHUNK);
        await Promise.all(
          chunk.map(async (upload) => {
            try {
              await this.s3Service.deleteFile(upload.key);
              deleted += 1;
            } catch (error: unknown) {
              // One unreachable object must not block the rest of the purge;
              // the DB row survives so the reconcile job can retry it.
              this.logger.warn(
                `Erasure: failed to delete S3 object ${upload.key} for user ${userId}: ${
                  error instanceof Error ? error.message : String(error)
                }`
              );
            }
          })
        );
      }

      const { count } = await this.prisma.mediaUpload.deleteMany({ where: { userId } });

      this.logger.log(
        `Erasure: deleted ${deleted}/${uploads.length} S3 object(s) and ${count} asset row(s) for user ${userId}`
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erasure purge failed in media DB for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }
}
