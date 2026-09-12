import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { CreateBundleDto } from './dto/create-bundle.dto.js';
import { SubscribeBundleDto } from './dto/subscribe-bundle.dto.js';
import type { BundlePass, BundleSubscription } from '../../prisma/client/index.js';
import { randomUUID } from 'crypto';
import axios from 'axios';
import {
  walletLookupUrl,
  walletDebitUrl,
  walletDebitPayload,
  walletInternalHeaders as buildWalletInternalHeaders,
} from '../../wallet-payloads.js';

@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;
  // Secret for internal wallet-service calls — same resolution order the
  // wallet-service InternalSecretGuard uses to validate it.
  private readonly internalApiKey: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.walletServiceBaseUrl = this.configService.get<string>(
      'WALLET_SERVICE_URL',
      'http://wallet-service:3002'
    );
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
    // Secret for internal wallet-service calls — same resolution order the
    // wallet-service InternalSecretGuard uses to validate it.
    this.internalApiKey =
      this.configService.get<string>('GATEWAY_SECRET') ??
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  /**
   * Headers for internal wallet-service calls (bundle purchase debits).
   * Those routes carry no user identity — the shared secret authenticates
   * the service itself (wallet-service InternalSecretGuard).
   */
  private walletInternalHeaders(): Record<string, string> {
    return buildWalletInternalHeaders(this.internalApiKey);
  }

  async getBundles(): Promise<BundlePass[]> {
    const cacheK = cacheKey('bundle', 'passes');
    const cached = await this.cache.get<BundlePass[]>(cacheK);
    if (cached) return cached;

    const bundles = await this.prisma.bundlePass.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      take: 50,
    });

    await this.cache.set(cacheK, bundles, 300);
    return bundles;
  }

  async getBundleById(id: string): Promise<BundlePass> {
    const bundle = await this.prisma.bundlePass.findUnique({ where: { id } });
    if (!bundle) throw new NotFoundException(`Bundle with ID ${id} not found`);
    return bundle;
  }

  async getBundleComparison(): Promise<{
    bundles: BundlePass[];
    individualTotal: number;
    bundleSavings: number;
  }> {
    const bundles = await this.getBundles();
    const individualTotal = bundles.reduce((sum, b) => sum + Number(b.originalPrice), 0);
    const bundleSavings = individualTotal - bundles.reduce((sum, b) => sum + Number(b.price), 0);
    return { bundles, individualTotal, bundleSavings };
  }

  async createBundle(dto: CreateBundleDto): Promise<BundlePass> {
    const bundle = await this.prisma.bundlePass.create({ data: dto });
    await this.cache.invalidate('bundle:passes');
    return bundle;
  }

  async updateBundle(id: string, dto: Partial<CreateBundleDto>): Promise<BundlePass> {
    const existing = await this.prisma.bundlePass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Bundle with ID ${id} not found`);

    const bundle = await this.prisma.bundlePass.update({ where: { id }, data: dto });
    await this.cache.invalidate('bundle:passes');
    return bundle;
  }

  async deleteBundle(id: string): Promise<void> {
    const existing = await this.prisma.bundlePass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Bundle with ID ${id} not found`);

    const activeSubs = await this.prisma.bundleSubscription.count({
      where: { bundleId: id, status: 'active' },
    });
    if (activeSubs > 0) {
      throw new BadRequestException(
        `Cannot delete bundle with ${activeSubs} active subscription(s). Deactivate instead.`
      );
    }

    await this.prisma.bundlePass.delete({ where: { id } });
    await this.cache.invalidate('bundle:passes');
  }

  async subscribe(
    userId: string,
    bundleId: string,
    dto: SubscribeBundleDto
  ): Promise<BundleSubscription> {
    const bundle = await this.prisma.bundlePass.findUnique({ where: { id: bundleId } });
    if (!bundle) throw new NotFoundException(`Bundle ${bundleId} not found`);
    if (!bundle.isActive) throw new BadRequestException('Bundle is no longer available');

    const paymentMethod = dto.paymentMethod ?? 'wallet';
    if (paymentMethod === 'external' && !dto.paymentReference) {
      throw new BadRequestException(
        'Payment reference is required for external payments. Please complete payment first.'
      );
    }

    if (paymentMethod === 'wallet') {
      await this.debitWallet(userId, Number(bundle.price), `Bundle: ${bundle.name}`);
    } else {
      await this.verifyExternalPayment(dto.paymentReference!, bundle);
    }

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.bundleSubscription.findFirst({
        where: { userId, status: 'active' },
      });

      if (existing && existing.bundleId === bundleId) {
        throw new BadRequestException('You already have an active subscription to this bundle');
      }

      if (existing) {
        await tx.bundleSubscription.update({
          where: { id: existing.id },
          data: { status: 'cancelled' },
        });
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + bundle.duration);

      const newSub = await tx.bundleSubscription.create({
        data: {
          userId,
          bundleId,
          endDate,
          autoRenew: dto.autoRenew ?? true,
        },
        include: { bundle: true },
      });

      return newSub;
    });

    await this.cache.invalidate(`bundle:user:${userId}`);
    await this.cache.invalidate('bundle:passes');

    this.trackAnalyticsEvent('bundle_subscribed', userId, { bundleId, paymentMethod });
    return subscription;
  }

  async cancelSubscription(userId: string, subscriptionId: string): Promise<BundleSubscription> {
    const sub = await this.prisma.bundleSubscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new NotFoundException('Bundle subscription not found');

    const result = await this.prisma.bundleSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled', autoRenew: false },
    });

    await this.cache.invalidate(`bundle:user:${userId}`);
    this.trackAnalyticsEvent('bundle_cancelled', userId, { subscriptionId });
    return result;
  }

  async getCurrentBundle(userId: string): Promise<BundleSubscription | null> {
    const cacheK = cacheKey('bundle', `user:${userId}`);
    const cached = await this.cache.get<BundleSubscription>(cacheK);
    if (cached !== undefined && cached !== null) return cached;

    const result = await this.prisma.bundleSubscription.findFirst({
      where: { userId, status: 'active' },
      include: { bundle: true },
    });

    await this.cache.set(cacheK, result, 300);
    return result;
  }

  private async debitWallet(userId: string, amount: number, description: string): Promise<void> {
    try {
      const walletResponse = await axios.get(
        walletLookupUrl(this.walletServiceBaseUrl, userId),
        { headers: this.walletInternalHeaders(), timeout: 10000 }
      );
      // Internal lookup responds enveloped: { success, data: { balance, … } }.
      const wallet = walletResponse.data?.data;
      if (!wallet) {
        throw new BadRequestException('Wallet not found. Please fund your wallet first.');
      }
      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient wallet balance. Please fund your wallet.');
      }

      const idempotencyKey = randomUUID();
      await axios.post(
        walletDebitUrl(this.walletServiceBaseUrl, userId),
        walletDebitPayload(amount, description, idempotencyKey),
        { headers: this.walletInternalHeaders(), timeout: 10000 }
      );
    } catch (error) {
      this.logger.error(`Failed to debit wallet: ${(error as Error).message}`);
      mapAndThrow(error, 'debiting wallet');
    }
  }

  private async verifyExternalPayment(paymentReference: string, bundle: BundlePass): Promise<void> {
    try {
      const paymentVerification = await axios.get(
        `${this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL')}/v1/payments/${paymentReference}`,
        { timeout: 10000 }
      );

      if (paymentVerification.data?.status !== 'completed') {
        throw new BadRequestException('Payment has not been completed.');
      }
      if (Number(paymentVerification.data?.amount).toFixed(2) !== Number(bundle.price).toFixed(2)) {
        throw new BadRequestException('Payment amount does not match bundle price.');
      }
    } catch (error) {
      this.logger.error(`Failed to verify payment: ${(error as Error).message}`);
      mapAndThrow(error, 'verifying payment');
    }
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }
}
