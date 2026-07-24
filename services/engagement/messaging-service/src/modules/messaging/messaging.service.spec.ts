import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from './messaging.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';

jest.mock('axios');

describe('MessagingService', () => {
  let service: MessagingService;
  let prisma: {
    conversation: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    message: { findMany: jest.Mock; create: jest.Mock; updateMany: jest.Mock };
    conversationParticipant: { findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      message: { findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
      conversationParticipant: { findMany: jest.fn(), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, defaultValue: unknown) => defaultValue) },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  describe('getConversations', () => {
    it('should return conversations for a user', async () => {
      prisma.conversation.findMany.mockResolvedValue([]);
      const result = await service.getConversations('user-1');
      expect(result).toBeDefined();
      expect(prisma.conversation.findMany).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation', async () => {
      const mockConversation = { id: 'conv-1', participants: [{ userId: 'user-1' }] };
      prisma.conversation.findFirst.mockResolvedValue(mockConversation);
      prisma.message.findMany.mockResolvedValue([]);
      const result = await service.getMessages('user-1', 'conv-1', 20, 0);
      expect(result).toBeDefined();
      expect(prisma.message.findMany).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should create a new message', async () => {
      const mockConversation = { id: 'conv-1', participants: [{ userId: 'user-1' }] };
      prisma.conversation.findFirst.mockResolvedValue(mockConversation);
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
      };
      prisma.message.create.mockResolvedValue(mockMessage);
      prisma.conversation.update.mockResolvedValue({});
      const result = await service.sendMessage('user-1', 'conv-1', { content: 'Hello' });
      expect(result).toBeDefined();
      expect(prisma.message.create).toHaveBeenCalled();
    });
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const mockConversation = { id: 'conv-1', createdAt: new Date(), updatedAt: new Date() };
      prisma.conversation.create.mockResolvedValue(mockConversation);
      prisma.conversationParticipant.create.mockResolvedValue({});
      const result = await service.createConversation('user-1', { participantIds: ['user-2'] });
      expect(result).toBeDefined();
      expect(prisma.conversation.create).toHaveBeenCalled();
    });
  });
});
