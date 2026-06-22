import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RewardsModule } from './rewards.module';
import { RewardsRepository } from './rewards.repository';
import { JwtService } from '@nestjs/jwt';

describe('Rewards Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RewardsModule],
    })
      .overrideProvider(RewardsRepository)
      .useValue({
        getAvailableRewards: jest.fn(),
        claimReward: jest.fn(),
        getUserRewards: jest.fn(),
        getUserBalance: jest.fn(),
        redeemReward: jest.fn(),
        addReward: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /rewards', () => {
    it('should get available rewards', async () => {
      const rewardsRepository = app.get(RewardsRepository);

      jest.spyOn(rewardsRepository, 'getAvailableRewards').mockResolvedValue([
        {
          id: 'reward-1',
          name: '100 Points',
          description: 'Earn 100 points',
          points: 100,
          type: 'achievement',
        },
      ]);

      const response = await request(app.getHttpServer()).get('/rewards');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
      });
    });
  });

  describe('POST /rewards/:id/claim', () => {
    it('should claim a reward', async () => {
      const rewardsRepository = app.get(RewardsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(rewardsRepository, 'claimReward').mockResolvedValue({
        id: 'claimed-1',
        userId: 'user-123',
        rewardId: 'reward-1',
        points: 100,
        claimedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/rewards/reward-1/claim')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          points: 100,
        }),
      });
    });
  });

  describe('GET /rewards/user/balance', () => {
    it('should get user reward balance', async () => {
      const rewardsRepository = app.get(RewardsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(rewardsRepository, 'getUserBalance').mockResolvedValue({
        totalPoints: 500,
        earnedPoints: 1000,
        redeemedPoints: 500,
      });

      const response = await request(app.getHttpServer())
        .get('/rewards/user/balance')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          totalPoints: 500,
        }),
      });
    });
  });

  describe('POST /rewards/redeem', () => {
    it('should redeem points for gift card', async () => {
      const rewardsRepository = app.get(RewardsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(rewardsRepository, 'redeemReward').mockResolvedValue({
        id: 'redemption-1',
        userId: 'user-123',
        pointsRedeemed: 500,
        giftCardCode: 'GIFT-123',
        redeemedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/rewards/redeem')
        .set('Authorization', 'Bearer valid-token')
        .send({ points: 500 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          giftCardCode: 'GIFT-123',
        }),
      });
    });
  });
});
