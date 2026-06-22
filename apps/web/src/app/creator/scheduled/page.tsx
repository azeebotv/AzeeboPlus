'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface ScheduledPost {
  id: string;
  title: string;
  thumbnail: string;
  scheduledFor: string;
  type: 'video' | 'image' | 'audio';
  status: 'scheduled' | 'processing' | 'failed';
}

export default function ScheduledPostsPage(): JSX.Element {
  const router = useRouter();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (): Promise<void> => {
    try {
      const result = await apiFetch<ScheduledPost[]>('/v1/creator/scheduled');

      if (result.success && result.data) {
        setPosts(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load scheduled posts', error);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'text-green-500';
      case 'processing':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Scheduled Posts</h1>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No scheduled posts</h2>
            <p className="text-muted-foreground">Your scheduled posts will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => router.push(`/creator/content-detail?id=${post.id}`)}
                className="bg-card rounded-lg border border-border overflow-hidden flex cursor-pointer hover:shadow-lg transition-shadow"
              >
                <img src={post.thumbnail} alt={post.title} className="w-40 h-40 object-cover" />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>
                      <p className="text-sm text-muted-foreground">{getTypeIcon(post.type)}</p>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Scheduled for:</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(post.scheduledFor)}
                    </p>
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
