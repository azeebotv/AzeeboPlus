import { ApiClient } from '@azeebo/api-client';
import type { AgbalaStoryworld, AgbalaQuiz, AgbalaTheory, AgbalaRoom } from '../types';

const apiClient = new ApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3013',
  tokenStorage: {
    getAccessToken: async () => null,
    getRefreshToken: async () => null,
    setAccessToken: async () => {},
    setRefreshToken: async () => {},
    clearTokens: async () => {},
  },
});

export const agbalaApi = {
  async getStoryworlds(): Promise<AgbalaStoryworld[]> {
    const response = await apiClient.get<{ items: AgbalaStoryworld[] }>(
      '/v1/vertical/agbala/storyworlds'
    );
    return response.data!.items;
  },

  async getStoryworld(id: string): Promise<AgbalaStoryworld> {
    const response = await apiClient.get<AgbalaStoryworld>(`/v1/vertical/agbala/storyworlds/${id}`);
    return response.data!;
  },

  async getQuizzes(): Promise<AgbalaQuiz[]> {
    const response = await apiClient.get<{ items: AgbalaQuiz[] }>('/v1/vertical/agbala/quizzes');
    return response.data!.items;
  },

  async getQuiz(id: string): Promise<AgbalaQuiz> {
    const response = await apiClient.get<AgbalaQuiz>(`/v1/vertical/agbala/quizzes/${id}`);
    return response.data!;
  },

  async submitQuizAnswer(quizId: string, questionId: string, answerIndex: number) {
    const response = await apiClient.post(`/v1/vertical/agbala/quizzes/${quizId}/answer`, {
      questionId,
      answerIndex,
    });
    return response.data;
  },

  async getTheories(): Promise<AgbalaTheory[]> {
    const response = await apiClient.get<{ items: AgbalaTheory[] }>('/v1/vertical/agbala/theories');
    return response.data!.items;
  },

  async createTheory(data: { title: string; content: string }) {
    const response = await apiClient.post('/v1/vertical/agbala/theories', data);
    return response.data;
  },

  async getRooms(): Promise<AgbalaRoom[]> {
    const response = await apiClient.get<{ items: AgbalaRoom[] }>('/v1/vertical/agbala/rooms');
    return response.data!.items;
  },

  async joinRoom(roomId: string) {
    const response = await apiClient.post(`/v1/vertical/agbala/rooms/${roomId}/join`);
    return response.data;
  },
};
