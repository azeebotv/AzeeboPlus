'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface ContentReview {
  id: string;
  title: string;
  creatorName: string;
  creatorId: string;
  thumbnail: string;
  type: 'video' | 'image' | 'audio';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reason?: string;
  flags: number;
}

export default function ContentReviewQueuePage(): JSX.Element {
  const router = useRouter();
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedContent, setSelectedContent] = useState<ContentReview | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async (): Promise<void> => {
    try {
      const response = await api.admin.getContentReviewQueue();
      if (response.success && response.data) {
        setReviews(response.data.items || []);
      }
    } catch (error) {
      webLogger.error('Failed to load content review queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (contentId: string): Promise<void> => {
    try {
      const response = await api.admin.approveContent(contentId);
      if (response.success) {
        loadReviews();
        alert('Content approved successfully');
      } else {
        alert(response.message || 'Failed to approve content');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve content';
      alert(message);
    }
  };

  const handleReject = async (contentId: string, reason: string): Promise<void> => {
    try {
      const response = await api.admin.rejectContent(contentId, reason);
      if (response.success) {
        loadReviews();
        alert('Content rejected');
      } else {
        alert(response.message || 'Failed to reject content');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject content';
      alert(message);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
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

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter((r) => r.status === filter);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading review queue...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Content Review Queue</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              <img
                src={review.thumbnail}
                alt={review.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">{review.title}</h3>
                  <span className="text-xl ml-2">{getTypeIcon(review.type)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">by {review.creatorName}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                  {review.flags > 0 && (
                    <span className="text-sm text-red-500">⚠️ {review.flags} flags</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Submitted {new Date(review.submittedAt).toLocaleDateString()}
                </p>
                {review.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) {
                          handleReject(review.id, reason);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {review.reason && (
                  <div className="mt-3 p-2 bg-red-500/10 rounded">
                    <p className="text-xs text-red-500">Rejection reason: {review.reason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">All caught up!</h2>
            <p className="text-muted-foreground">No content in the review queue</p>
          </div>
        )}
      </div>
    </div>
  );
}
