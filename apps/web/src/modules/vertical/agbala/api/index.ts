'use client';

import type { AgbalaStoryworld, AgbalaQuiz } from '../types';
import { api } from '../../../../lib/api';

export async function fetchAgbalaStoryworlds(): Promise<AgbalaStoryworld[]> {
  const response = await api.request<{ items: AgbalaStoryworld[] }>('/vertical/agbala/storyworlds');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch Agbala storyworlds');
  }
  return response.data.items || [];
}

export async function fetchAgbalaStoryworld(id: string): Promise<AgbalaStoryworld> {
  const response = await api.request<AgbalaStoryworld>(`/vertical/agbala/storyworlds/${id}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || `Failed to fetch Agbala storyworld ${id}`);
  }
  return response.data;
}

export async function fetchAgbalaQuizzes(): Promise<AgbalaQuiz[]> {
  const response = await api.request<{ items: AgbalaQuiz[] }>('/vertical/agbala/quizzes');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to fetch Agbala quizzes');
  }
  return response.data.items || [];
}
