import { apiFetch } from '@/lib/api';

export interface Recommendation {
  id: string;
  title: string;
  type: string;
  thumbnail: string;
  description: string;
  score: number;
  reason: string;
}

export interface UserPreferences {
  favoriteGenres: string[];
  watchHistory: string[];
  ratings: Record<string, number>;
  recentlyWatched: string[];
}

// Get personalized recommendations
export async function getPersonalizedRecommendations(
  limit: number = 10
): Promise<Recommendation[]> {
  try {
    const res = await apiFetch<Recommendation[]>(`/recommendations/personalized?limit=${limit}`);
    return res.success ? res.data || [] : [];
  } catch {
    return [];
  }
}

// Get content-based recommendations (similar to a specific item)
export async function getContentBasedRecommendations(
  contentId: string,
  limit: number = 6
): Promise<Recommendation[]> {
  try {
    const res = await apiFetch<Recommendation[]>(
      `/recommendations/similar/${contentId}?limit=${limit}`
    );
    return res.success ? res.data || [] : [];
  } catch {
    return [];
  }
}

// Get trending recommendations
export async function getTrendingRecommendations(limit: number = 10): Promise<Recommendation[]> {
  try {
    const res = await apiFetch<Recommendation[]>(`/recommendations/trending?limit=${limit}`);
    return res.success ? res.data || [] : [];
  } catch {
    return [];
  }
}

// Get recommendations by genre
export async function getGenreRecommendations(
  genre: string,
  limit: number = 10
): Promise<Recommendation[]> {
  try {
    const res = await apiFetch<Recommendation[]>(`/recommendations/genre/${genre}?limit=${limit}`);
    return res.success ? res.data || [] : [];
  } catch {
    return [];
  }
}

// Track user interaction for recommendation improvements
export async function trackRecommendationInteraction(
  contentId: string,
  action: 'view' | 'like' | 'share' | 'complete'
): Promise<void> {
  try {
    await apiFetch('/recommendations/track', {
      method: 'POST',
      body: JSON.stringify({ contentId, action }),
    });
  } catch {
    // Silent fail for tracking
  }
}

// Get user preferences for recommendation tuning
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const res = await apiFetch<UserPreferences>('/recommendations/preferences');
    return res.success ? (res.data ?? null) : null;
  } catch {
    return null;
  }
}

// Update user preferences
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  try {
    const res = await apiFetch('/recommendations/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return res.success;
  } catch {
    return false;
  }
}
