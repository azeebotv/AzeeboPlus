'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3013';

export async function fetchAgbalaStoryworlds(): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/storyworlds`);
  const data = await response.json();
  return data.data?.items || [];
}

export async function fetchAgbalaStoryworld(id: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/storyworlds/${id}`);
  const data = await response.json();
  return data.data;
}

export async function fetchAgbalaQuizzes(): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${API_BASE}/v1/vertical/agbala/quizzes`);
  const data = await response.json();
  return data.data?.items || [];
}
