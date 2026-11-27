import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessagingService } from './messaging.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('MessagingService Integration', () => {
  let service: MessagingService;

  const mockPrismaService = {
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              if (key === 'ANALYTICS_SERVICE_URL') return 'http://analytics-service:3008';
              if (key === 'USER_SERVICE_URL') return 'http://user-service:3001';
              return defaultValue;
            }),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConversations', () => {
    it('should return conversations with unread counts', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          type: 'direct',
          name: null,
          avatar: null,
          createdAt: new Date('2026-07-01'),
          updatedAt: new Date('2026-07-20'),
          participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
          messages: [{ content: 'Hello there!', createdAt: new Date('2026-07-20') }],
        },
        {
          id: 'conv-2',
          type: 'group',
          name: 'Project Chat',
          avatar: 'https://example.com/avatar.png',
          createdAt: new Date('2026-07-05'),
          updatedAt: new Date('2026-07-19'),
          participants: [{ userId: 'user-1' }, { userId: 'user-3' }, { userId: 'user-4' }],
          messages: [{ content: 'Let us meet tomorrow', createdAt: new Date('2026-07-19') }],
        },
      ];

      mockPrismaService.conversation.findMany.mockResolvedValue(mockConversations);
      mockPrismaService.message.groupBy.mockResolvedValue([
        { conversationId: 'conv-1', _count: { id: 3 } },
      ]);

      const result = await service.getConversations('user-1');

      expect(result.success).toBe(true);
      const data = (
        result as {
          success: boolean;
          data: Array<{ lastMessage: string; unreadCount: number; name: string }>;
        }
      ).data;
      expect(data).toHaveLength(2);
      expect(data[0].lastMessage).toBe('Hello there!');
      expect(data[0].unreadCount).toBe(3);
      expect(data[1].unreadCount).toBe(0);
      expect(data[1].name).toBe('Project Chat');
    });

    it('should return empty array for user with no conversations', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.message.groupBy.mockResolvedValue([]);

      const result = await service.getConversations('user-new');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('createConversation', () => {
    it('should create a direct conversation', async () => {
      const mockConversation = {
        id: 'conv-new',
        type: 'direct',
        name: null,
        createdAt: new Date(),
        participants: [
          { userId: 'user-1', role: 'admin' },
          { userId: 'user-2', role: 'member' },
        ],
      };

      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createConversation('user-1', {
        type: 'direct',
        participantIds: ['user-2'],
      });

      expect(result.success).toBe(true);
      const data = (result as { success: boolean; data: { id: string; type: string } }).data;
      expect(data.id).toBe('conv-new');
      expect(data.type).toBe('direct');
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'direct',
          participants: {
            create: expect.arrayContaining([
              { userId: 'user-1', role: 'admin' },
              { userId: 'user-2', role: 'member' },
            ]),
          },
        }),
        include: { participants: true },
      });
    });

    it('should create a group conversation with name', async () => {
      const mockConversation = {
        id: 'conv-group',
        type: 'group',
        name: 'Team Standup',
        createdAt: new Date(),
        participants: [
          { userId: 'user-1', role: 'admin' },
          { userId: 'user-3', role: 'member' },
          { userId: 'user-4', role: 'member' },
        ],
      };

      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createConversation('user-1', {
        type: 'group',
        name: 'Team Standup',
        participantIds: ['user-3', 'user-4'],
      });

      expect(result.success).toBe(true);
      const data = (result as { success: boolean; data: { name: string; type: string } }).data;
      expect(data.name).toBe('Team Standup');
      expect(data.type).toBe('group');
    });

    it('should default to direct type when not specified', async () => {
      mockPrismaService.conversation.create.mockResolvedValue({
        id: 'conv-default',
        type: 'direct',
        name: null,
        createdAt: new Date(),
        participants: [{ userId: 'user-1', role: 'admin' }],
      });

      const result = await service.createConversation('user-1', {
        participantIds: ['user-2'],
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'direct' }),
        })
      );
    });

    it('should filter out creator from participantIds to avoid duplicate', async () => {
      mockPrismaService.conversation.create.mockResolvedValue({
        id: 'conv-self',
        type: 'direct',
        name: null,
        createdAt: new Date(),
        participants: [{ userId: 'user-1', role: 'admin' }],
      });

      await service.createConversation('user-1', {
        participantIds: ['user-1', 'user-2'],
      });

      const createCall = mockPrismaService.conversation.create.mock.calls[0][0];
      const participants = createCall.data.participants.create;
      const userIds = participants.map((p: { userId: string }) => p.userId);
      const uniqueUserIds = [...new Set(userIds)];
      expect(uniqueUserIds).toHaveLength(userIds.length);
    });
  });

  describe('sendMessage', () => {
    it('should send a text message in a conversation', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello!',
        type: 'text',
        createdAt: new Date(),
      });
      mockPrismaService.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage('user-1', 'conv-1', { content: 'Hello!' });

      expect(result.success).toBe(true);
      const data = (
        result as {
          success: boolean;
          data: { id: string; content: string; type: string; senderId: string };
        }
      ).data;
      expect(data.id).toBe('msg-1');
      expect(data.content).toBe('Hello!');
      expect(data.type).toBe('text');
      expect(data.senderId).toBe('user-1');
    });

    it('should send a media message', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'https://example.com/image.jpg',
        type: 'media',
        createdAt: new Date(),
      });
      mockPrismaService.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage('user-1', 'conv-1', {
        content: 'https://example.com/image.jpg',
        type: 'image',
      });

      expect(result.success).toBe(true);
      expect((result as { success: boolean; data: { type: string } }).data.type).toBe('media');
    });

    it('should default to text type when not specified', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-3',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Plain text',
        type: 'text',
        createdAt: new Date(),
      });
      mockPrismaService.conversation.update.mockResolvedValue({});

      await service.sendMessage('user-1', 'conv-1', { content: 'Plain text' });

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'text' }),
      });
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'nonexistent', { content: 'Hello' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should update conversation updatedAt on send', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.create.mockResolvedValue({
        id: 'msg-4',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Update me',
        type: 'text',
        createdAt: new Date(),
      });
      mockPrismaService.conversation.update.mockResolvedValue({});

      await service.sendMessage('user-1', 'conv-1', { content: 'Update me' });

      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a message as read', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-2',
      });
      mockPrismaService.message.findFirst.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
      });
      mockPrismaService.message.update.mockResolvedValue({});
      mockPrismaService.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.markAsRead('user-2', 'conv-1', 'msg-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Message marked as read');
      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when participant not found', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('user-unknown', 'conv-1', 'msg-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when message not found', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-2',
      });
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('user-2', 'conv-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should update participant lastReadAt', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-2',
      });
      mockPrismaService.message.findFirst.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
      });
      mockPrismaService.message.update.mockResolvedValue({});
      mockPrismaService.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('user-2', 'conv-1', 'msg-1');

      expect(mockPrismaService.conversationParticipant.updateMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-1', userId: 'user-2' },
        data: { lastReadAt: expect.any(Date) },
      });
    });
  });

  describe('getMessages', () => {
    it('should return messages in a conversation', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.findMany.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello!',
          type: 'text',
          isRead: true,
          createdAt: new Date('2026-07-20T10:00:00Z'),
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'user-2',
          content: 'Hi there!',
          type: 'text',
          isRead: false,
          createdAt: new Date('2026-07-20T10:05:00Z'),
        },
      ]);

      const result = await service.getMessages('user-1', 'conv-1');

      expect(result.success).toBe(true);
      const data = (
        result as { success: boolean; data: Array<{ content: string; isRead: boolean }> }
      ).data;
      expect(data).toHaveLength(2);
      expect(data[0].content).toBe('Hello!');
      expect(data[0].isRead).toBe(true);
    });

    it('should enforce max limit of 100', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.message.findMany.mockResolvedValue([]);

      await service.getMessages('user-1', 'conv-1', 500);

      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(service.getMessages('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation for the user', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        type: 'direct',
      });
      mockPrismaService.conversationParticipant.delete.mockResolvedValue({});

      const result = await service.deleteConversation('user-1', 'conv-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Conversation deleted');
      expect(mockPrismaService.conversationParticipant.delete).toHaveBeenCalledWith({
        where: {
          conversationId_userId: { conversationId: 'conv-1', userId: 'user-1' },
        },
      });
    });

    it('should throw NotFoundException when conversation not found', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(service.deleteConversation('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
