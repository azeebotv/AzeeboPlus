import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { SupportModule } from '../support/support.module';
import { SupportRepository } from '../support/support.repository';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '../../common/guards/auth.guard';

describe('Support Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPrisma = {
    supportTicket: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    supportMessage: {
      create: jest.fn(),
    },
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { sub: 'user-123' };
      return true;
    },
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), SupportModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(SupportRepository)
      .useValue({
        createTicket: jest.fn(),
        getTickets: jest.fn(),
        getTicketById: jest.fn(),
        updateTicket: jest.fn(),
        addReply: jest.fn(),
        closeTicket: jest.fn(),
      })
      .overrideGuard(AuthGuard)
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

  describe('POST /support/tickets', () => {
    it('should create support ticket', async () => {
      const supportRepository = app.get(SupportRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(supportRepository, 'createTicket').mockResolvedValue({
        id: 'ticket-123',
        userId: 'user-123',
        title: 'Help needed',
        description: 'I need assistance',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/support/tickets')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Help needed',
          description: 'I need assistance',
          priority: 'medium',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'ticket-123',
          status: 'open',
        }),
      });
    });
  });

  describe('GET /support/tickets', () => {
    it('should get user tickets', async () => {
      const supportRepository = app.get(SupportRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(supportRepository, 'getTickets').mockResolvedValue({
        data: [
          {
            id: 'ticket-123',
            userId: 'user-123',
            title: 'Help needed',
            description: 'I need assistance',
            status: 'open',
            priority: 'medium',
            createdAt: new Date(),
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/support/tickets')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
      });
    });
  });

  describe('POST /support/tickets/:id/reply', () => {
    it('should add reply to ticket', async () => {
      const supportRepository = app.get(SupportRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(supportRepository, 'getTicketById').mockResolvedValue({
        id: 'ticket-123',
        userId: 'user-123',
        title: 'Help needed',
        description: 'I need assistance',
        status: 'open',
        priority: 'medium',
        createdAt: new Date(),
      });
      jest.spyOn(supportRepository, 'addReply').mockResolvedValue({
        id: 'reply-1',
        ticketId: 'ticket-123',
        userId: 'user-123',
        message: 'Thanks for the help',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/support/tickets/ticket-123/reply')
        .set('Authorization', 'Bearer valid-token')
        .send({ message: 'Thanks for the help' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          message: 'Thanks for the help',
        }),
      });
    });
  });
});
