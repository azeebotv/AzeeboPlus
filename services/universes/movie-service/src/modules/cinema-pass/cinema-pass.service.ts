import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import axios from 'axios';

interface CinemaPass {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

interface PassSubscription {
  id: string;
  userId: string;
  passId: string;
  passName: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

interface CinemaPassResponse {
  success: boolean;
  data?:
    | CinemaPass
    | CinemaPass[]
    | PassSubscription
    | PassSubscription[]
    | { items: CinemaPass[]; total: number }
    | { message: string }
    | { hasAccess: boolean; passType?: string };
  error?: { code: string; message: string };
}

@Injectable()
export class CinemaPassService {
  private readonly logger = new Logger(CinemaPassService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

  private async trackEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/v1/analytics/events`,
        { type: eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  async getPasses(): Promise<CinemaPassResponse> {
    try {
      const passes = await this.prisma.cinemaPass.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });

      const formatted: CinemaPass[] = passes.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        type: p.type,
        price: Number(p.price),
        currency: p.currency,
        features: p.features || [],
        isActive: p.isActive,
      }));

      return { success: true, data: formatted };
    } catch (error) {
      this.logger.error(`Failed to get passes: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get passes' },
      };
    }
  }

  async getPassById(id: string): Promise<CinemaPassResponse> {
    try {
      const pass = await this.prisma.cinemaPass.findUnique({ where: { id } });

      if (!pass) {
        throw new NotFoundException(`Pass not found: ${id}`);
      }

      return {
        success: true,
        data: {
          id: pass.id,
          name: pass.name,
          description: pass.description || '',
          type: pass.type,
          price: Number(pass.price),
          currency: pass.currency,
          features: pass.features || [],
          isActive: pass.isActive,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get pass by id: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get pass' },
      };
    }
  }

  async subscribe(userId: string, passId: string, autoRenew = true): Promise<CinemaPassResponse> {
    try {
      const existing = await this.prisma.cinemaPassSubscription.findUnique({
        where: { userId_passId: { userId, passId } },
      });

      if (existing && existing.status === 'active') {
        throw new BadRequestException('Already subscribed to this pass');
      }

      const pass = await this.prisma.cinemaPass.findUnique({ where: { id: passId } });
      if (!pass) {
        throw new NotFoundException(`Pass not found: ${passId}`);
      }

      const passPrice = Number(pass.price);

      const now = new Date();
      const endDate = new Date();
      if (pass.type === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (pass.type === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const idempotencyKey = `${userId}-${passId}-${now.getTime()}`;

      if (passPrice > 0) {
        let walletId: string;
        try {
          const walletResponse = await axios.get(
            `${this.walletServiceBaseUrl}/wallet/user/${userId}`,
            { timeout: 10000 }
          );
          const wallet = walletResponse.data?.data;
          if (!wallet) {
            throw new NotFoundException('Wallet not found');
          }
          walletId = wallet.id;
          if (Number(wallet.balance) < passPrice) {
            throw new BadRequestException('Insufficient balance');
          }
        } catch (error) {
          mapAndThrow(error, 'looking up wallet for cinema pass');
        }

        try {
          await axios.post(
            `${this.walletServiceBaseUrl}/wallet/debit`,
            {
              walletId,
              amount: passPrice,
              description: `Cinema pass subscription: ${pass.name}`,
              idempotencyKey,
            },
            { timeout: 10000 }
          );
        } catch (error) {
          mapAndThrow(error, 'charging cinema pass');
        }
      }

      const subscription = await this.prisma.cinemaPassSubscription.upsert({
        where: { userId_passId: { userId, passId } },
        create: {
          userId,
          passId,
          status: 'active',
          startDate: now,
          endDate,
          autoRenew,
        },
        update: {
          status: 'active',
          startDate: now,
          endDate,
          autoRenew,
        },
        include: { pass: true },
      });

      if (passPrice > 0) {
        await this.trackEvent('payment_success', userId, {
          passId,
          passName: pass.name,
          amount: passPrice,
          type: 'cinema_pass',
          subscriptionId: subscription.id,
        });
      }

      return {
        success: true,
        data: {
          id: subscription.id,
          userId: subscription.userId,
          passId: subscription.passId,
          passName: subscription.pass.name,
          status: subscription.status,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate.toISOString(),
          autoRenew: subscription.autoRenew,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to subscribe to pass: ${error}`);
      return {
        success: false,
        error: { code: 'SUBSCRIBE_FAILED', message: 'Failed to subscribe to pass' },
      };
    }
  }

  async cancelSubscription(userId: string, passId: string): Promise<CinemaPassResponse> {
    try {
      const subscription = await this.prisma.cinemaPassSubscription.findUnique({
        where: { userId_passId: { userId, passId } },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      await this.prisma.cinemaPassSubscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled', autoRenew: false },
      });

      return { success: true, data: { message: 'Subscription cancelled' } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to cancel subscription: ${error}`);
      return {
        success: false,
        error: { code: 'CANCEL_FAILED', message: 'Failed to cancel subscription' },
      };
    }
  }

  async getUserSubscriptions(userId: string): Promise<CinemaPassResponse> {
    try {
      const subscriptions = await this.prisma.cinemaPassSubscription.findMany({
        where: { userId },
        include: { pass: true },
        orderBy: { createdAt: 'desc' },
      });

      const formatted: PassSubscription[] = subscriptions
        .filter((s) => s.status === 'active')
        .map((s) => ({
          id: s.id,
          userId: s.userId,
          passId: s.passId,
          passName: s.pass.name,
          status: s.status,
          startDate: s.startDate.toISOString(),
          endDate: s.endDate.toISOString(),
          autoRenew: s.autoRenew,
        }));

      return { success: true, data: formatted };
    } catch (error) {
      this.logger.error(`Failed to get user subscriptions: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get subscriptions' },
      };
    }
  }

  async checkAccess(
    userId: string,
    movieId: string
  ): Promise<{ hasAccess: boolean; passType?: string }> {
    try {
      const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
      if (!movie) {
        throw new NotFoundException('Movie not found');
      }

      const now = new Date();
      const activeSubscription = await this.prisma.cinemaPassSubscription.findFirst({
        where: {
          userId,
          status: 'active',
          endDate: { gt: now },
        },
        include: { pass: true },
      });

      if (!activeSubscription) {
        return { hasAccess: false };
      }

      const viewingWindow = await this.prisma.viewingWindow.findFirst({
        where: {
          movieId,
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      });

      if (!viewingWindow) {
        return { hasAccess: false };
      }

      if (viewingWindow.type === 'premium' && activeSubscription.pass.type !== 'premium') {
        return { hasAccess: false };
      }

      return { hasAccess: true, passType: activeSubscription.pass.type };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to check access: ${error}`);
      throw error;
    }
  }
}
