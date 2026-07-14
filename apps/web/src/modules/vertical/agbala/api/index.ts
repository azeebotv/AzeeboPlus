'use client';

import type { AgbalaStoryworld, AgbalaQuiz } from '../types';
import { api } from '../../../../lib/api';

export async function fetchAgbalaStoryworlds(): Promise<AgbalaStoryworld[]> {
  const response = await api.request<{ items: AgbalaStoryworld[] }>(
    '/vertical/agbala/storyworlds',
  );
  return response.items || [];
}

export async function fetchAgbalaStoryworld(id: string): Promise<AgbalaStoryworld> {
  const response = await api.request<AgbalaStoryworld>(
    `/vertical/agbala/storyworlds/${id}`,
  );
  return response;
}

export async function fetchAgbalaQuizzes(): Promise<AgbalaQuiz[]> {
  const response = await api.request<{ items: AgbalaQuiz[] }>(
    '/vertical/agbala/quizzes',
  );
  return response.items || [];
}
