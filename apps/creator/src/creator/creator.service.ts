import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { WalletClientService } from '../api/clients/wallet-client.service';
import { CreatorsClientService } from '../api/clients/creators-client.service';
import { MediaClientService } from '../api/clients/media-client.service';

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'audio' | 'document';
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string;
  mediaUrl: string | null;
  creatorId: string;
  universeId: string;
  isExclusive: boolean;
  isPremiere: boolean;
  metadata: unknown;
  publishedAt: Date | null;
  releaseDate: Date | null;
}

export interface RecentContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  viewCount: number;
  createdAt: string;
}

/** A creator subscription tier as exposed to clients. */
export interface SubscriptionTierView {
  id: string;
  name: string;
  price: number;
  perks: string[];
  isActive: boolean;
  displayOrder: number;
  subscriberCount: number;
}

export interface DashboardStats {
  totalViews: number;
  subscribers: number;
  totalEarnings: number;
  contentCount: number;
  viewsChange: string;
  subscribersChange: string;
  earningsChange: string;
  contentChange: string;
  recentContent: RecentContentItem[];
}

export interface AnalyticsData {
  totalViews: number;
  avgWatchTime: string;
  engagementRate: number;
  newSubscribers: number;
  viewsOverTime: { date: string; views: number }[];
  demographics: { region: string; percentage: number }[];
  topContent: { title: string; views: number; engagement: string }[];
}

export interface EarningsData {
  total: number;
  count: number;
  pendingPayout: number;
  lifetimeEarnings: number;
}

export interface PayoutItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
}

export interface PayoutsData {
  availableBalance: number;
  pendingPayout: number;
  totalPaidOut: number;
  history: PayoutItem[];
}

export interface EarningsSummaryData extends EarningsData {
  lastPayout: number;
}

export interface EarningsEntry {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  createdAt: string;
}

export interface EarningsHistoryData {
  items: EarningsEntry[];
  total: number;
}

export interface UploadItem {
  id: string;
  title: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  /** Where the file bytes live: blob storage ('stored') or metadata-only ('pending'). Legacy rows have neither. */
  storage: 'stored' | 'pending' | 'unknown';
  /** media-service virus scan verdict, when the pipeline stored the file. */
  scanStatus: string | null;
}

export interface SubscriberItem {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  tier: string;
  joinedAt: string;
}

export interface SubscribersData {
  total: number;
  growth: { date: string; count: number }[];
  demographics: { region: string; percentage: number }[];
  recentSubscribers: SubscriberItem[];
}

/** The web app's GET /creator/subscribers shape (stats + list) — kept in sync. */
export interface WebSubscribersData {
  stats: {
    totalSubscribers: number;
    newThisWeek: number;
    newThisMonth: number;
    churnRate: number;
  };
  subscribers: Array<{
    id: string;
    userId: string;
    displayName: string;
    avatar: string | null;
    subscribedAt: string;
  }>;
  growth: { date: string; count: number }[];
}

export interface MonetizationData {
  tiers?: SubscriptionTierView[];
  /** Portal client shape */
  tipEnabled: boolean;
  tipMin: number;
  tipMax: number;
  payoutMethod: string;
  payoutDetails: Record<string, string>;
  /** Mobile app shape (aliases of the tip fields) */
  isMonetizationEnabled: boolean;
  isSubscriptionEnabled: boolean;
  subscriptionPrice: number;
  isTipEnabled: boolean;
  minimumTip: number;
  isAdEnabled: boolean;
  adRevenueShare: number;
}

const PAYOUT_METHODS = ['bank_transfer', 'paypal', 'crypto'];

