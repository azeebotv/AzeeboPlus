import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { ComedyModule } from './comedy.module.js';
import { ComedyService } from './comedy.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../../common/services/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';

const mockAuthGuard = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canActivate: (context: any) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }
    req.user = { sub: 'user-123', role: 'user' };
    return true;
  },
};

describe('Comedy Controller Contract Tests', () => {
  let app: INestApplication;

  const mockComedyService = {
    getClips: jest.fn(),
    getComedians: jest.fn(),
    getSeries: jest.fn(),
    submitChallenge: jest.fn(),
    getChallenges: jest.fn(),
    shareClip: jest.fn(),
    getTrending: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ComedyModule],
    })
      .overrideProvider(ComedyService)
      .useValue(mockComedyService)
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-value'),
        getOrThrow: jest.fn().mockReturnValue('test-value'),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/v1/comedy/clips (GET)', () => {
    it('should return comedy clips feed', () => {
      mockComedyService.getClips.mockResolvedValue({
        success: true,
        data: [{ id: 'clip-1', title: 'Funny Clip' }],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/clips')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/v1/comedy/comedians (GET)', () => {
    it('should return comedian profiles', () => {
      mockComedyService.getComedians.mockResolvedValue({
        success: true,
        data: [{ id: 'comedian-1', name: 'John Doe' }],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/comedians')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/comedy/series (GET)', () => {
    it('should return comedy series', () => {
      mockComedyService.getSeries.mockResolvedValue({
        success: true,
        data: [{ id: 'series-1', title: 'Comedy Show' }],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/series')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/comedy/challenges (GET)', () => {
    it('should return active challenges', () => {
      mockComedyService.getChallenges.mockResolvedValue({
        success: true,
        data: [{ id: 'challenge-1', title: 'Funny Challenge' }],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/challenges')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/comedy/challenges (POST)', () => {
    it('should submit challenge entry', () => {
      mockComedyService.submitChallenge.mockResolvedValue({
        success: true,
        data: { entryId: 'entry-1', status: 'submitted' },
      });

      return request(app.getHttpServer())
        .post('/v1/comedy/challenges')
        .set('Authorization', 'Bearer valid-token')
        .send({ challengeId: 'challenge-1', clipUrl: 'https://example.com/clip.mp4' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer())
        .post('/v1/comedy/challenges')
        .send({ challengeId: 'challenge-1', clipUrl: 'https://example.com/clip.mp4' })
        .expect(401);
    });
  });

  describe('/v1/comedy/trending (GET)', () => {
    it('should return trending clips', () => {
      mockComedyService.getTrending.mockResolvedValue({
        success: true,
        data: [{ id: 'clip-1', views: 10000 }],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/trending')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockComedyService.getClips.mockResolvedValue({
        success: true,
        data: [],
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/clips')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in list responses', () => {
      mockComedyService.getClips.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/v1/comedy/clips')
        .expect((res) => {
          if (res.body.data && typeof res.body.data === 'object') {
            expect(res.body.data).toHaveProperty('page');
            expect(res.body.data).toHaveProperty('limit');
          }
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer())
        .post('/v1/comedy/challenges')
        .send({ challengeId: 'challenge-1', clipUrl: 'url' })
        .expect(401);
    });
  });
});
