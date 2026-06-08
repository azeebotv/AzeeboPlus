import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export const messagingApi = {
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await apiClient.get<Conversation[]>('/v1/messaging/conversations');
    return { success: true, data: response };
  },

  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    const response = await apiClient.get<Message[]>(`/v1/messaging/conversations/${conversationId}/messages`);
    return { success: true, data: response };
  },

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    const response = await apiClient.post<Message>(`/v1/messaging/conversations/${conversationId}/messages`, { content });
    return { success: true, data: response };
  },

  async markAsRead(messageId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.put<{ message: string }>(`/v1/messaging/messages/${messageId}/read`);
    return { success: true, data: response };
  },

  async startConversation(userId: string): Promise<ApiResponse<Conversation>> {
    const response = await apiClient.post<Conversation>('/v1/messaging/conversations', { userId });
    return { success: true, data: response };
  },
};

export interface LiveChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  message: string;
  timestamp: string;
  isModerator: boolean;
  isVIP: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
}

export const chatApi = {
  async getLiveChatMessages(showId: string): Promise<ApiResponse<LiveChatMessage[]>> {
    const response = await apiClient.get<LiveChatMessage[]>(`/v1/reality/shows/${showId}/chat`);
    return { success: true, data: response };
  },

  async sendLiveChatMessage(showId: string, content: string): Promise<ApiResponse<LiveChatMessage>> {
    const response = await apiClient.post<LiveChatMessage>(`/v1/reality/shows/${showId}/chat`, { content });
    return { success: true, data: response };
  },

  async getLiveChatReactions(showId: string, messageId: string): Promise<ApiResponse<Array<{ emoji: string; count: number }>>> {
    const response = await apiClient.get<Array<{ emoji: string; count: number }>>(`/v1/reality/shows/${showId}/chat/${messageId}/reactions`);
    return { success: true, data: response };
  },
};
