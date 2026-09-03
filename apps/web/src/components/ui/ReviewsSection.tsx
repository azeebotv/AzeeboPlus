'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, Flag, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface Review {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  body?: string;
  containsSpoilers: boolean;
  helpfulCount: number;
  replyCount: number;
  status: string;
  createdAt: string;
}

interface RatingSummary {
  averageRating: number;
  totalRatings: number;
  distribution: { stars: number; count: number; percentage: number }[];
}

interface ReviewsSectionProps {
  contentId: string;
}

export function ReviewsSection({ contentId }: ReviewsSectionProps): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [page, setPage] = useState(1);

  // Fetch reviews
  const reviewsQuery = useQuery({
    queryKey: ['reviews', contentId, sortBy, page],
    queryFn: async () => {
      const result = await apiFetch<{ reviews: Review[]; total: number; ratingSummary: RatingSummary }>(
        `/content/reviews/content/${contentId}?page=${page}&limit=10&sortBy=${sortBy}`
      );
      return result.success ? result.data : null;
    },
  });

  // Fetch user's review
  const userReviewQuery = useQuery({
    queryKey: ['reviews', contentId, 'mine'],
    queryFn: async () => {
      const result = await apiFetch<Review | null>(`/content/reviews/content/${contentId}/mine`);
      return result.success ? result.data : null;
    },
    enabled: isAuthenticated,
  });

  // Toggle helpful mutation
  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return apiFetch(`/content/reviews/${reviewId}/helpful`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', contentId] });
    },
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      return apiFetch(`/content/reviews/${reviewId}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
  });

  const reviews = reviewsQuery.data?.reviews || [];
  const summary = reviewsQuery.data?.ratingSummary;
  const userReview = userReviewQuery.data;
  const total = reviewsQuery.data?.total || 0;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {summary && (
        <div className="az-glass p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Average Rating */}
            <div className="text-center sm:text-left">
              <div className="text-4xl font-bold text-white mb-1">
                {summary.averageRating.toFixed(1)}
              </div>
              <StarRating rating={summary.averageRating} size={18} />
              <p className="text-sm text-white/50 mt-1">
                {summary.totalRatings} rating{summary.totalRatings !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Distribution */}
            <div className="flex-1 space-y-1.5">
              {summary.distribution.map((d) => (
                <div key={d.stars} className="flex items-center gap-2">
                  <span className="text-xs text-white/60 w-8">{d.stars} ★</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.percentage}%`,
                        background: 'var(--brand-orange)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button / Form */}
      {isAuthenticated && (
        <div>
          {!showForm && !userReview && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--brand-orange)' }}
            >
              <MessageSquare className="w-4 h-4" />
              Write a Review
            </button>
          )}
          {(showForm || userReview) && (
            <ReviewForm
              contentId={contentId}
              existingReview={userReview ? {
                rating: userReview.rating,
                title: userReview.title,
                body: userReview.body,
                containsSpoilers: userReview.containsSpoilers,
              } : null}
              onSuccess={() => {
                setShowForm(false);
                queryClient.invalidateQueries({ queryKey: ['reviews', contentId] });
                queryClient.invalidateQueries({ queryKey: ['reviews', contentId, 'mine'] });
              }}
            />
          )}
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/50">Sort by:</span>
        {(['recent', 'helpful', 'rating'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => { setSortBy(sort); setPage(1); }}
            className={`text-sm font-medium transition-colors ${
              sortBy === sort ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="az-glass p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <div className="space-y-2">
                    <div className="h-3 rounded w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="h-2 rounded w-16" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                </div>
                <div className="h-3 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="az-glass p-8 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-white/20" />
            <p className="text-white/50">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="az-glass p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red, #CC1C1C))', color: 'white' }}
                >
                  {review.userName?.charAt(0) || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{review.userName}</span>
                    <StarRating rating={review.rating} size={12} />
                    <span className="text-xs text-white/30">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  {review.title && (
                    <h4 className="text-sm font-medium text-white mb-1">{review.title}</h4>
                  )}

                  {/* Body */}
                  {review.body && (
                    <p className={`text-sm text-white/60 ${review.containsSpoilers ? 'blur-sm hover:blur-none transition-all cursor-pointer' : ''}`}>
                      {review.body}
                    </p>
                  )}

                  {/* Spoiler warning */}
                  {review.containsSpoilers && (
                    <span className="inline-block mt-1 text-[10px] text-yellow-400/60">
                      Contains spoilers — hover to reveal
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => helpfulMutation.mutate(review.id)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Helpful ({review.helpfulCount})
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Why are you reporting this review?');
                        if (reason) reportMutation.mutate({ reviewId: review.id, reason });
                      }}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-xs text-white/40">
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
