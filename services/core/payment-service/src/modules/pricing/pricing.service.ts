import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PRICE_CONFIG } from '@azeebo/shared-types';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  private getConfig(key: string, defaultValue?: string): string {
    // Centralized default: the canonical PRICE_CONFIG map in shared-types is
    // the single source of truth; per-call defaults remain as overrides.
    const fallback = defaultValue ?? PRICE_CONFIG[key] ?? '';
    const value = this.configService.get<string>(key);
    if (!value) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(`Missing required pricing config: ${key}, using default: ${fallback}`);
      }
      return fallback;
    }
    return value;
  }

  async getMoviePricing() {
    try {
      return {
        success: true,
        data: {
          rent48h: {
            id: 'rent-48h',
            type: 'Rent (48h)',
            price: parseInt(this.getConfig('MOVIE_RENT_PRICE'), 10),
            currency: 'NGN',
          },
          buy: {
            id: 'buy',
            type: 'Buy',
            price: parseInt(this.getConfig('MOVIE_BUY_PRICE'), 10),
            currency: 'NGN',
          },
          pass: {
            id: 'pass',
            type: 'Pass',
            price: parseInt(this.getConfig('MOVIE_PASS_PRICE'), 10),
            currency: 'NGN',
            period: 'monthly',
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get movie pricing', (error as Error).stack);
      throw error;
    }
  }

  async getVotePackages(type: string) {
    try {
      const packages: Record<string, unknown[]> = {
        standard: [
          {
            id: 'std-1',
            votes: 10,
            price: parseInt(this.getConfig('VOTE_STANDARD_10'), 10),
            bonus: 0,
          },
          {
            id: 'std-2',
            votes: 50,
            price: parseInt(this.getConfig('VOTE_STANDARD_50'), 10),
            bonus: 5,
          },
          {
            id: 'std-3',
            votes: 100,
            price: parseInt(this.getConfig('VOTE_STANDARD_100'), 10),
            bonus: 15,
          },
          {
            id: 'std-4',
            votes: 500,
            price: parseInt(this.getConfig('VOTE_STANDARD_500'), 10),
            bonus: 100,
          },
        ],
        reality: [
          {
            id: 'rty-1',
            votes: 100,
            price: parseInt(this.getConfig('VOTE_REALITY_100'), 10),
            bonus: 0,
          },
          {
            id: 'rty-2',
            votes: 500,
            price: parseInt(this.getConfig('VOTE_REALITY_500'), 10),
            bonus: 50,
          },
          {
            id: 'rty-3',
            votes: 1000,
            price: parseInt(this.getConfig('VOTE_REALITY_1000'), 10),
            bonus: 100,
          },
          {
            id: 'rty-4',
            votes: 5000,
            price: parseInt(this.getConfig('VOTE_REALITY_5000'), 10),
            bonus: 500,
          },
        ],
        superVote: [
          {
            id: 'sv-1',
            votes: 1,
            price: parseInt(this.getConfig('SUPER_VOTE_1'), 10),
            multiplier: 10,
          },
          {
            id: 'sv-2',
            votes: 5,
            price: parseInt(this.getConfig('SUPER_VOTE_5'), 10),
            multiplier: 10,
          },
          {
            id: 'sv-3',
            votes: 10,
            price: parseInt(this.getConfig('SUPER_VOTE_10'), 10),
            multiplier: 10,
          },
          {
            id: 'sv-4',
            votes: 25,
            price: parseInt(this.getConfig('SUPER_VOTE_25'), 10),
            multiplier: 10,
          },
        ],
      };

      return {
        success: true,
        data: packages[type] || packages.standard,
      };
    } catch (error) {
      this.logger.error('Failed to get vote packages', (error as Error).stack);
      throw error;
    }
  }

  async getSubscriptionPlans() {
    try {
      return {
        success: true,
        data: {
          basic: {
            id: 'sub-basic',
            name: 'Basic',
            price: parseInt(this.getConfig('SUB_BASIC_PRICE'), 10),
            currency: 'NGN',
            period: 'monthly',
            features: this.getConfig(
              'SUB_BASIC_FEATURES',
              'HD Streaming,Limited Content,1 Device'
            ).split(','),
          },
          premium: {
            id: 'sub-premium',
            name: 'Premium',
            price: parseInt(this.getConfig('SUB_PREMIUM_PRICE'), 10),
            currency: 'NGN',
            period: 'monthly',
            features: this.getConfig(
              'SUB_PREMIUM_FEATURES',
              '4K Streaming,All Content,3 Devices,Offline Download'
            ).split(','),
          },
          vip: {
            id: 'sub-vip',
            name: 'VIP',
            price: parseInt(this.getConfig('SUB_VIP_PRICE'), 10),
            currency: 'NGN',
            period: 'monthly',
            features: this.getConfig(
              'SUB_VIP_FEATURES',
              '4K Streaming,All Content,5 Devices,Offline Download,Early Access,Exclusive Content'
            ).split(','),
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get subscription plans', (error as Error).stack);
      throw error;
    }
  }

  async getWalletPricing() {
    try {
      const presetAmountsStr = this.getConfig(
        'WALLET_PRESET_AMOUNTS',
        '500,1000,2000,5000,10000,20000'
      );
      const withdrawalQuickStr = this.getConfig(
        'WALLET_WITHDRAWAL_QUICK_AMOUNTS',
        '1000,5000,10000,20000'
      );

      return {
        success: true,
        data: {
          presetAmounts: presetAmountsStr.split(',').map(Number),
          limits: {
            minDeposit: parseInt(this.getConfig('WALLET_MIN_DEPOSIT'), 10),
            maxDeposit: parseInt(this.getConfig('WALLET_MAX_DEPOSIT'), 10),
            minWithdrawal: parseInt(this.getConfig('WALLET_MIN_WITHDRAWAL'), 10),
          },
          withdrawalQuickAmounts: withdrawalQuickStr.split(',').map(Number),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get wallet pricing', (error as Error).stack);
      throw error;
    }
  }

  async getPassesPricing() {
    try {
      return {
        success: true,
        data: {
          daily: {
            id: 'pass-daily',
            name: 'Daily Pass',
            price: parseInt(this.getConfig('PASS_DAILY_PRICE'), 10),
            currency: 'NGN',
            duration: '24 hours',
          },
          weekly: {
            id: 'pass-weekly',
            name: 'Weekly Pass',
            price: parseInt(this.getConfig('PASS_WEEKLY_PRICE'), 10),
            currency: 'NGN',
            duration: '7 days',
          },
          monthly: {
            id: 'pass-monthly',
            name: 'Monthly Pass',
            price: parseInt(this.getConfig('PASS_MONTHLY_PRICE'), 10),
            currency: 'NGN',
            duration: '30 days',
          },
        },
      };
    } catch (error) {
      this.logger.error('Failed to get passes pricing', (error as Error).stack);
      throw error;
    }
  }
}
