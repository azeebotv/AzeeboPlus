import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PricingService } from './pricing.service.js';
import { PRICE_CONFIG } from '@azeebo/shared-types';

describe('PricingService (centralized PRICE_CONFIG defaults)', () => {
  let service: PricingService;

  const build = async (env: Record<string, string> = {}): Promise<PricingService> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => env[key]),
          },
        },
      ],
    }).compile();
    return moduleFixture.get<PricingService>(PricingService);
  };

  beforeEach(async () => {
    service = await build();
  });

  it('uses the centralized PRICE_CONFIG default when no env is set', async () => {
    const result = await service.getMoviePricing();
    expect(result.success).toBe(true);
    const data = result.data as {
      rent48h: { price: number };
      buy: { price: number };
      pass: { price: number };
    };
    expect(data.rent48h.price).toBe(Number(PRICE_CONFIG.MOVIE_RENT_PRICE));
    expect(data.buy.price).toBe(Number(PRICE_CONFIG.MOVIE_BUY_PRICE));
    expect(data.pass.price).toBe(Number(PRICE_CONFIG.MOVIE_PASS_PRICE));
  });

  it('prefers env vars over the centralized defaults', async () => {
    service = await build({ MOVIE_RENT_PRICE: '999', MOVIE_BUY_PRICE: '1999' });
    const result = await service.getMoviePricing();
    const data = result.data as { rent48h: { price: number }; buy: { price: number } };
    expect(data.rent48h.price).toBe(999);
    expect(data.buy.price).toBe(1999);
  });

  it('subscription plans fall back to PRICE_CONFIG', async () => {
    const result = await service.getSubscriptionPlans();
    const data = result.data as {
      basic: { price: number };
      premium: { price: number };
      vip: { price: number };
    };
    expect(data.basic.price).toBe(Number(PRICE_CONFIG.SUB_BASIC_PRICE));
    expect(data.premium.price).toBe(Number(PRICE_CONFIG.SUB_PREMIUM_PRICE));
    expect(data.vip.price).toBe(Number(PRICE_CONFIG.SUB_VIP_PRICE));
  });

  it('wallet limits + passes fall back to PRICE_CONFIG', async () => {
    const wallet = await service.getWalletPricing();
    const wdata = wallet.data as {
      limits: { minDeposit: number; maxDeposit: number; minWithdrawal: number };
    };
    expect(wdata.limits.minDeposit).toBe(Number(PRICE_CONFIG.WALLET_MIN_DEPOSIT));
    expect(wdata.limits.maxDeposit).toBe(Number(PRICE_CONFIG.WALLET_MAX_DEPOSIT));
    expect(wdata.limits.minWithdrawal).toBe(Number(PRICE_CONFIG.WALLET_MIN_WITHDRAWAL));

    const passes = await service.getPassesPricing();
    const pdata = passes.data as {
      daily: { price: number };
      weekly: { price: number };
      monthly: { price: number };
    };
    expect(pdata.daily.price).toBe(Number(PRICE_CONFIG.PASS_DAILY_PRICE));
    expect(pdata.weekly.price).toBe(Number(PRICE_CONFIG.PASS_WEEKLY_PRICE));
    expect(pdata.monthly.price).toBe(Number(PRICE_CONFIG.PASS_MONTHLY_PRICE));
  });

  it('vote packages fall back to PRICE_CONFIG', async () => {
    const result = await service.getVotePackages('standard');
    const data = result.data as Array<{ votes: number; price: number }>;
    const first = data[0];
    expect(first.price).toBe(Number(PRICE_CONFIG.VOTE_STANDARD_10));
  });
});
