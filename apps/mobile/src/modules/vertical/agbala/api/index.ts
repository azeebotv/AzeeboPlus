import { apiClient, gatewayPath } from '../../../../api/client';
import type { AgbalaStoryworld, AgbalaQuiz, AgbalaTheory, AgbalaRoom } from '../types';

export const agbalaApi = {
  async getStoryworlds(): Promise<AgbalaStoryworld[]> {
    const response = await apiClient.get<{ items: AgbalaStoryworld[] }>(
      gatewayPath('/v1/vertical/agbala/storyworlds')
    );
    return response.items;
  },

  async getStoryworld(id: string): Promise<AgbalaStoryworld> {
    const response = await apiClient.get<AgbalaStoryworld>(
      gatewayPath(`/v1/vertical/agbala/storyworlds/${id}`)
    );
    return response;
  },

  async getQuizzes(): Promise<AgbalaQuiz[]> {
    const response = await apiClient.get<{ items: AgbalaQuiz[] }>(
      gatewayPath('/v1/vertical/agbala/quizzes')
    );
    return response.items;
  },

  async getQuiz(id: string): Promise<AgbalaQuiz> {
    const response = await apiClient.get<AgbalaQuiz>(
      gatewayPath(`/v1/vertical/agbala/quizzes/${id}`)
    );
    return response;
  },

  async submitQuizAnswer(quizId: string, questionId: string, answerIndex: number) {
    const response = await apiClient.post(
      gatewayPath(`/v1/vertical/agbala/quizzes/${quizId}/answer`),
      { questionId, answerIndex }
    );
    return response;
  },

  async getTheories(): Promise<AgbalaTheory[]> {
    const response = await apiClient.get<{ items: AgbalaTheory[] }>(
      gatewayPath('/v1/vertical/agbala/theories')
    );
    return response.items;
  },

  async createTheory(data: { title: string; content: string }) {
    const response = await apiClient.post(gatewayPath('/v1/vertical/agbala/theories'), data);
    return response;
  },

  async getRooms(): Promise<AgbalaRoom[]> {
    const response = await apiClient.get<{ items: AgbalaRoom[] }>(
      gatewayPath('/v1/vertical/agbala/rooms')
    );
    return response.items;
  },

  async joinRoom(roomId: string) {
    const response = await apiClient.post(
      gatewayPath(`/v1/vertical/agbala/rooms/${roomId}/join`)
    );
    return response;
  },
};
