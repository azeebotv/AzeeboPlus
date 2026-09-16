import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // Subscriber count: safely query the following table, returning 0 if it doesn't exist
    let subscriberCount = 0;
    let previousSubscriberCount = 0;
    try {
      const [currentResult, previousResult] = await Promise.all([
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following" WHERE "followingId" = ${userId}
        `,
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following"
          WHERE "followingId" = ${userId} AND "createdAt" < ${currentPeriodStart}
        `,
      ]);
      subscriberCount = Number(currentResult[0]?.count ?? 0);
      previousSubscriberCount = Number(previousResult[0]?.count ?? 0);
    } catch (err: unknown) {
      // If the table doesn't exist, return 0; re-throw other errors
      const message = err instanceof Error ? err.message : String(err);
      if (
        !message.includes('does not exist') &&
        !message.includes('relation') &&
        !message.includes('table')
      ) {
        throw err;
      }
    }

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
      data: { status: 'archived' },
    });

    return true;
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
    let newSubscribers = 0;
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

      // New subscribers in the window, if the following table exists
      const subRows = await this.prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int as count FROM "following"
        WHERE "followingId" = ${userId} AND "createdAt" >= ${startDate}
      `;
      newSubscribers = Number(subRows[0]?.count ?? 0);
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

    let followerRows: { followerId: string; createdAt: Date }[] = [];
    let total = 0;
    try {
      // The following table lives in the user-service DB, not this one —
      // only query it when it exists to avoid a hard dependency.
      const [rows, count] = await Promise.all([
        this.prisma.$queryRaw<{ followerId: string; createdAt: Date }[]>`
          SELECT "followerId", "createdAt" FROM "following"
          WHERE "followingId" = ${userId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit} OFFSET ${(page - 1) * limit}
        `,
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following" WHERE "followingId" = ${userId}
        `,
      ]);
      followerRows = rows.map((r) => ({ followerId: r.followerId, createdAt: r.createdAt }));
      total = Number(count[0]?.count ?? 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        !message.includes('does not exist') &&
        !message.includes('relation') &&
        !message.includes('table')
      ) {
        throw err;
      }
      return empty;
    }

    if (followerRows.length === 0) return empty;

    // Resolve follower identities
    const users = await this.prisma.user.findMany({
      where: { id: { in: followerRows.map((f) => f.followerId) } },
      select: { id: true, displayName: true, email: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 30-day cumulative growth series
    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let growth: { date: string; count: number }[] = [];
    try {
      const raw = await this.prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(*)::int as count
        FROM "following"
        WHERE "followingId" = ${userId} AND "createdAt" >= ${periodStart}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date
      `;
      const byDay = new Map(
        raw.map((r) => [new Date(r.date).toISOString().slice(0, 10), Number(r.count)])
      );
      let cumulative = total;
      const days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        cumulative -= byDay.get(d) ?? 0;
        days.push({ date: d, count: Math.max(0, cumulative) });
      }
      growth = days;
    } catch {
      growth = [];
    }

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

    // Inbound: pull upstream entries and upsert any the portal doesn't have.
    let upstream: {
      id: string;
      challengeId: string;
      contentUrl?: string;
      status?: string;
      createdAt?: string;
    }[] = [];
    try {
      const res = await this.creatorsClient.getMyChallengeEntries(userId);
      if (res.success && Array.isArray(res.data?.challenges)) {
        upstream = res.data.challenges;
      }
    } catch {
      // Upstream unavailable — local rows still render.
    }

    const localIds = new Set(local.map((s) => s.challengeId));
    const hydrated = upstream.filter((e) => !localIds.has(e.challengeId));
    if (hydrated.length > 0) {
      // Preserve upstream entry IDs where possible for traceability.
      await this.prisma.challengeSubmission.createMany({
        data: hydrated.map((e) => ({
          id: e.id,
          userId,
          challengeId: e.challengeId,
          title: this.titleFromContentUrl(e.contentUrl),
          status: e.status || 'submitted',
          submittedAt: e.createdAt ? new Date(e.createdAt) : undefined,
        })),
        skipDuplicates: true,
      });
      const fresh = await this.prisma.challengeSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        take: 50,
      });
      return fresh.map((s) => this.mapSubmission(s));
    }

    return local.map((s) => this.mapSubmission(s));
  }

  private mapSubmission(s: {
    id: string;
    challengeId: string;
    title: string;
    status: string;
    submittedAt: Date;
  }) {
    return {
      id: s.id,
      challengeId: s.challengeId,
      title: s.title,
      status: s.status,
      submittedAt: s.submittedAt.toISOString(),
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
    title: string
  ): Promise<{ success: boolean; submissionId: string; entryId?: string; synced: boolean }> {
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim();
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
    // systems can trace the submission.
    let entryId: string | undefined;
    let synced = false;
    const contentUrl = `/submissions/${challengeId}/${cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;
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
      data: { userId, challengeId, title: cleanTitle, upstreamId: entryId },
    });

    return { success: true, submissionId: submission.id, entryId, synced };
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
   * GET /creator/subscribers/stats — real follower counts with the same
   * table-missing guards as getSubscribers (the following table lives in
   * another service's DB and may not exist locally).
   */
  async getSubscriberStats(userId: string): Promise<{
    totalSubscribers: number;
    newThisWeek: number;
    newThisMonth: number;
    churnRate: number;
  }> {
    const empty = { totalSubscribers: 0, newThisWeek: 0, newThisMonth: 0, churnRate: 0 };
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      const [totalRows, weekRows, monthRows] = await Promise.all([
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following" WHERE "followingId" = ${userId}
        `,
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following"
          WHERE "followingId" = ${userId} AND "createdAt" >= ${weekAgo}
        `,
        this.prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(*)::int as count FROM "following"
          WHERE "followingId" = ${userId} AND "createdAt" >= ${monthAgo}
        `,
      ]);
      return {
        totalSubscribers: Number(totalRows[0]?.count ?? 0),
        newThisWeek: Number(weekRows[0]?.count ?? 0),
        newThisMonth: Number(monthRows[0]?.count ?? 0),
        churnRate: 0,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('does not exist') ||
        message.includes('relation') ||
        message.includes('table')
      ) {
        return empty;
      }
      throw err;
    }
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
}
