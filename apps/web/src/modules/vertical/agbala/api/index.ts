'use client';

import type { AgbalaStoryworld, AgbalaQuiz } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3013';

export async function fetchAgbalaStoryworlds(): Promise<AgbalaStoryworld[]> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/storyworlds`);
  const data = await response.json();
  return data.data?.items || [];
}

export async function fetchAgbalaStoryworld(id: string): Promise<AgbalaStoryworld> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/storyworlds/${id}`);
  const data = await response.json();
  return data.data;
}

export async function fetchAgbalaQuizzes(): Promise<AgbalaQuiz[]> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/quizzes`);
  const data = await response.json();
  return data.data?.items || [];
}
