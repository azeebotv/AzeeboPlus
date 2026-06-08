'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface PublishedItem {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  earnings: number;
  publishedAt: string;
  type: 'video' | 'image' | 'audio';
}

export default function PublishedContentPage(): JSX.Element {
  const router = useRouter();
  const [content, setContent] = useState<PublishedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async (): Promise<void> => {
    try {
      const result = await apiFetch<PublishedItem[]>('/v1/creator/published');

      if (result.success && result.data) {
        setContent(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load published content', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'image':
        return '📷';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading published content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Published Content</h1>
          </div>
        </div>

        {content.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📢</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No published content</h2>
            <p className="text-muted-foreground">
              Your published content will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/creator/content-detail?id=${item.id}`)}
                className="bg-card rounded-lg border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
                    <span>{getTypeIcon(item.type)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{item.views.toLocaleString()} views</span>
                    <span>{item.likes.toLocaleString()} likes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-500">
                      ₦{item.earnings.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.publishedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
