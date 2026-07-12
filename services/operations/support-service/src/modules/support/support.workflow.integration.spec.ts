import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { SupportRepository } from './support.repository';
import { RefundService } from '../refund/refund.service';
import { AppealService } from '../appeal/appeal.service';
import { TakedownService } from '../takedown/takedown.service';
import { DisputeService } from '../dispute/dispute.service';
import { ChargebackService } from '../chargeback/chargeback.service';
import { SuspensionService } from '../suspension/suspension.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigModule, ConfigService } from '@nestjs/config';

jest.mock('@azeebo/http-client', () => ({
  ServiceClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Support Workflow (Integration)', () => {
  let supportService: SupportService;
  let refundService: RefundService;
  let appealService: AppealService;
  let takedownService: TakedownService;
  let disputeService: DisputeService;
  let chargebackService: ChargebackService;
  let suspensionService: SuspensionService;

  const mockPrisma = {
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    supportTicketReply: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    supportMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    paymentRefund: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    refund: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    appeal: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contentTakedown: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payoutDispute: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    chargeback: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userSuspension: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
    },
  };

  beforeEach(async () => {
    const mockConfigService = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          PAYMENT_SERVICE_URL: 'http://localhost:3003',
          WALLET_SERVICE_URL: 'http://localhost:3002',
          MODERATION_SERVICE_URL: 'http://localhost:3022',
          CONTENT_SERVICE_URL: 'http://localhost:3004',
          USER_SERVICE_URL: 'http://localhost:3001',
          DEFAULT_API_TIMEOUT: '30000',
        };
        return config[key] || defaultValue;
      }),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          PAYMENT_SERVICE_URL: 'http://localhost:3003',
          WALLET_SERVICE_URL: 'http://localhost:3002',
          MODERATION_SERVICE_URL: 'http://localhost:3022',
          CONTENT_SERVICE_URL: 'http://localhost:3004',
          USER_SERVICE_URL: 'http://localhost:3001',
          DEFAULT_API_TIMEOUT: '30000',
        };
        return config[key] || 'http://localhost:3000';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        SupportService,
        SupportRepository,
        RefundService,
        AppealService,
        TakedownService,
        DisputeService,
        ChargebackService,
        SuspensionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    supportService = module.get<SupportService>(SupportService);
    refundService = module.get<RefundService>(RefundService);
    appealService = module.get<AppealService>(AppealService);
    takedownService = module.get<TakedownService>(TakedownService);
    disputeService = module.get<DisputeService>(DisputeService);
    chargebackService = module.get<ChargebackService>(ChargebackService);
    suspensionService = module.get<SuspensionService>(SuspensionService);
  });

  describe('Full Support Workflow', () => {
    const userId = 'user-support-workflow-123';
    let createdTicketId: string;

    it('should create a support ticket', async () => {
      const ticketInput = {
        title: 'Refund Request for Movie Rental',
        description: 'I want a refund for the movie I rented yesterday.',
        priority: 'high' as const,
      };

      mockPrisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-workflow-123',
        userId,
        subject: ticketInput.title,
        description: ticketInput.description,
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ticket = await supportService.createTicket(userId, ticketInput);

      expect(ticket.id).toBe('ticket-workflow-123');
      expect(ticket.title).toBe(ticketInput.title);
      expect(ticket.status).toBe('open');
      createdTicketId = ticket.id;
    });

    it('should add a reply to the ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: createdTicketId,
        userId,
        subject: 'Refund Request',
        description: 'Test description',
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.supportMessage.create.mockResolvedValue({
        id: 'reply-123',
        ticketId: createdTicketId,
        senderId: userId,
        senderType: 'USER',
        message: 'We will process your refund request shortly.',
        createdAt: new Date(),
      });

      const reply = await supportService.addReply(
        userId,
        createdTicketId,
        'We will process your refund request shortly.'
      );

      expect(reply.id).toBeDefined();
      expect(reply.message).toBe('We will process your refund request shortly.');
    });

    it('should process a refund request linked to the ticket', async () => {
      const refundData = {
        userId,
        paymentId: 'pay-workflow-123',
        amount: new Decimal(5000),
        currency: 'NGN',
        reason: 'User request via support ticket',
        ticketId: createdTicketId,
      };

      mockPrisma.refund.findFirst.mockResolvedValue(null);
      mockPrisma.refund.create.mockResolvedValue({
        id: 'refund-workflow-123',
        ...refundData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const refund = await refundService.requestRefund(refundData);

      expect(refund.id).toBeDefined();
      expect(refund.ticketId).toBe(createdTicketId);
      expect(refund.status).toBe('PENDING');
    });

    it('should update ticket status after refund approval', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: createdTicketId,
        userId,
        subject: 'Refund Request',
        description: 'Test description',
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.supportTicket.update.mockResolvedValue({
        id: createdTicketId,
        userId,
        title: 'Refund Request',
        description: 'Test description',
        priority: 'high',
        status: 'RESOLVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedTicket = await supportService.updateTicket(userId, createdTicketId, {
        title: 'Refund Request - Processed',
      });

      expect(updatedTicket.status).toBe('resolved');
    });

    it('should close the ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: createdTicketId,
        userId,
        subject: 'Refund Request',
        description: 'Test description',
        priority: 'HIGH',
        status: 'RESOLVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.supportTicket.update.mockResolvedValue({
        id: createdTicketId,
        userId,
        title: 'Refund Request',
        description: 'Test description',
        priority: 'high',
        status: 'CLOSED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const closedTicket = await supportService.closeTicket(userId, createdTicketId);

      expect(closedTicket.status).toBe('closed');
    });

    it('should prevent access to other users tickets', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue({
        id: createdTicketId,
        userId: 'other-user-789',
        subject: 'Refund Request',
        description: 'Test description',
        priority: 'HIGH',
        status: 'CLOSED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(supportService.getTicketById(userId, createdTicketId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('Escalation Workflow', () => {
    const userId = 'user-escalation-123';

    it('should create a dispute after failed refund', async () => {
      const ticketInput = {
        title: 'Refund Dispute',
        description: 'My refund was denied, I want to dispute this.',
        priority: 'high' as const,
      };

      mockPrisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-escalation-123',
        userId,
        subject: ticketInput.title,
        description: ticketInput.description,
        priority: 'HIGH',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const ticket = await supportService.createTicket(userId, ticketInput);

      const disputeData = {
        ticketId: ticket.id,
        creatorId: userId,
        payoutId: 'payout-dispute-123',
        amount: new Decimal(5000),
        currency: 'NGN',
        reason: 'Refund was incorrectly denied',
        evidence: { description: 'Payment receipt attached' },
      };

      mockPrisma.payoutDispute.findFirst.mockResolvedValue(null);
      mockPrisma.payoutDispute.create.mockResolvedValue({
        id: 'dispute-123',
        ...disputeData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const dispute = await disputeService.createDispute(disputeData);

      expect(dispute.id).toBeDefined();
      expect(dispute.ticketId).toBe(ticket.id);
    });

    it('should escalate to chargeback if dispute fails', async () => {
      const chargebackData = {
        ticketId: 'ticket-chargeback-123',
        userId,
        paymentId: 'pay-chargeback-123',
        amount: new Decimal(5000),
        currency: 'NGN',
        reason: 'Dispute resolution failed',
      };

      mockPrisma.chargeback.create.mockResolvedValue({
        id: 'chargeback-123',
        ...chargebackData,
        status: 'INITIATED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const chargeback = await chargebackService.initiateChargeback(chargebackData);

      expect(chargeback.id).toBeDefined();
      expect(chargeback.status).toBe('INITIATED');
    });
  });

  describe('Content Moderation Workflow', () => {
    const userId = 'user-moderation-123';
    const contentId = 'content-123';

    it('should create a takedown request and appeal workflow', async () => {
      const takedownData = {
        ticketId: 'ticket-123',
        contentId,
        reportedBy: userId,
        reason: 'Inappropriate content',
        evidence: { category: 'violence' },
      };

      mockPrisma.contentTakedown.create.mockResolvedValue({
        id: 'takedown-123',
        ...takedownData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const takedown = await takedownService.createTakedown(takedownData);

      expect(takedown.id).toBeDefined();

      const appealData = {
        ticketId: 'ticket-123',
        userId,
        appealType: 'content',
        resourceId: contentId,
        resourceType: 'CONTENT',
        originalDecision: 'REMOVED',
        reason: 'Content was misclassified',
        evidence: { description: 'Context explanation' },
      };

      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockResolvedValue({
        id: 'appeal-123',
        ...appealData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const appeal = await appealService.submitAppeal(appealData);

      expect(appeal.id).toBeDefined();
    });
  });

  describe('Account Suspension Workflow', () => {
    const userId = 'user-suspension-123';
    const adminId = 'admin-123';

    it('should suspend a user and allow appeal', async () => {
      const suspensionData = {
        ticketId: 'ticket-suspension-123',
        userId,
        suspendedBy: adminId,
        reason: 'Violation of terms of service',
        durationDays: 7,
      };

      mockPrisma.userSuspension.findFirst.mockResolvedValue(null);
      mockPrisma.userSuspension.create.mockResolvedValue({
        id: 'suspension-123',
        ...suspensionData,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const suspension = await suspensionService.suspendUser(suspensionData);

      expect(suspension.id).toBeDefined();
      expect(suspension.status).toBe('ACTIVE');

      const appealData = {
        ticketId: 'ticket-suspension-123',
        userId,
        appealType: 'suspension',
        resourceId: 'suspension-123',
        resourceType: 'SUSPENSION',
        originalDecision: 'SUSPENDED',
        reason: 'I believe this suspension is unjust',
        evidence: { description: 'Supporting evidence' },
      };

      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockResolvedValue({
        id: 'appeal-suspension-123',
        ...appealData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const appeal = await appealService.submitAppeal(appealData);

      expect(appeal.id).toBeDefined();
    });

    it('should reinstate a user after successful appeal', async () => {
      mockPrisma.userSuspension.findUnique.mockResolvedValue({
        id: 'suspension-123',
        userId,
        suspendedBy: adminId,
        reason: 'Violation of terms of service',
        durationDays: 7,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.userSuspension.update.mockResolvedValue({
        id: 'suspension-123',
        userId,
        suspendedBy: adminId,
        reason: 'Violation of terms of service',
        durationDays: 7,
        status: 'REINSTATED',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await suspensionService.reinstateUser('suspension-123', adminId);

      expect(result.status).toBe('REINSTATED');
    });
  });

  describe('Edge Cases', () => {
    const userId = 'user-edge-case-123';

    it('should handle non-existent ticket', async () => {
      mockPrisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(supportService.getTicketById(userId, 'non-existent-ticket')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should prevent duplicate refund requests', async () => {
      const refundData = {
        userId: 'user-duplicate-123',
        paymentId: 'pay-duplicate-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket-duplicate-123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue({ id: 'existing-refund-123' });

      await expect(refundService.requestRefund(refundData)).rejects.toThrow();
    });
  });
});