@Injectable()
export class CreatorService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(WalletClientService) private readonly walletClient: WalletClientService,
    @Inject(CreatorsClientService) private readonly creatorsClient: CreatorsClientService,
    @Inject(MediaClientService) private readonly mediaClient: MediaClientService
  ) {}

  private readonly logger = new Logger(CreatorService.name);

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const contentCount = await this.prisma.contentItem.count({
      where: { creatorId: userId, status: { not: 'archived' } },
    });

    const earnings = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: { in: ['earning', 'payout'] },
      },
      _sum: { amount: true },
    });

    const now = Date.now();
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const currentPeriodStart = new Date(now - periodMs);
    const previousPeriodStart = new Date(now - 2 * periodMs);

    const [currentPeriodViews, previousPeriodViews] = await Promise.all([
      this.prisma.contentItem.aggregate({
        where: {
          creatorId: userId,
          createdAt: { gte: currentPeriodStart },
        },
        _sum: { viewCount: true },
      }),
      this.prisma.contentItem.aggregate({
        where: {
          creatorId: userId,
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
        _sum: { viewCount: true },
      }),
    ]);

    const currentViews = currentPeriodViews._sum.viewCount || 0;
    const prevViews = previousPeriodViews._sum.viewCount || 0;
    const viewsChangePercent =
      prevViews > 0 ? (((currentViews - prevViews) / prevViews) * 100).toFixed(1) : '0';

    const [currentPeriodEarnings, previousPeriodEarnings] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId },
          type: { in: ['earning', 'payout'] },
          createdAt: { gte: currentPeriodStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId },
          type: { in: ['earning', 'payout'] },
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const currentEarnings = Number(currentPeriodEarnings._sum.amount) || 0;
    const prevEarnings = Number(previousPeriodEarnings._sum.amount) || 0;
    const earningsChangePercent =
      prevEarnings > 0 ? (((currentEarnings - prevEarnings) / prevEarnings) * 100).toFixed(1) : '0';

    const currentPeriodContentCount = await this.prisma.contentItem.count({
      where: {
        creatorId: userId,
        createdAt: { gte: currentPeriodStart },
      },
    });
    const previousPeriodContentCount = await this.prisma.contentItem.count({
      where: {
        creatorId: userId,
        createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
      },
    });
    const contentChange = currentPeriodContentCount - previousPeriodContentCount;

    // AUD-11: subscriber counts come only from user-service's internal RPC —
    // the `following` table belongs to user-service's database (database-per-
    // service), and the old $queryRaw fallback silently reported zeros when
    // services moved. A null means user-service is unreachable: fail loudly.
    const remoteFollowerCount = await this.fetchFollowerCountFromUserService(userId);
    if (remoteFollowerCount === null) {
      throw new ServiceUnavailableException('user-service unavailable');
    }
    const subscriberCount = remoteFollowerCount;
    // The RPC exposes only the current total — no previous-period count — so
    // the change delta is not computable from here (same value the RPC path
    // has always produced).
    const previousSubscriberCount = 0;

    const recentContentRows = await this.prisma.contentItem.findMany({
      where: { creatorId: userId, status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        viewCount: true,
        createdAt: true,
      },
    });

    return {
      totalViews: currentViews,
      subscribers: subscriberCount,
      totalEarnings: Number(earnings._sum.amount) || 0,
      contentCount,
      viewsChange: `${Number(viewsChangePercent) >= 0 ? '+' : ''}${viewsChangePercent}%`,
      subscribersChange: `${subscriberCount - previousSubscriberCount >= 0 ? '+' : ''}${subscriberCount - previousSubscriberCount}`,
      earningsChange: `${Number(earningsChangePercent) >= 0 ? '+' : ''}${earningsChangePercent}%`,
      contentChange: `${contentChange >= 0 ? '+' : ''}${contentChange}`,
      recentContent: recentContentRows.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        viewCount: item.viewCount,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  /**
   * GET /creator/content/:id/playback — a short-lived signed playback URL for
   * the content's stored media object, sourced from media-service:
   *   - key-based SigV4 URL (presigned/download) for the creator's own upload
   *   - token-gated premium URL for exclusive content (attributable, revocable)
   * The raw object key never leaves the backend; the browser only receives
   * the time-limited signed URL.
   */
  async getPlaybackUrl(
    userId: string,
    contentId: string
  ): Promise<{
    url: string;
    expiresIn: number;
    kind: 'signed' | 'premium';
    expiresAt: string | null;
  }> {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { id: true, creatorId: true, isExclusive: true, mediaUrl: true, metadata: true },
    });
    if (!item) throw new NotFoundException('Content not found');
    if (item.creatorId !== userId) throw new ForbiddenException('Not your content');

    const meta = (item.metadata ?? {}) as {
      media?: { key?: string; url?: string };
    };
    const objectKey = meta.media?.key;

    if (item.isExclusive) {
      // Exclusive: token-gated premium URL, attributable to this user and
      // revocable platform-wide via media-service invalidation endpoints.
      const premium = await this.mediaClient.getPremiumUrl(item.id, userId, 600);
      if (premium) {
        return {
          url: premium.url,
          expiresIn: 600,
          kind: 'premium',
          expiresAt: premium.expiresAt ?? null,
        };
      }
      // Premium needs Redis + key resolution; fall through to key-based
      // signing so the creator can still review their own upload.
    }

    if (!objectKey) {
      throw new NotFoundException(
        'No stored media for this content — the upload is metadata-only or predates the media pipeline'
      );
    }

    const signed = await this.mediaClient.getSignedPlaybackUrl(objectKey, 600);
    if (!signed) {
      throw new ServiceUnavailableException('Playback signing is temporarily unavailable');
    }
    return {
      url: signed.url,
      expiresIn: signed.expiresIn ?? 600,
      kind: 'signed',
      expiresAt: null,
    };
  }

  async getContent(
    userId: string,
    page = 1,
    limit = 20,
    status?: string
  ): Promise<{ items: ContentItem[]; total: number }> {
    // 'all' (or absent) means no filter. Unknown statuses fall back to 'all'
    // so shortcut endpoints (drafts/published/scheduled) never silently
    // return the unfiltered list.
    const allowedStatuses = ['all', 'draft', 'pending', 'published', 'archived', 'scheduled'];
    if (status && status !== 'all' && !allowedStatuses.includes(status)) {
      status = 'all';
    }

    const where: Prisma.ContentItemWhereInput = { creatorId: userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        type: item.type as 'video' | 'audio' | 'document',
        viewCount: item.viewCount,
      })),
      total,
    };
  }

  async createContent(
    userId: string,
    data: { title: string; description?: string; type: string; universeId?: string }
  ): Promise<ContentItem> {
    // Look up default universe if not provided
    let universeId = data.universeId;
    if (!universeId) {
      const defaultUniverse = await this.prisma.universe.findUnique({
        where: { name: 'vertical' },
        select: { id: true },
      });
      universeId = defaultUniverse?.id;
      if (!universeId) {
        throw new BadRequestException('No universe specified and no default universe found');
      }
    }

    const allowedTypes = ['video', 'audio', 'document'];
    if (!allowedTypes.includes(data.type)) {
      throw new BadRequestException(`Invalid content type: ${data.type}`);
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      await this.prisma.creatorProfile.create({
        data: { userId },
      });
    }

    const title = data.title.replace(/<[^>]*>/g, '');
    const description = data.description?.replace(/<[^>]*>/g, '');

    const content = await this.prisma.contentItem.create({
      data: {
        title,
        description,
        type: data.type || 'video',
        thumbnail: '', // Will be filled in via media service
        status: 'draft',
        creatorId: userId,
        universeId,
      },
    });

    return {
      ...content,
      type: content.type as 'video' | 'audio' | 'document',
    };
  }

  async updateContent(
    id: string,
    userId: string,
    data: Partial<ContentItem>
  ): Promise<ContentItem> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content || content.creatorId !== userId) {
      throw new NotFoundException('Content not found');
    }

    const allowedStatuses = ['draft', 'pending', 'published', 'archived', 'scheduled'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      throw new BadRequestException(`Invalid status: ${data.status}`);
    }
    const allowedTypes = ['video', 'audio', 'document'];
    if (data.type && !allowedTypes.includes(data.type)) {
      throw new BadRequestException(`Invalid type: ${data.type}`);
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: {
        title: data.title?.replace(/<[^>]*>/g, ''),
        description: data.description?.replace(/<[^>]*>/g, ''),
        status: data.status,
        type: data.type as 'video' | 'audio' | 'document' | undefined,
        // Stamp publishedAt the first time the item goes live
        publishedAt: data.status === 'published' && !content.publishedAt ? new Date() : undefined,
      },
    });

    return {
      ...updated,
      type: (updated.type as 'video' | 'audio' | 'document') || 'video',
      viewCount: updated.viewCount,
    };
  }

  async deleteContent(id: string, userId: string): Promise<boolean> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content || content.creatorId !== userId) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id },
      data: {
        status: 'archived',
        // The hard-delete sweeper counts the grace window from this stamp.
        archivedAt: new Date(),
      },
    });

    // Archive = delete in the studio UX. Best-effort: ask media-service to
    // remove the stored object(s) so archived uploads stop consuming blob
    // storage — but a storage outage must never fail or roll back the
    // archive itself; the orphan-blob audit script catches leftovers.
    await this.deleteStoredObjects(content);

    return true;
  }

  /**
   * Best-effort blob cleanup for archived content. Deletes the original
   * upload object (metadata.media.key) and any derived/preview object
   * (metadata.media.derivedKey) media-service knows about. Unconfirmed
   * deletes are logged, never propagated — the archive already succeeded.
   */
  private async deleteStoredObjects(content: {
    id: string;
    metadata: Prisma.JsonValue | null;
  }): Promise<void> {
    const meta = (content.metadata ?? {}) as {
      media?: { key?: string; derivedKey?: string };
    };
    const keys = [meta.media?.key, meta.media?.derivedKey].filter(
      (k): k is string => typeof k === 'string' && k.length > 0
    );
    if (keys.length === 0) return; // metadata-only item — nothing stored

    const results = await Promise.allSettled(keys.map((key) => this.mediaClient.deleteObject(key)));
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value === null) {
        this.logger.warn(
          `content ${content.id}: media-service did not confirm delete of "${keys[i]}" (unreachable/refused) — blob may remain; orphan audit will flag it`
        );
      }
    });
  }

  /**
   * GET /creator/uploads — recent content items mapped to the upload-status
   * shape the studio's Upload page tracks. The portal has no transcode
   * pipeline of its own, so status derives from the item's lifecycle:
   * draft/pending are still processing, published items are completed.
   */
  async getUploads(userId: string): Promise<UploadItem[]> {
    const items = await this.prisma.contentItem.findMany({
      where: { creatorId: userId, status: { in: ['draft', 'pending', 'published'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        metadata: true,
        mediaUrl: true,
      },
    });

    return items.map((item) => {
      const status: UploadItem['status'] = item.status === 'published' ? 'completed' : 'processing';
      const progress = item.status === 'published' ? 100 : item.status === 'pending' ? 75 : 90;
      // Pipeline metadata distinguishes real blob storage from a
      // metadata-only registration (media-service down or file rejected).
      const meta = (item.metadata ?? {}) as {
        media?: { key?: string; scanStatus?: string | null };
        upload?: { storage?: string };
      };
      let storage: UploadItem['storage'] = 'unknown';
      if (meta.media?.key || (meta.upload?.storage && meta.upload.storage !== 'pending')) {
        storage = 'stored';
      } else if (meta.upload?.storage === 'pending') {
        storage = 'pending';
      }
      const scanStatus = meta.media?.scanStatus ?? null;
      return {
        id: item.id,
        title: item.title,
        status,
        progress,
        createdAt: item.createdAt.toISOString(),
        storage,
        scanStatus,
      };
    });
  }

  /**
   * POST /creator/uploads — forward the file to media-service (blob storage,
   * scan, CDN) and register the upload as a draft content item with the stored
   * object's coordinates in metadata.
   */
  /**
   * The upload form sends a free-text universe (name like "Reality" or an ID);
   * resolve either form to a universe ID, falling back to the default universe.
   */
  private async resolveUniverseId(universe?: string): Promise<string | undefined> {
    const value = universe?.trim();
    if (!value) return undefined;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value;
    }
    const byName = await this.prisma.universe.findFirst({
      where: {
        OR: [
          { name: { equals: value, mode: 'insensitive' } },
          { displayName: { equals: value, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    return byName?.id ?? undefined;
  }

  async createUpload(
    userId: string,
    data: { title: string; description?: string; type?: string; universe?: string },
    file?: Express.Multer.File
  ): Promise<UploadItem> {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestException('Title is required');
    }

    // Register the content item first so a local validation/provisioning
    // failure can never leave an orphaned blob in storage.
    const content = await this.createContent(userId, {
      title: data.title,
      description: data.description,
      type: data.type || 'video',
      universeId: await this.resolveUniverseId(data.universe),
    });

    // Forward the raw file to media-service (the platform's blob pipeline) so
    // bytes land in S3 with MIME sniffing, virus scan, and CDN registration.
    let media: Awaited<ReturnType<MediaClientService['forwardUpload']>> = null;
    if (file?.buffer?.length) {
      media = await this.mediaClient.forwardUpload({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
    }

    if (media) {
      // Real pipeline result: persist the stored object's coordinates and set
      // mediaUrl so the content item serves from blob storage/CDN.
      await this.prisma.contentItem.update({
        where: { id: content.id },
        data: {
          mediaUrl: media.cdnUrl || media.url,
          metadata: {
            upload: {
              fileName: file!.originalname,
              size: file!.size,
              mimetype: file!.mimetype,
              uploadedVia: 'portal',
            },
            media: {
              key: media.key,
              url: media.url,
              cdnUrl: media.cdnUrl,
              storedMimetype: media.mimetype,
              storedSize: media.size,
              scanStatus: media.scanStatus ?? null,
            },
          },
        },
      });
    } else if (file) {
      // Pipeline unavailable/rejected: keep the metadata-only record so the
      // upload is not silently lost, and surface the degraded state.
      await this.prisma.contentItem.update({
        where: { id: content.id },
        data: {
          metadata: {
            upload: {
              fileName: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              uploadedVia: 'portal',
              storage: 'pending',
            },
          },
        },
      });
    }

    return {
      id: content.id,
      title: content.title,
      status: 'processing',
      progress: 90,
      createdAt: content.createdAt.toISOString(),
      storage: 'pending',
      scanStatus: null,
    };
  }

  async getAnalytics(userId: string, period = '30days'): Promise<AnalyticsData> {
    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentContent = await this.prisma.contentItem.findMany({
      where: { creatorId: userId, createdAt: { gte: startDate } },
      select: { viewCount: true, createdAt: true },
    });

    const recentViews = recentContent.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const engagementRate =
      recentViews > 0 && days > 0 ? Math.round((recentViews / days) * 10) / 10 : 0;

    let viewsOverTime: { date: string; views: number }[] = [];
    // AUD-11: new-subscriber windows live in user-service; its RPC exposes no
    // date-windowed follower counts, so this stays 0 rather than querying
    // another service's `following` table across the database boundary.
    const newSubscribers = 0;
    try {
      const raw = await this.prisma.$queryRaw<{ date: Date; views: number }[]>`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          COALESCE(SUM("viewCount"), 0)::int as views
        FROM "content_items"
        WHERE "creatorId" = ${userId}
          AND "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date
        LIMIT 30
      `;
      viewsOverTime = raw.map((v) => ({
        date: new Date(v.date).toISOString().slice(0, 10),
        views: Number(v.views),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        !message.includes('does not exist') &&
        !message.includes('relation') &&
        !message.includes('table')
      ) {
        throw err;
      }
    }

    return {
      totalViews: totalViews._sum.viewCount || 0,
      avgWatchTime: '0m 0s',
      engagementRate,
      newSubscribers,
      viewsOverTime,
      demographics: [],
      topContent: (
        await this.prisma.contentItem.findMany({
          where: { creatorId: userId },
          orderBy: { viewCount: 'desc' },
          take: 3,
        })
      ).map((item) => ({
        title: item.title,
        views: item.viewCount,
        engagement:
          item.viewCount > 0
            ? `${((item.viewCount / (recentViews || 1)) * 100).toFixed(1)}%`
            : '0.0%',
      })),
    };
  }

  async getEarnings(userId: string, _period = 'this-month'): Promise<EarningsData> {
    const earningsAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: 'earning',
      },
      _sum: { amount: true },
      _count: true,
    });

    const allEarningsAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: 'earning',
      },
      _sum: { amount: true },
    });

    const pendingPayouts = await this.prisma.payoutRequest.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true },
    });

    const pendingAmount = pendingPayouts._sum.amount;
    return {
      total: Number(earningsAggregate._sum.amount) || 0,
      count: earningsAggregate._count || 0,
      pendingPayout: pendingAmount ? Number(pendingAmount) : 0,
      lifetimeEarnings: Number(allEarningsAggregate._sum.amount) || 0,
    };
  }

  /** GET /creator/earnings/summary — earnings + last completed payout (web shape). */
  async getEarningsSummary(userId: string): Promise<EarningsSummaryData> {
    const base = await this.getEarnings(userId);
    const lastPayout = await this.prisma.payoutRequest.aggregate({
      where: { userId, status: 'completed' },
      _max: { amount: true },
    });
    return {
      ...base,
      lastPayout: lastPayout._max.amount ? Number(lastPayout._max.amount) : 0,
    };
  }

  /** GET /creator/earnings/history — recent wallet earning transactions. */
  async getEarningsHistory(userId: string, limit = 50): Promise<EarningsHistoryData> {
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { wallet: { userId }, type: 'earning' },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(1, limit), 100),
      }),
      this.prisma.walletTransaction.count({
        where: { wallet: { userId }, type: 'earning' },
      }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: Number(t.amount),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
    };
  }

  /** GET /creator/payouts — balance, pending and completed payout history. */
  async getPayouts(userId: string): Promise<PayoutsData> {
    const walletResponse = await this.walletClient.getWallet(userId);
    const availableBalance =
      walletResponse.success && walletResponse.data ? Number(walletResponse.data.balance) : 0;

    const [pending, completed] = await Promise.all([
      this.prisma.payoutRequest.aggregate({
        where: { userId, status: 'pending' },
        _sum: { amount: true },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { userId, status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    const history = await this.prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      availableBalance,
      pendingPayout: pending._sum.amount ? Number(pending._sum.amount) : 0,
      totalPaidOut: completed._sum.amount ? Number(completed._sum.amount) : 0,
      history: history.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        requestedAt: p.createdAt.toISOString(),
        processedAt: p.completedAt ? p.completedAt.toISOString() : null,
      })),
    };
  }

  async requestPayout(
    userId: string,
    amount?: number,
    method = 'bank_transfer'
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.payoutRequest.findFirst({
      where: { userId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('Pending payout already exists');
    }

    if (!PAYOUT_METHODS.includes(method)) {
      throw new BadRequestException(`Invalid payout method: ${method}`);
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      throw new BadRequestException('Creator profile not found');
    }

    // Get wallet balance through wallet-service API
    const walletResponse = await this.walletClient.getWallet(userId);
    if (!walletResponse.success || !walletResponse.data) {
      throw new BadRequestException('Wallet not found');
    }

    const wallet = walletResponse.data;
    const payoutAmount = amount ? Number(amount) : Number(wallet.balance);

    if (payoutAmount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (
      Number(creatorProfile.minimumPayout) &&
      payoutAmount < Number(creatorProfile.minimumPayout)
    ) {
      throw new BadRequestException(
        `Payout amount must be at least ${Number(creatorProfile.minimumPayout)}`
      );
    }

    if (payoutAmount > Number(wallet.balance)) {
      throw new BadRequestException('Insufficient balance');
    }

    // Debit wallet through wallet-service API (internal by-userId route)
    const debitResult = await this.walletClient.debit(
      userId,
      payoutAmount,
      'Payout request',
      `payout-${userId}-${Date.now()}`
    );

    if (!debitResult.success) {
      throw new BadRequestException('Failed to debit wallet for payout');
    }

    // Create payout request locally
    await this.prisma.payoutRequest.create({
      data: {
        userId,
        amount: payoutAmount,
        status: 'pending',
        method,
      },
    });

    return {
      success: true,
      message: 'Payout request submitted successfully',
    };
  }

  /** GET /creator/subscribers — portal shape: real follower data + growth series. */
  async getSubscribers(userId: string, page = 1, limit = 20): Promise<SubscribersData> {
    const empty: SubscribersData = {
      total: 0,
      growth: [],
      demographics: [],
      recentSubscribers: [],
    };

    // AUD-11: the follower list comes only from user-service's RPC — no
    // cross-database $queryRaw fallback. A null means user-service is
    // unreachable: surface it instead of silently returning an empty page.
    const remoteData = await this.fetchFollowersFromUserService(userId, page, limit);
    if (!remoteData) {
      throw new ServiceUnavailableException('user-service unavailable');
    }
    const followerRows: { followerId: string; createdAt: Date }[] = remoteData.followers.map(
      (f) => ({
        followerId: f.id,
        // The RPC response carries no follow timestamp (user-service maps to
        // user records only), so join dates are approximated — pre-existing
        // behaviour of the RPC path, unrelated to the removed raw fallback.
        createdAt: new Date(),
      })
    );
    const total = remoteData.total;

    if (followerRows.length === 0) return empty;

    // Resolve follower identities
    const users = await this.prisma.user.findMany({
      where: { id: { in: followerRows.map((f) => f.followerId) } },
      select: { id: true, displayName: true, email: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 30-day cumulative growth series — AUD-11: computing it required a
    // cross-database $queryRaw on user-service's `following` table. The RPC
    // exposes no follow timestamps, so the series degrades explicitly to []
    // (the UI shows no chart) instead of coupling to another service's DB.
    const growth: { date: string; count: number }[] = [];

    return {
      total,
      growth,
      demographics: [],
      recentSubscribers: followerRows.map((f) => {
        const u = userMap.get(f.followerId);
        return {
          id: `${f.followerId}-${f.createdAt.toISOString()}`,
          name: u?.displayName || 'Unknown',
          email: u?.email ?? null,
          avatar: u?.avatar ?? null,
          tier: 'follower',
          joinedAt: f.createdAt.toISOString(),
        };
      }),
    };
  }

  /** GET /creator/subscribers — web shape (stats + subscribers list). */
  async getWebSubscribers(userId: string, page = 1, limit = 20): Promise<WebSubscribersData> {
    const portal = await this.getSubscribers(userId, page, limit);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return {
      stats: {
        totalSubscribers: portal.total,
        newThisWeek: portal.recentSubscribers.filter((s) => new Date(s.joinedAt) >= weekAgo).length,
        newThisMonth: portal.recentSubscribers.filter((s) => new Date(s.joinedAt) >= monthAgo)
          .length,
        churnRate: 0,
      },
      subscribers: portal.recentSubscribers.map((s) => ({
        id: s.id,
        userId: s.id.split('-')[0] || s.id,
        displayName: s.name,
        avatar: s.avatar,
        subscribedAt: s.joinedAt,
      })),
      growth: portal.growth,
    };
  }

  /**
   * GET /creator/monetization — tip settings + payout method from
   * CreatorProfile. Returns a merged shape: the portal client reads
   * tipEnabled/tipMin/tipMax while the mobile app reads
   * isTipEnabled/minimumTip (aliases of the same fields).
   */
  async getMonetization(userId: string): Promise<MonetizationData> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    const tipEnabled = profile?.tipEnabled ?? true;
    const tipMin = profile?.tipMin ? Number(profile.tipMin) : 1;
    const tipMax = profile?.tipMax ? Number(profile.tipMax) : 100;
    const payoutMethod = profile?.payoutMethod || 'bank_transfer';

    return {
      tipEnabled,
      tipMin,
      tipMax,
      payoutMethod,
      payoutDetails: {},
      tiers: await this.getSubscriptionTiers(userId),
      // Mobile aliases
      isMonetizationEnabled: profile?.verified ?? false,
      isSubscriptionEnabled: false,
      subscriptionPrice: 0,
      isTipEnabled: tipEnabled,
      minimumTip: tipMin,
      isAdEnabled: false,
      adRevenueShare: 0,
    };
  }

  /**
   * PUT /creator/monetization — persist tip settings + payout method.
   * Accepts both the portal fields (tipEnabled/tipMin/tipMax) and the
   * mobile aliases (isTipEnabled/minimumTip).
   */
  async updateMonetization(
    userId: string,
    data: {
      tipEnabled?: boolean;
      tipMin?: number;
      tipMax?: number;
      payoutMethod?: string;
      isTipEnabled?: boolean;
      minimumTip?: number;
    }
  ): Promise<MonetizationData> {
    if (data.payoutMethod && !PAYOUT_METHODS.includes(data.payoutMethod)) {
      throw new BadRequestException(`Invalid payout method: ${data.payoutMethod}`);
    }

    const tipEnabled = data.tipEnabled ?? data.isTipEnabled;
    const tipMin = data.tipMin ?? data.minimumTip;
    const tipMax = data.tipMax !== undefined ? Number(data.tipMax) : undefined;
    const minNum = tipMin !== undefined ? Number(tipMin) : undefined;
    if (minNum !== undefined && minNum < 0) {
      throw new BadRequestException('Minimum tip cannot be negative');
    }
    if (tipMax !== undefined && minNum !== undefined && tipMax < minNum) {
      throw new BadRequestException('Maximum tip cannot be less than minimum tip');
    }

    const profile = await this.prisma.creatorProfile.upsert({
      where: { userId },
      update: {
        ...(tipEnabled !== undefined ? { tipEnabled } : {}),
        ...(minNum !== undefined ? { tipMin: minNum } : {}),
        ...(tipMax !== undefined ? { tipMax } : {}),
        ...(data.payoutMethod ? { payoutMethod: data.payoutMethod } : {}),
      },
      create: {
        userId,
        tipEnabled: tipEnabled ?? true,
        tipMin: minNum ?? 1,
        tipMax: tipMax ?? 100,
        payoutMethod: data.payoutMethod,
      },
    });

    return this.getMonetization(profile.userId);
  }

  // ─── Subscription tier CRUD (portal-owned, monetization page) ──────

  /**
   * GET /creator/monetization/tiers — list the creator's tiers with derived
   * subscriber counts (platform `subscriptions` rows, status='active',
   * matched by tier name).
   */
  async getSubscriptionTiers(userId: string): Promise<SubscriptionTierView[]> {
    const tiers = await this.prisma.subscriptionTier.findMany({
      where: { creatorId: userId },
      orderBy: [{ displayOrder: 'asc' }, { price: 'asc' }],
    });
    if (tiers.length === 0) return [];

    const counts = await this.prisma.$queryRaw<{ tier: string; count: number }[]>`
      SELECT tier, COUNT(*)::int as count
      FROM "subscriptions"
      WHERE "creatorId" = ${userId} AND status = 'active'
      GROUP BY tier
    `;
    const byTier = new Map(counts.map((c) => [c.tier.toLowerCase(), Number(c.count)]));

    return tiers.map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price),
      perks: Array.isArray(t.perks) ? (t.perks as string[]) : [],
      isActive: t.isActive,
      displayOrder: t.displayOrder,
      subscriberCount: byTier.get(t.name.toLowerCase()) ?? 0,
    }));
  }

  /**
   * POST /creator/monetization/tiers — create a tier (name + price required;
   * name unique per creator, price non-negative).
   */
  async createSubscriptionTier(
    userId: string,
    data: {
      name?: string;
      price?: number;
      perks?: string[];
      isActive?: boolean;
      displayOrder?: number;
    }
  ): Promise<SubscriptionTierView> {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Tier name is required');
    if (name.length > 50) throw new BadRequestException('Tier name must be 50 characters or fewer');

    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Price must be a non-negative number');
    }

    const perks = this.sanitizePerks(data.perks);
    try {
      const tier = await this.prisma.subscriptionTier.create({
        data: {
          creatorId: userId,
          name,
          price,
          perks: [...perks],
          isActive: data.isActive ?? true,
          displayOrder: data.displayOrder ?? 0,
        },
      });
      return {
        id: tier.id,
        name: tier.name,
        price: Number(tier.price),
        perks: Array.isArray(tier.perks) ? (tier.perks as string[]) : [],
        isActive: tier.isActive,
        displayOrder: tier.displayOrder,
        subscriberCount: 0,
      };
    } catch (err: unknown) {
      throw this.mapTierWriteError(err, 'Tier name already exists');
    }
  }

  /**
   * PUT /creator/monetization/tiers/:id — update name/price/perks/active/
   * order. Creator-scoped: only the owner can modify a tier.
   */
  async updateSubscriptionTier(
    userId: string,
    tierId: string,
    data: {
      name?: string;
      price?: number;
      perks?: string[];
      isActive?: boolean;
      displayOrder?: number;
    }
  ): Promise<SubscriptionTierView> {
    const existing = await this.prisma.subscriptionTier.findUnique({ where: { id: tierId } });
    if (!existing || existing.creatorId !== userId) {
      throw new NotFoundException('Subscription tier not found');
    }

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestException('Tier name cannot be empty');
      if (name.length > 50)
        throw new BadRequestException('Tier name must be 50 characters or fewer');
      update.name = name;
    }
    if (data.price !== undefined) {
      const price = Number(data.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('Price must be a non-negative number');
      }
      update.price = price;
    }
    if (data.perks !== undefined) update.perks = [...this.sanitizePerks(data.perks)];
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.displayOrder !== undefined) update.displayOrder = Math.trunc(data.displayOrder);

    try {
      await this.prisma.subscriptionTier.update({ where: { id: tierId }, data: update });
    } catch (err: unknown) {
      throw this.mapTierWriteError(err, 'Tier name already exists');
    }
    return (await this.getSubscriptionTiers(userId)).find((t) => t.id === tierId)!;
  }

  /**
   * DELETE /creator/monetization/tiers/:id — delete a tier. Blocked while
   * active subscribers remain (archive with isActive=false instead).
   */
  async deleteSubscriptionTier(userId: string, tierId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.subscriptionTier.findUnique({ where: { id: tierId } });
    if (!existing || existing.creatorId !== userId) {
      throw new NotFoundException('Subscription tier not found');
    }

    const counts = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count
      FROM "subscriptions"
      WHERE "creatorId" = ${userId} AND status = 'active' AND tier = ${existing.name}
    `;
    if (Number(counts[0]?.count ?? 0) > 0) {
      throw new BadRequestException(
        'Tier has active subscribers — deactivate it instead of deleting'
      );
    }

    await this.prisma.subscriptionTier.delete({ where: { id: tierId } });
    return { success: true };
  }

  /** Trim, dedupe, cap, and stringify perk entries. */
  private sanitizePerks(perks?: string[]): string[] {
    if (!Array.isArray(perks)) return [];
    const cleaned = perks
      .map((p) =>
        String(p)
          .replace(/<[^>]*>/g, '')
          .trim()
      )
      .filter((p) => p.length > 0);
    return Array.from(new Set(cleaned)).slice(0, 10);
  }

  /** Map Prisma unique-violations to a friendly 400. */
  private mapTierWriteError(err: unknown, message: string): Error {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    if (code === 'P2002') return new BadRequestException(message);
    if (err instanceof Error) return err;
    return new Error(String(err));
  }

  /**
   * GET /creator/monetization/settings — the web app's shape
   * (tipsEnabled/minimumTipAmount/customTipAmounts/...).
   */
  async getWebMonetizationSettings(userId: string): Promise<Record<string, unknown>> {
    const data = await this.getMonetization(userId);
    return {
      tipsEnabled: data.tipEnabled,
      minimumTipAmount: data.tipMin,
      customTipAmounts: [data.tipMin, Math.round((data.tipMin + data.tipMax) / 2), data.tipMax],
      subscriptionsEnabled: data.isSubscriptionEnabled,
      subscriptionPrice: data.subscriptionPrice,
      subscriptionBenefits: [],
      adRevenueShare: data.adRevenueShare,
      sponsorshipEnabled: data.isAdEnabled,
      payoutMethod: data.payoutMethod,
    };
  }

  /**
   * GET /creator/challenges — proxied from creator-service via the gateway.
   * Falls back to an empty list if the upstream service is unavailable so the
   * page still renders instead of hard-failing.
   */
  async getChallenges(_userId: string): Promise<unknown[]> {
    try {
      const res = await this.creatorsClient.getChallenges();
      const challenges = res.data?.challenges ?? [];
      return challenges.map((c) => {
        const now = Date.now();
        const start = c.startDate ? new Date(c.startDate).getTime() : now;
        const end = c.endDate ? new Date(c.endDate).getTime() : now;
        const status =
          c.status !== 'active'
            ? 'ended'
            : now < start
              ? 'upcoming'
              : now > end
                ? 'ended'
                : 'active';
        return {
          id: c.id,
          title: c.title,
          description: c.description ?? '',
          universe: 'creator',
          prize: Number(c.prize ?? 0),
          deadline: c.endDate ?? new Date(end).toISOString(),
          submissionsCount: c._count?.entries ?? 0,
          status,
        };
      });
    } catch {
      // Upstream unavailable — surface an empty list rather than a 502 so the
      // creator portal stays usable.
      return [];
    }
  }

  /**
   * GET /creator/challenges/submissions — the creator's own entries.
   * Two-way sync: hydrates from creator-service entries (source of truth for
   * challenge participation) and merges any local-only rows, so submissions
   * made through other clients appear here and vice versa.
   */
  async getChallengeSubmissions(userId: string): Promise<unknown[]> {
    const local = await this.prisma.challengeSubmission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    // Inbound: pull upstream entries. Two sync jobs:
    //   1. Hydrate entries the portal doesn't have yet (submitted elsewhere).
    //   2. Pull-sync status transitions (pending → under_review → winner /
    //      rejected) so the page shows the real review state, not a stale
    //      static "submitted".
    let upstream: {
      id: string;
      challengeId: string;
      contentUrl?: string;
      status?: string;
      createdAt?: string;
      reviewedAt?: string | null;
      reviewedByName?: string | null;
      reviewNote?: string | null;
      challenge?: { prize?: string | number | null } | null;
    }[] = [];
    try {
      const res = await this.creatorsClient.getMyChallengeEntries(userId);
      if (res.success && Array.isArray(res.data?.challenges)) {
        upstream = res.data.challenges;
      }
    } catch {
      // Upstream unavailable — local rows still render.
    }

    const localById = new Map(local.map((s) => [s.id, s]));
    const localByChallengeId = new Set(local.map((s) => s.challengeId));

    // 2. Status pull-sync: upstream is the source of truth for review state.
    // Local rows are matched by primary id (hydrated rows carry the upstream
    // id) OR by upstreamId (rows created through the portal's own submit,
    // which keep their local uuid and link via upstreamId).
    const staleStatus = upstream.filter((e) => {
      const row =
        localById.get(e.id) ??
        local.find((s) => (s as { upstreamId?: string }).upstreamId === e.id);
      // 'pending' upstream means "submitted, not yet reviewed" — render as
      // the portal's 'submitted'; only real transitions overwrite.
      const upstreamStatus = e.status === 'pending' ? 'submitted' : e.status;
      return row && upstreamStatus && row.status !== upstreamStatus;
    });
    await Promise.all(
      staleStatus.map((e) => {
        const upstreamStatus = e.status === 'pending' ? 'submitted' : e.status!;
        const row =
          localById.get(e.id) ??
          local.find((s) => (s as { upstreamId?: string }).upstreamId === e.id);
        return this.prisma.challengeSubmission
          .update({
            where: { id: row!.id },
            data: {
              status: upstreamStatus,
              // Judgement metadata rides the transition: pending→null keeps
              // un-reviewed rows clean; a real judgement stamps when + who.
              reviewedAt: e.reviewedAt ? new Date(e.reviewedAt) : null,
              reviewedByName: e.reviewedByName ?? null,
              // The moderator's note rides the same transition (and is
              // cleared when a re-review carries no note).
              reviewNote: e.reviewNote ?? null,
            },
          })
          .then(() =>
            // Append the transition to the history log so the detail view can
            // replay the review lifecycle (upstream keeps no history).
            this.recordReviewEvent(
              row!.id,
              row!.status,
              upstreamStatus,
              e.reviewedAt,
              e.reviewedByName,
              e.reviewNote ?? null
            )
          )
          .then(() => {
            // First time we see this entry as a winner: credit the prize to
            // the creator's wallet (idempotent) and mirror an earning line so
            // the earnings page shows it. Upstream prize is a display string
            // ("₦250,000") nested on the embedded challenge; parse defensively
            // — unparseable prizes skip the credit but the win still renders.
            if (upstreamStatus === 'winner' && row!.status !== 'winner') {
              return this.creditChallengePrize(userId, row!.id, e.challenge?.prize ?? null);
            }
            return undefined;
          });
      })
    );

    // 1. Hydration: entries made elsewhere that the portal lacks.
    const hydrated = upstream.filter((e) => !localByChallengeId.has(e.challengeId));
    if (hydrated.length > 0) {
      // Preserve upstream entry IDs where possible for traceability.
      await this.prisma.challengeSubmission.createMany({
        data: hydrated.map((e) => ({
          id: e.id,
          userId,
          challengeId: e.challengeId,
          title: this.titleFromContentUrl(e.contentUrl),
          status: e.status === 'pending' ? 'submitted' : e.status || 'submitted',
          reviewedAt: e.reviewedAt ? new Date(e.reviewedAt) : null,
          reviewedByName: e.reviewedByName ?? null,
          reviewNote: e.reviewNote ?? null,
          submittedAt: e.createdAt ? new Date(e.createdAt) : undefined,
        })),
        skipDuplicates: true,
      });
      // Hydrated winners (submitted elsewhere, e.g. mobile) get their prize
      // credit on first sight too — same idempotent path as transitions.
      await Promise.all(
        hydrated
          .filter((e) => e.status === 'winner')
          .map((e) => this.creditChallengePrize(userId, e.id, e.challenge?.prize ?? null))
      );
      // Baseline history rows for hydrated entries (the row was just created,
      // so no earlier events can exist) — the timeline starts at "registered".
      await this.prisma.challengeSubmissionReviewEvent
        .createMany({
          data: hydrated.map((e) => ({
            submissionId: e.id,
            fromStatus: null,
            toStatus: e.status === 'pending' ? 'submitted' : e.status || 'submitted',
            reviewedAt: e.reviewedAt ? new Date(e.reviewedAt) : null,
            reviewedByName: e.reviewedByName ?? null,
            note: e.reviewNote ?? 'Synced from platform',
          })),
          skipDuplicates: true,
        })
        .catch(() => undefined);
      const fresh = await this.prisma.challengeSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        take: 50,
      });
      return fresh.map((s) => this.mapSubmission(s));
    }

    if (staleStatus.length > 0) {
      // Refetch so the response reflects the synced statuses.
      const fresh = await this.prisma.challengeSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        take: 50,
      });
      return fresh.map((s) => this.mapSubmission(s));
    }

    return local.map((s) => this.mapSubmission(s));
  }

  /**
   * Append one review transition to the submission's history log. Best-effort:
   * a history write must never break the status sync itself.
   */
  private async recordReviewEvent(
    submissionId: string,
    fromStatus: string,
    toStatus: string,
    reviewedAt?: string | null,
    reviewedByName?: string | null,
    note?: string | null
  ): Promise<void> {
    try {
      await this.prisma.challengeSubmissionReviewEvent.create({
        data: {
          submissionId,
          fromStatus,
          toStatus,
          reviewedAt: reviewedAt ? new Date(reviewedAt) : null,
          reviewedByName: reviewedByName ?? null,
          note: note ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record review event for submission ${submissionId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Credit a challenge prize to the creator's real wallet (wallet-service,
   * idempotent by `challenge-prize:<entryId>`) and mirror it as a local
   * `type: 'earning'` wallet_transaction row so the earnings page shows a
   * "Challenge prize" line item without waiting for the snapshot sync.
   *
   * Double-pay safety is two-layered: the wallet dedupes on the idempotency
   * key, and the local mirror is keyed by the same unique reference.
   *
   * Best-effort by design: a wallet outage must never break the submissions
   * page — the next pull-sync retries (self-healing) until the credit lands.
   */
  private async creditChallengePrize(
    userId: string,
    entryId: string,
    prize: string | number | null
  ): Promise<void> {
    const amount = this.parsePrizeAmount(prize);
    if (!amount || amount <= 0) return; // unparseable/no prize — win still renders, no money invented

    const reference = `challenge-prize:${entryId}`;

    // Mirror-first: an existing local row means the credit already landed in
    // a previous pass (or is redundant), so skip the network call entirely.
    try {
      const existing = await this.prisma.walletTransaction.findFirst({
        where: { reference },
        select: { id: true },
      });
      if (existing) return;
    } catch {
      // Mirror check failing is non-fatal — the wallet-side key still guards.
    }

    try {
      const res = await this.walletClient.credit(userId, amount, `Challenge prize won`, reference);
      if (!res.success) {
        this.logger.warn(
          `Prize credit rejected for entry ${entryId}: ${res.message ?? res.error ?? 'unknown error'}`
        );
        return; // e.g. no wallet yet — retried on next sync
      }
    } catch (error) {
      this.logger.warn(
        `Prize credit failed for entry ${entryId} (will retry on next sync): ${(error as Error).message}`
      );
      return;
    }

    // Local earning line so the earnings page renders it immediately. Unique
    // reference = idempotent even if two syncs race.
    try {
      const wallet = await this.prisma.wallet.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });
      await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'earning',
          amount,
          status: 'completed',
          description: 'Challenge prize won',
          reference,
        },
      });
    } catch (error) {
      // A racing sync may have inserted the same reference first — fine.
      this.logger.warn(
        `Prize earning mirror failed for entry ${entryId}: ${(error as Error).message}`
      );
    }
  }

  /** Parse upstream display prizes ("₦250,000", "1,000", 500) into a number. */
  private parsePrizeAmount(prize: string | number | null | undefined): number | null {
    if (prize === null || prize === undefined) return null;
    if (typeof prize === 'number') return Number.isFinite(prize) ? prize : null;
    const cleaned = prize.replace(/[^0-9.]/g, '');
    if (!cleaned) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private mapSubmission(s: {
    id: string;
    challengeId: string;
    title: string;
    status: string;
    submittedAt: Date;
    reviewedAt?: Date | null;
    reviewedByName?: string | null;
    reviewNote?: string | null;
  }) {
    return {
      id: s.id,
      challengeId: s.challengeId,
      title: s.title,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
      reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
      reviewedByName: s.reviewedByName ?? null,
      reviewNote: s.reviewNote ?? null,
    };
  }

  private titleFromContentUrl(contentUrl?: string): string {
    if (!contentUrl) return 'Challenge entry';
    const fileName = contentUrl.split('/').pop() || contentUrl;
    return (
      fileName
        .replace(/[-_]/g, ' ')
        .replace(/\.[a-z0-9]+$/i, '')
        .trim() || 'Challenge entry'
    );
  }

  /**
   * POST /creator/challenges/:id/submit — register the entry upstream
   * (creator-service owns challenge participation) and record it locally.
   */
  async submitChallenge(
    userId: string,
    challengeId: string,
    title: string,
    contentId?: string
  ): Promise<{ success: boolean; submissionId: string; entryId?: string; synced: boolean }> {
    // Optional attached content: the entry points at a real stored upload.
    let attached: { id: string; title: string; mediaKey: string } | null = null;
    if (contentId) {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
        select: { id: true, creatorId: true, title: true, status: true, metadata: true },
      });
      if (!content || content.creatorId !== userId) {
        throw new ForbiddenException('Content not found');
      }
      if (content.status === 'archived') {
        throw new BadRequestException('Archived content cannot be submitted');
      }
      const meta = (content.metadata ?? {}) as { media?: { key?: string } };
      if (!meta.media?.key) {
        throw new BadRequestException(
          'Content has no stored media (metadata-only registration) — upload the file first'
        );
      }
      attached = { id: content.id, title: content.title, mediaKey: meta.media.key };
    }

    const cleanTitle = (attached?.title ?? title).replace(/<[^>]*>/g, '').trim();
    if (!cleanTitle) {
      throw new BadRequestException('Submission title is required');
    }

    const existing = await this.prisma.challengeSubmission.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) {
      throw new BadRequestException('Already submitted to this challenge');
    }

    // Outbound: create the entry in creator-service first (validates the
    // challenge window + dedupes). Its entryId is stored locally so both
    // systems can trace the submission. contentUrl is the storage key of the
    // attached upload when one is picked (durable, resolvable via the media
    // pipeline) or a descriptive slug for title-only entries.
    let entryId: string | undefined;
    let synced = false;
    const contentUrl =
      attached?.mediaKey ??
      `/submissions/${challengeId}/${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    try {
      const res = await this.creatorsClient.participateInChallenge(userId, challengeId, contentUrl);
      if (res.success && res.data?.entryId) {
        entryId = res.data.entryId;
        synced = true;
      }
    } catch {
      // Upstream down/rejected — local row still records the attempt.
    }

    const submission = await this.prisma.challengeSubmission.create({
      data: {
        userId,
        challengeId,
        title: cleanTitle,
        upstreamId: entryId,
        contentId: attached?.id,
      },
    });

    return { success: true, submissionId: submission.id, entryId, synced };
  }

  /**
   * GET /creator/challenges/submissions/:id — full detail for the submission
   * detail view: the submission itself, its review history (recorded by the
   * pull-sync; baseline-filled from current state for rows created before
   * the log existed), the attached content preview (signed playback URL via
   * the media pipeline), the challenge's prize, and the prize payout state
   * derived from the creator's payout history.
   */
  async getChallengeSubmissionDetail(
    userId: string,
    submissionId: string
  ): Promise<{
    submission: {
      id: string;
      challengeId: string;
      title: string;
      status: string;
      submittedAt: string;
      reviewedAt: string | null;
      reviewedByName: string | null;
      reviewNote: string | null;
      hasAttachedContent: boolean;
    };
    challenge: { id: string; title: string; prize: number | null; ended: boolean } | null;
    history: {
      id: string;
      fromStatus: string | null;
      toStatus: string;
      reviewedAt: string | null;
      reviewedByName: string | null;
      note: string | null;
      createdAt: string;
    }[];
    content: {
      id: string;
      title: string;
      type: string;
      status: string;
      playbackUrl: string | null;
      playbackKind: 'signed' | 'premium' | null;
      expiresIn: number | null;
      playbackError: string | null;
    } | null;
    prizePayout: {
      prize: number | null;
      status: 'awaiting_payout' | 'partially_paid' | 'paid' | 'none';
      label: string;
      totalPaid: number;
      payoutIds: string[];
    } | null;
  }> {
    const submission = await this.prisma.challengeSubmission.findFirst({
      where: { id: submissionId, userId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    // Challenge context is proxied; if upstream is down, the rest of the
    // detail still renders (challenge card degrades to unknown).
    let challenge: { id: string; title: string; prize: number | null; ended: boolean } | null =
      null;
    try {
      const challenges = (await this.getChallenges(userId)) as {
        id: string;
        title: string;
        prize: number;
        status: string;
      }[];
      const match = challenges.find((c) => c.id === submission.challengeId);
      if (match) {
        challenge = {
          id: match.id,
          title: match.title,
          prize: Number(match.prize ?? 0) || null,
          ended: match.status === 'ended',
        };
      }
    } catch {
      // Degrade gracefully — the challenge block just stays empty.
    }

    // History: recorded events first; if none exist (rows created before the
    // log, or upstream never transitioned past submission), synthesize a
    // baseline so the timeline is never empty.
    const events = await this.prisma.challengeSubmissionReviewEvent.findMany({
      where: { submissionId: submission.id },
      orderBy: { createdAt: 'asc' },
    });
    const history =
      events.length > 0
        ? events.map((e) => ({
            id: e.id,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            reviewedAt: e.reviewedAt?.toISOString() ?? null,
            reviewedByName: e.reviewedByName,
            note: e.note,
            createdAt: e.createdAt.toISOString(),
          }))
        : [
            {
              id: 'baseline',
              fromStatus: null,
              toStatus: submission.status,
              reviewedAt: submission.reviewedAt?.toISOString() ?? null,
              reviewedByName: submission.reviewedByName,
              note: null,
              createdAt: submission.submittedAt.toISOString(),
            },
          ];

    // Attached content preview: reuse the playback flow (signed/premium URL
    // through the media pipeline). Playback failures degrade to a message
    // rather than failing the whole detail view.
    let content: {
      id: string;
      title: string;
      type: string;
      status: string;
      playbackUrl: string | null;
      playbackKind: 'signed' | 'premium' | null;
      expiresIn: number | null;
      playbackError: string | null;
    } | null = null;
    if (submission.contentId) {
      const item = await this.prisma.contentItem.findUnique({
        where: { id: submission.contentId },
        select: { id: true, creatorId: true, title: true, type: true, status: true },
      });
      if (item && item.creatorId === userId) {
        let playbackUrl: string | null = null;
        let playbackKind: 'signed' | 'premium' | null = null;
        let expiresIn: number | null = null;
        let playbackError: string | null = null;
        try {
          const playback = await this.getPlaybackUrl(userId, item.id);
          playbackUrl = playback.url;
          playbackKind = playback.kind;
          expiresIn = playback.expiresIn;
        } catch (error) {
          playbackError =
            error instanceof Error ? error.message : 'Playback is temporarily unavailable';
        }
        content = {
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          playbackUrl,
          playbackKind,
          expiresIn,
          playbackError,
        };
      }
    }

    // Prize payout state: the platform pays challenge prizes into the
    // creator's wallet, from which payouts are requested. Prize payouts are
    // tagged in payout metadata (challengePrize: challengeId), so scan the
    // creator's payout history for tags matching this challenge.
    const prizePayout = await this.resolvePrizePayout(userId, submission.challengeId, challenge);

    return {
      submission: {
        id: submission.id,
        challengeId: submission.challengeId,
        title: submission.title,
        status: submission.status,
        submittedAt: submission.submittedAt.toISOString(),
        reviewedAt: submission.reviewedAt?.toISOString() ?? null,
        reviewedByName: submission.reviewedByName,
        reviewNote: submission.reviewNote ?? null,
        hasAttachedContent: Boolean(submission.contentId),
      },
      challenge,
      history,
      content,
      prizePayout,
    };
  }

  /**
   * Derive the prize payout state for a challenge from the creator's payout
   * history. Prize payouts are tagged in payout metadata (challengePrize),
   * so state is derived, not invented: completed payout(s) covering the prize
   * → 'paid', partial → 'partially_paid', none yet → 'awaiting_payout' when
   * the entry actually won (or has no payout yet), 'none' otherwise.
   */
  private async resolvePrizePayout(
    userId: string,
    challengeId: string,
    challenge: { prize: number | null } | null
  ): Promise<{
    prize: number | null;
    status: 'awaiting_payout' | 'partially_paid' | 'paid' | 'none';
    label: string;
    totalPaid: number;
    payoutIds: string[];
  } | null> {
    try {
      const res = await this.walletClient.getPayoutRequests(userId, 1, 50);
      const items = (res.success && res.data?.items) || [];
      const prizePayouts = items.filter(
        (p) =>
          typeof p.metadata === 'object' &&
          p.metadata !== null &&
          (p.metadata as { challengePrize?: unknown }).challengePrize === challengeId
      );
      const totalPaid = prizePayouts
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const prize = challenge?.prize ?? null;

      if (prizePayouts.length === 0) {
        // No tagged payouts: only meaningful when there IS a prize at stake.
        if (!prize) return null;
        return {
          prize,
          status: 'awaiting_payout',
          label: 'Prize payout pending',
          totalPaid: 0,
          payoutIds: [],
        };
      }
      const allDone = prizePayouts.every((p) => p.status === 'completed');
      if (totalPaid > 0 && allDone && (!prize || totalPaid >= prize)) {
        // All tagged payouts completed. With a known prize we also verify the
        // amount covers it; without one (challenge unknown), a completed
        // tagged payout is still the platform's record of the prize being paid.
        return {
          prize,
          status: 'paid',
          label: 'Prize paid',
          totalPaid,
          payoutIds: prizePayouts.map((p) => p.id),
        };
      }
      if (totalPaid > 0) {
        return {
          prize,
          status: 'partially_paid',
          label: 'Prize partially paid',
          totalPaid,
          payoutIds: prizePayouts.map((p) => p.id),
        };
      }
      return {
        prize,
        status: 'awaiting_payout',
        label: 'Prize payout processing',
        totalPaid: 0,
        payoutIds: prizePayouts.map((p) => p.id),
      };
    } catch {
      // Wallet service unreachable — payout state is non-critical.
      return null;
    }
  }

  /**
   * Ranked leaderboard for a challenge, proxied from creator-service. Best-effort:
   * an unreachable upstream yields an empty board (the page renders its own empty
   * state) instead of failing the whole tab.
   */
  async getChallengeLeaderboard(challengeId: string): Promise<{
    challenge: { id: string; title: string; prize?: number; endDate?: string };
    totalEntries: number;
    entries: {
      position: number;
      entryId: string;
      userId: string;
      displayName: string;
      status: string;
      submittedAt: string;
    }[];
  }> {
    const res = await this.creatorsClient.getChallengeLeaderboard(challengeId);
    if (!res.success || !res.data) {
      return { challenge: { id: challengeId, title: 'Challenge' }, totalEntries: 0, entries: [] };
    }
    return res.data;
  }

  async getCreatorProfile(userId: string): Promise<Record<string, unknown> | null> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!profile) return null;
    // displayName/avatar/email live on the user record — the portal profile
    // form hydrates from this endpoint, so without the join the fields would
    // go blank after every reload.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, avatar: true, email: true },
    });
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: user?.displayName,
      avatar: user?.avatar,
      email: user?.email,
      bio: profile.bio,
      banner: profile.banner,
      socialLinks: profile.socialLinks,
      verified: profile.verified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /** PUT /creator/profile — update the creator's own profile (name, avatar, bio, socials, website). */
  async updateCreatorProfile(
    userId: string,
    data: {
      bio?: string;
      banner?: string;
      displayName?: string;
      avatar?: string;
      website?: string;
      socialLinks?: Record<string, string>;
    }
  ): Promise<Record<string, unknown>> {
    const cleanBio = data.bio?.replace(/<[^>]*>/g, '');
    const cleanName = data.displayName?.replace(/<[^>]*>/g, '').trim();
    if (cleanName === '') {
      throw new BadRequestException('Display name cannot be empty');
    }

    // Website lives in socialLinks; explicit socialLinks entries win.
    // An empty-string website is an explicit clear and must persist.
    const socialLinks: Record<string, string> = {
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.socialLinks ?? {}),
    };
    const hasSocialLinks = data.website !== undefined || data.socialLinks !== undefined;

    const profile = await this.prisma.creatorProfile.upsert({
      where: { userId },
      update: {
        ...(cleanBio !== undefined ? { bio: cleanBio } : {}),
        ...(data.banner !== undefined ? { banner: data.banner } : {}),
        ...(hasSocialLinks ? { socialLinks: socialLinks as Prisma.InputJsonValue } : {}),
      },
      create: {
        userId,
        bio: cleanBio,
        banner: data.banner,
        socialLinks: socialLinks as Prisma.InputJsonValue,
      },
    });

    // displayName and avatar live on the user record.
    if (cleanName !== undefined || data.avatar !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(cleanName !== undefined ? { displayName: cleanName } : {}),
          ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, avatar: true, email: true },
    });

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: user?.displayName,
      avatar: user?.avatar,
      email: user?.email,
      bio: profile.bio,
      banner: profile.banner,
      socialLinks: profile.socialLinks,
      verified: profile.verified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * GET /creator/subscribers/stats — follower counts via user-service's
   * internal RPC only (AUD-11: the `following` table lives in another
   * service's DB and is never queried from here).
   */
  async getSubscriberStats(userId: string): Promise<{
    totalSubscribers: number;
    newThisWeek: number;
    newThisMonth: number;
    churnRate: number;
  }> {
    const remoteFollowerCount = await this.fetchFollowerCountFromUserService(userId);
    if (remoteFollowerCount === null) {
      throw new ServiceUnavailableException('user-service unavailable');
    }
    // The RPC exposes only the current total: windowed counts (week/month)
    // and churn have no remote source yet, so they degrade explicitly to 0 —
    // the same values the RPC path has always returned.
    return {
      totalSubscribers: remoteFollowerCount,
      newThisWeek: 0,
      newThisMonth: 0,
      churnRate: 0,
    };
  }

  async getSettings(userId: string): Promise<{
    payoutMethod: string;
    minimumPayout: number;
    notifications: { email: boolean; push: boolean; sms: boolean; marketing: boolean };
    privacy: { profileVisibility: string; showEarnings: boolean; allowMessages: boolean };
  }> {
    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const notifications = (user?.notificationPreferences as Record<string, unknown>) || {};
    const privacy = (user?.preferences as Record<string, unknown>) || {};

    return {
      payoutMethod: creatorProfile?.payoutMethod || 'bank_transfer',
      minimumPayout: creatorProfile?.minimumPayout ? Number(creatorProfile.minimumPayout) : 50,
      notifications: {
        email: notifications.email !== false,
        push: notifications.push !== false,
        sms: notifications.sms === true,
        marketing: notifications.marketing === true,
      },
      privacy: {
        profileVisibility: (privacy.profileVisibility as string) || 'public',
        showEarnings: privacy.showEarnings === true,
        allowMessages: privacy.allowMessages !== false,
      },
    };
  }

  async updatePayoutSettings(
    userId: string,
    data: { method?: string; minimum?: number }
  ): Promise<{ success: boolean }> {
    if (data.method) {
      const allowedMethods = PAYOUT_METHODS;
      if (!allowedMethods.includes(data.method)) {
        throw new BadRequestException('Invalid payout method');
      }
    }

    await this.prisma.creatorProfile.upsert({
      where: { userId },
      update: {
        payoutMethod: data.method,
        minimumPayout: data.minimum,
      },
      create: {
        userId,
        payoutMethod: data.method,
        minimumPayout: data.minimum,
      },
    });

    return { success: true };
  }

  async updateSettings(
    userId: string,
    data: {
      payoutMethod?: string;
      minimumPayout?: number;
      notifications?: { email: boolean; push: boolean; sms: boolean; marketing: boolean };
      privacy?: { profileVisibility: string; showEarnings: boolean; allowMessages: boolean };
    }
  ): Promise<{ success: boolean }> {
    // Update payout settings if provided
    if (data.payoutMethod || data.minimumPayout !== undefined) {
      await this.updatePayoutSettings(userId, {
        method: data.payoutMethod,
        minimum: data.minimumPayout,
      });
    }

    // Update notification and privacy preferences in user record
    if (data.notifications || data.privacy) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const existingPrefs = (user.notificationPreferences as Record<string, unknown>) || {};
      const existingPrefs2 = (user.preferences as Record<string, unknown>) || {};

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: (data.notifications
            ? { ...existingPrefs, ...data.notifications }
            : existingPrefs) as Prisma.InputJsonValue,
          preferences: (data.privacy
            ? { ...existingPrefs2, ...data.privacy }
            : existingPrefs2) as Prisma.InputJsonValue,
        },
      });
    }

    return { success: true };
  }

  /**
   * Helper to query user-service over HTTP for follower information,
   * avoiding direct cross-database dependencies in microservice deployments.
   */
  private async fetchFollowersFromUserService(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    followers: Array<{
      id: string;
      displayName?: string;
      email?: string;
      avatar?: string;
      createdAt?: string;
    }>;
    total: number;
  } | null> {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `${userServiceUrl}/users/${encodeURIComponent(userId)}/followers?page=${page}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.INTERNAL_API_KEY
              ? { 'x-internal-api-key': process.env.INTERNAL_API_KEY }
              : {}),
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const body = (await res.json()) as {
          data?: {
            followers?: Array<{
              id: string;
              displayName?: string;
              email?: string;
              avatar?: string;
            }>;
            pagination?: { total?: number };
          };
        };
        const data = body?.data;
        if (data && typeof data.pagination?.total === 'number') {
          return {
            followers: Array.isArray(data.followers) ? data.followers : [],
            total: data.pagination.total,
          };
        }
      }
    } catch {
      // AUD-11: null = user-service unavailable; callers surface it
      // (there is deliberately no cross-database $queryRaw fallback).
    }
    return null;
  }

  private async fetchFollowerCountFromUserService(userId: string): Promise<number | null> {
    const res = await this.fetchFollowersFromUserService(userId, 1, 1);
    return res !== null ? res.total : null;
  }
}
