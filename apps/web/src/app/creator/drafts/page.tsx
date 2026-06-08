'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Draft {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  lastSaved: string;
  type: 'video' | 'image' | 'audio';
  progress: number;
}

export default function DraftsPage(): JSX.Element {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async (): Promise<void> => {
    try {
      const result = await apiFetch<Draft[]>('/v1/creator/drafts');

      if (result.success && result.data) {
        setDrafts(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load drafts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await apiFetch(`/v1/creator/drafts/${id}`, { method: 'DELETE' });
      loadDrafts();
    } catch (error) {
      alert('Failed to delete draft');
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
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading drafts...</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Drafts</h1>
          </div>
          <button
            onClick={() => router.push('/creator/upload')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            + Create Content
          </button>
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No drafts yet</h2>
            <p className="text-muted-foreground mb-6">
              Your saved drafts will appear here
            </p>
            <button
              onClick={() => router.push('/creator/upload')}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
            >
              Create Content
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-card rounded-lg border border-border overflow-hidden flex"
              >
                <img
                  src={draft.thumbnail}
                  alt={draft.title}
                  className="w-40 h-40 object-cover"
                />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{draft.title}</h3>
                      <p className="text-sm text-muted-foreground">{getTypeIcon(draft.type)} • Last saved {formatDate(draft.lastSaved)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{draft.description}</p>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs text-muted-foreground">{draft.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${draft.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/creator/upload?id=${draft.id}`)}
                      className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                      Continue Editing
                    </button>
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                    >
                      🗑 Delete
                    </button>
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
