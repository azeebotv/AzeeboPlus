import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { RateLimitService } from '@azeebo/security';

describe('MessagingController', () => {
  let controller: MessagingController;
  let service: MessagingService;

  const mockMessagingService = {
    getConversations: jest.fn(),
    getMessages: jest.fn(),
    createConversation: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
    deleteConversation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagingController],
      providers: [
        {
          provide: MessagingService,
          useValue: mockMessagingService,
        },
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn().mockResolvedValue({
              allowed: true,
              remaining: 10,
              resetAt: Date.now() + 60000,
              limit: 10,
            }),
            resetRateLimit: jest.fn(),
            getRateLimitStatus: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<MessagingController>(MessagingController);
    service = module.get<MessagingService>(MessagingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConversations', () => {
    it('should call messagingService.getConversations with userId', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = { success: true, data: [] };
      mockMessagingService.getConversations.mockResolvedValue(mockResult);

      const result = await controller.getConversations(mockReq);

      expect(service.getConversations).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMessages', () => {
    it('should call messagingService.getMessages with default limit and offset', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = { success: true, data: [] };
      mockMessagingService.getMessages.mockResolvedValue(mockResult);

      const result = await controller.getMessages(mockReq, 'conv-1');

      expect(service.getMessages).toHaveBeenCalledWith('user-1', 'conv-1', 50, 0);
      expect(result).toEqual(mockResult);
    });

    it('should call messagingService.getMessages with custom limit and offset', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = { success: true, data: [] };
      mockMessagingService.getMessages.mockResolvedValue(mockResult);

      const result = await controller.getMessages(mockReq, 'conv-1', 25, 10);

      expect(service.getMessages).toHaveBeenCalledWith('user-1', 'conv-1', 25, 10);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createConversation', () => {
    it('should call messagingService.createConversation with userId and dto', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const dto = { participantIds: ['user-2'], type: 'direct' as const, name: undefined };
      const mockResult = {
        success: true,
        data: { id: 'conv-1', type: 'direct', name: null, createdAt: new Date().toISOString() },
      };
      mockMessagingService.createConversation.mockResolvedValue(mockResult);

      const result = await controller.createConversation(mockReq, dto);

      expect(service.createConversation).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('sendMessage', () => {
    it('should call messagingService.sendMessage with correct params', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const dto = { content: 'Hello world', type: 'text' as const };
      const mockResult = {
        success: true,
        data: {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello world',
          type: 'text',
          createdAt: new Date().toISOString(),
        },
      };
      mockMessagingService.sendMessage.mockResolvedValue(mockResult);

      const result = await controller.sendMessage(mockReq, 'conv-1', dto);

      expect(service.sendMessage).toHaveBeenCalledWith('user-1', 'conv-1', dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('markAsRead', () => {
    it('should call messagingService.markAsRead with correct params', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const dto = { messageId: 'msg-1' };
      const mockResult = { success: true, message: 'Message marked as read' };
      mockMessagingService.markAsRead.mockResolvedValue(mockResult);

      const result = await controller.markAsRead(mockReq, 'conv-1', dto);

      expect(service.markAsRead).toHaveBeenCalledWith('user-1', 'conv-1', 'msg-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteConversation', () => {
    it('should call messagingService.deleteConversation with correct params', async () => {
      const mockReq = { user: { id: 'user-1' } } as any;
      const mockResult = { success: true, message: 'Conversation deleted' };
      mockMessagingService.deleteConversation.mockResolvedValue(mockResult);

      const result = await controller.deleteConversation(mockReq, 'conv-1');

      expect(service.deleteConversation).toHaveBeenCalledWith('user-1', 'conv-1');
      expect(result).toEqual(mockResult);
    });
  });
});
