import { apiClient } from './client';
import { ApiResponse } from '../types/api';

// ── Event Types ────────────────────────────────────────────────
export interface LifestyleEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: string;
  attendeeCount: number;
  isRsvpd: boolean;
  mapUrl?: string;
  price?: string;
  featured?: boolean;
}

export interface EventAttendee {
  id: string;
  name: string;
  avatar: string;
}

// ── Music Types ────────────────────────────────────────────────
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  coverArt: string;
  duration: string;
  playCount: number;
  isPlaying?: boolean;
  audioUrl?: string;
  trending?: boolean;
}

export interface MusicGenre {
  id: string;
  name: string;
  icon: string;
}

// ── Celebrity Types ────────────────────────────────────────────
export interface Celebrity {
  id: string;
  name: string;
  photo: string;
  profession: string;
  bio?: string;
  followerCount: number;
  featured?: boolean;
  newsCount?: number;
  relatedContentCount?: number;
  socialLinks?: SocialLinks;
}

export interface CelebrityNews {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
}

// ── Nightlife Types ────────────────────────────────────────────
export interface NightlifeVenue {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  category: string;
  featured?: boolean;
  description?: string;
  openHours?: string;
  priceRange?: string;
  tags?: string[];
}

// ── Influencer Types ───────────────────────────────────────────
export interface Influencer {
  id: string;
  name: string;
  photo: string;
  bio: string;
  profession: string;
  followerCount: number;
  collaborationCount: number;
  featured?: boolean;
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
}

// ── Social Types ───────────────────────────────────────────────
export interface SavedItem {
  id: string;
  type: 'event' | 'music' | 'celebrity' | 'venue' | 'influencer';
  title: string;
  subtitle: string;
  image: string;
  savedAt: string;
}

type ListResponse<T> = T[] | ApiResponse<T[]>;

// ── API Functions ──────────────────────────────────────────────
export const lifestyleApi = {
  // Events
  getEvents: (category?: string) =>
    apiClient.get<ListResponse<LifestyleEvent>>(
      `/v1/lifestyle/events${category && category !== 'All' ? `?category=${category}` : ''}`
    ),

  getFeaturedEvents: () =>
    apiClient.get<ListResponse<LifestyleEvent>>('/v1/lifestyle/events/featured'),

  getEventById: (id: string) =>
    apiClient.get<ApiResponse<LifestyleEvent>>(`/v1/lifestyle/events/${id}`),

  rsvpEvent: (id: string) =>
    apiClient.post<ApiResponse<{ isRsvpd: boolean; attendeeCount: number }>>(
      `/v1/lifestyle/events/${id}/rsvp`
    ),

  unRsvpEvent: (id: string) =>
    apiClient.delete<ApiResponse<{ isRsvpd: boolean; attendeeCount: number }>>(
      `/v1/lifestyle/events/${id}/rsvp`
    ),

  // Music
  getTracks: (genre?: string) =>
    apiClient.get<ListResponse<MusicTrack>>(
      `/v1/lifestyle/music${genre && genre !== 'All' ? `?genre=${genre}` : ''}`
    ),

  getTrendingTracks: () =>
    apiClient.get<ListResponse<MusicTrack>>('/v1/lifestyle/music/trending'),

  getGenres: () =>
    apiClient.get<ListResponse<MusicGenre>>('/v1/lifestyle/music/genres'),

  // Celebrities
  getCelebrities: () =>
    apiClient.get<ListResponse<Celebrity>>('/v1/lifestyle/celebrities'),

  getFeaturedCelebrities: () =>
    apiClient.get<ListResponse<Celebrity>>('/v1/lifestyle/celebrities/featured'),

  getCelebrityById: (id: string) =>
    apiClient.get<ApiResponse<Celebrity>>(`/v1/lifestyle/celebrities/${id}`),

  getCelebrityNews: (id: string) =>
    apiClient.get<ListResponse<CelebrityNews>>(`/v1/lifestyle/celebrities/${id}/news`),

  // Nightlife
  getVenues: (category?: string) =>
    apiClient.get<ListResponse<NightlifeVenue>>(
      `/v1/lifestyle/nightlife${category && category !== 'All' ? `?category=${category}` : ''}`
    ),

  getFeaturedVenues: () =>
    apiClient.get<ListResponse<NightlifeVenue>>('/v1/lifestyle/nightlife/featured'),

  // Influencers
  getInfluencers: () =>
    apiClient.get<ListResponse<Influencer>>('/v1/lifestyle/influencers'),

  getFeaturedInfluencers: () =>
    apiClient.get<ListResponse<Influencer>>('/v1/lifestyle/influencers/featured'),

  getInfluencerById: (id: string) =>
    apiClient.get<ApiResponse<Influencer>>(`/v1/lifestyle/influencers/${id}`),

  // Social / Saved
  getSavedItems: () =>
    apiClient.get<ListResponse<SavedItem>>('/v1/lifestyle/saved'),

  saveItem: (itemType: string, itemId: string) =>
    apiClient.post<ApiResponse<{ saved: boolean }>>('/v1/lifestyle/saved', {
      itemType,
      itemId,
    }),

  unsaveItem: (itemId: string) =>
    apiClient.delete<ApiResponse<{ saved: boolean }>>(`/v1/lifestyle/saved/${itemId}`),
};
