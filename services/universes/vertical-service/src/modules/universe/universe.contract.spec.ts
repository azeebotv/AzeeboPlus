import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UniverseModule } from './universe.module';

describe('Universe Controller Contract Tests', () => {
  let app: INestApplication;

  const mockUniverseService = {
    getUniverses: jest.fn(),
    getUniverseMap: jest.fn(),
    getLocations: jest.fn(),
    getLocationBySlug: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    getCategories: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UniverseModule],
    })
      .overrideProvider(UniverseModule)
      .useValue(mockUniverseService)
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

  describe('/v1/vertical/universes (GET)', () => {
    it('should return list of universes', () => {
      mockUniverseService.getUniverses.mockResolvedValue({
        success: true,
        data: { items: [{ id: 'universe-1', name: 'Heroes' }], page: 1, limit: 20, total: 1 },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should support pagination parameters', () => {
      mockUniverseService.getUniverses.mockResolvedValue({
        success: true,
        data: { items: [], page: 2, limit: 10, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes?page=2&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/vertical/universes/map/:slug (GET)', () => {
    it('should return universe map', () => {
      mockUniverseService.getUniverseMap.mockResolvedValue({
        success: true,
        data: { id: 'map-1', slug: 'heroes', locations: [] },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/map/heroes')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/vertical/universes/locations (GET)', () => {
    it('should return locations', () => {
      mockUniverseService.getLocations.mockResolvedValue({
        success: true,
        data: [{ id: 'location-1', name: 'City' }],
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/locations')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should filter by universe', () => {
      mockUniverseService.getLocations.mockResolvedValue({
        success: true,
        data: [{ id: 'location-1', universe: 'heroes' }],
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/locations?universe=heroes')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/vertical/universes/locations/:slug (GET)', () => {
    it('should return location by slug', () => {
      mockUniverseService.getLocationBySlug.mockResolvedValue({
        success: true,
        data: { id: 'location-1', slug: 'metropolis', name: 'Metropolis' },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/locations/metropolis')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/vertical/universes/locations (POST)', () => {
    it('should create a location', () => {
      mockUniverseService.createLocation.mockResolvedValue({
        success: true,
        data: { id: 'location-new', name: 'New City' },
      });

      return request(app.getHttpServer())
        .post('/v1/vertical/universes/locations')
        .send({ name: 'New City', universeId: 'universe-1', description: 'A new city' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/vertical/universes/categories (GET)', () => {
    it('should return categories', () => {
      mockUniverseService.getCategories.mockResolvedValue({
        success: true,
        data: [{ id: 'category-1', name: 'Action' }],
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockUniverseService.getUniverses.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in list responses', () => {
      mockUniverseService.getUniverses.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/v1/vertical/universes')
        .expect((res) => {
          expect(res.body.data).toHaveProperty('page');
          expect(res.body.data).toHaveProperty('limit');
          expect(res.body.data).toHaveProperty('total');
        });
    });
  });

  describe('error responses', () => {
    it('should return 404 for non-existent location', () => {
      mockUniverseService.getLocationBySlug.mockRejectedValue(new Error('Location not found'));

      return request(app.getHttpServer())
        .get('/v1/vertical/universes/locations/nonexistent')
        .expect(500);
    });
  });
});
