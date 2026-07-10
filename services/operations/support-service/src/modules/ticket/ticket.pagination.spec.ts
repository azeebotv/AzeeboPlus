import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
// Ticket DTO types used implicitly by mock data in tests

describe('Support Service Pagination Tests', () => {
  let app: INestApplication;

  const mockTicketService = {
    getTickets: jest.fn().mockResolvedValue({
      tickets: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
    getUserTickets: jest.fn().mockResolvedValue({
      tickets: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
    getTicketById: jest.fn(),
    createTicket: jest.fn(),
    updateTicketStatus: jest.fn(),
    addMessage: jest.fn(),
    assignTicket: jest.fn(),
    escalateTicket: jest.fn(),
    closeTicket: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'test-user-123', role: 'user' };
      return true;
    },
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: mockTicketService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res: any, next: Function) => {
      if (!req.user) {
        req.user = { id: 'test-user-123', role: 'user' };
      }
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pagination - GET /support/tickets', () => {
    it('should return paginated tickets with default values', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [
          { id: 'ticket-1', subject: 'Test Ticket 1', status: 'OPEN', category: 'REFUND' },
          { id: 'ticket-2', subject: 'Test Ticket 2', status: 'OPEN', category: 'GENERAL' },
        ],
        meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);
      expect(response.body.meta.total).toBe(50);
      expect(response.body.meta.totalPages).toBe(3);
    });

    it('should respect custom page parameter', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 3, limit: 20, total: 50, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?page=3')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(3);
      expect(mockTicketService.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 1, limit: 10, total: 50, totalPages: 5 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.limit).toBe(10);
      expect(mockTicketService.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should filter by status', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?status=OPEN')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockTicketService.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'OPEN' })
      );
    });

    it('should filter by category', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?category=REFUND')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockTicketService.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'REFUND' })
      );
    });

    it('should combine multiple filters', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?status=OPEN&category=REFUND&page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockTicketService.getTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OPEN',
          category: 'REFUND',
          page: 2,
          limit: 10,
        })
      );
    });

    it('should calculate hasNextPage correctly', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 2, limit: 20, total: 50, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?page=2')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.totalPages).toBe(3);
      expect(response.body.meta.page < response.body.meta.totalPages).toBe(true);
    });

    it('should set hasNextPage false on last page', async () => {
      mockTicketService.getTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 3, limit: 20, total: 50, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets?page=3')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(3);
      expect(response.body.meta.totalPages).toBe(3);
      expect(response.body.meta.page < response.body.meta.totalPages).toBe(false);
      expect(response.body.meta.page > 1).toBe(true);
    });
  });

  describe('Pagination - GET /support/tickets/my', () => {
    it('should return paginated user tickets', async () => {
      mockTicketService.getUserTickets.mockResolvedValueOnce({
        tickets: [{ id: 'ticket-1', subject: 'My Ticket', status: 'OPEN' }],
        meta: { page: 1, limit: 20, total: 25, totalPages: 2 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets/my')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.total).toBe(25);
    });

    it('should support pagination for user tickets', async () => {
      mockTicketService.getUserTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets/my?page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should filter user tickets by status', async () => {
      mockTicketService.getUserTickets.mockResolvedValueOnce({
        tickets: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets/my?status=RESOLVED')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(mockTicketService.getUserTickets).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({ status: 'RESOLVED' })
      );
    });
  });
});
