import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { contentApi, type ContentItem } from '../api';
import { useAuth } from './AuthContext';

interface ContentContextType {
  featuredContent: ContentItem[];
  trendingContent: ContentItem[];
  recentContent: ContentItem[];
  contentByCategory: Record<string, ContentItem[]>;
  currentContent: ContentItem | null;
  isLoading: boolean;
  error: string | null;
  getFeaturedContent: () => Promise<void>;
  getTrendingContent: () => Promise<void>;
  getRecentContent: () => Promise<void>;
  getContentByCategory: (categoryId: string) => Promise<ContentItem[]>;
  getContentById: (contentId: string) => Promise<ContentItem>;
  searchContent: (query: string) => Promise<ContentItem[]>;
  likeContent: (contentId: string) => Promise<void>;
  unlikeContent: (contentId: string) => Promise<void>;
  addToWatchLater: (contentId: string) => Promise<void>;
  removeFromWatchLater: (contentId: string) => Promise<void>;
  markAsWatched: (contentId: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [trendingContent, setTrendingContent] = useState<ContentItem[]>([]);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [contentByCategory, setContentByCategory] = useState<Record<string, ContentItem[]>>({});
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getFeaturedContent();
      getTrendingContent();
      getRecentContent();
    }
  }, [isAuthenticated]);

  const getFeaturedContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.getFeaturedContent(10);
      if (response.success && response.data) {
        setFeaturedContent(response.data);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get featured content');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendingContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.getTrendingContent(10);
      if (response.success && response.data) {
        setTrendingContent(response.data);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get trending content');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentContent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.getWatchHistory(1, 20);
      if (response.success && response.data) {
        setRecentContent(response.data.items);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get recent content');
    } finally {
      setIsLoading(false);
    }
  };

  const getContentByCategory = async (categoryId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.getContentByCategory(categoryId, 1, 20);
      if (response.success && response.data) {
        setContentByCategory(prev => ({
          ...prev,
          [categoryId]: response.data!.items,
        }));
        return response.data.items;
      }
      return [];
    } catch (error: any) {
      setError(error.message || 'Failed to get content by category');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getContentById = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.getContentById(contentId);
      if (response.success && response.data) {
        setCurrentContent(response.data);
        return response.data;
      }
      throw new Error('Content not found');
    } catch (error: any) {
      setError(error.message || 'Failed to get content');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const searchContent = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contentApi.searchContent(query, 1, 20);
      if (response.success && response.data) {
        return response.data.items;
      }
      return [];
    } catch (error: any) {
      setError(error.message || 'Failed to search content');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const likeContent = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await contentApi.addToWatchHistory(contentId);
    } catch (error: any) {
      setError(error.message || 'Failed to like content');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unlikeContent = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await contentApi.removeSavedContent(contentId);
    } catch (error: any) {
      setError(error.message || 'Failed to unlike content');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchLater = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await contentApi.saveContent(contentId);
    } catch (error: any) {
      setError(error.message || 'Failed to add to watch later');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchLater = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await contentApi.removeSavedContent(contentId);
    } catch (error: any) {
      setError(error.message || 'Failed to remove from watch later');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsWatched = async (contentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await contentApi.addToWatchHistory(contentId);
    } catch (error: any) {
      setError(error.message || 'Failed to mark as watched');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContentContext.Provider
      value={{
        featuredContent,
        trendingContent,
        recentContent,
        contentByCategory,
        currentContent,
        isLoading,
        error,
        getFeaturedContent,
        getTrendingContent,
        getRecentContent,
        getContentByCategory,
        getContentById,
        searchContent,
        likeContent,
        unlikeContent,
        addToWatchLater,
        removeFromWatchLater,
        markAsWatched,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}