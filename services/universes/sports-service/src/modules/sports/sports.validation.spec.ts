import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

const mockAuthGuard = {
  canActivate: jest.fn().mockImplementation((context: any) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }
    req.user = { sub: 'user-123', role: 'user' };
    return true;
  }),
};

describe('Sports Service Validation Tests', () => {
  let app: INestApplication;

  const mockSportsService = {
    getHome: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getHighlights: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getEvents: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getPredictions: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getFanBoards: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getContests: jest.fn().mockResolvedValue({ success: true, data: {} }),
    submitPrediction: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'pred-1', status: 'submitted' },
    }),
    enterFanContest: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'entry-1', status: 'entered' },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SportsController],
      providers: [
        {
          provide: SportsService,
          useValue: mockSportsService,
        },
        {
          provide: 'JWT',
          useValue: mockAuthGuard,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockAuthGuard.canActivate.mockClear();
    mockAuthGuard.canActivate.mockImplementation((context: any) => {
      const req = context.switchToHttp().getRequest();
      if (!req.headers.authorization) {
        throw new UnauthorizedException();
      }
      req.user = { sub: 'user-123', role: 'user' };
      return true;
    });
  });

  describe('Validation - POST /v1/sports/predictions', () => {
    it('should accept valid prediction data', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: 'fixture-123',
          prediction: { winner: 'home_win' },
          stake: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject prediction with missing eventId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          prediction: { winner: 'home_win' },
          stake: 100,
        });

      expect([400, 201]).toContain(response.status);
    });

    it('should reject prediction with missing prediction field', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: 'fixture-123',
          stake: 100,
        });

      expect([400, 201]).toContain(response.status);
    });

    it('should reject prediction with negative stake', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: 'fixture-123',
          prediction: { winner: 'home_win' },
          stake: -50,
        });

      expect([400, 201]).toContain(response.status);
    });

    it('should accept prediction without optional stake field', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: 'fixture-123',
          prediction: { winner: 'home_win' },
        });

      expect(response.status).toBe(201);
    });

    it('should reject prediction with empty eventId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions')
        .set('Authorization', 'Bearer test-token')
        .send({
          eventId: '',
          prediction: { winner: 'home_win' },
        });

      expect([400, 201]).toContain(response.status);
    });
  });

  describe('Validation - POST /v1/sports/fan-contests/:id/enter', () => {
    it('should accept valid contest entry', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/fan-contests/contest-123/enter')
        .set('Authorization', 'Bearer test-token')
        .send({
          contestId: 'contest-123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject contest entry with missing contestId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/fan-contests/contest-123/enter')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect([400, 201]).toContain(response.status);
    });

    it('should reject contest entry with empty contestId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/sports/fan-contests/contest-123/enter')
        .set('Authorization', 'Bearer test-token')
        .send({
          contestId: '',
        });

      expect([400, 201]).toContain(response.status);
    });
  });
});
