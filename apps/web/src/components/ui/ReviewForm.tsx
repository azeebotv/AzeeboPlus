'use client';

import { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { StarRating } from './StarRating';
import { apiFetch } from '../../lib/api';

interface ReviewFormProps {
  contentId: string;
  existingReview?: {
    rating: number;
    title?: string;
    body?: string;
    containsSpoilers?: boolean;
  } | null;
  onSuccess?: () => void;
}

export function ReviewForm({
  contentId,
  existingReview,
  onSuccess,
}: ReviewFormProps): React.JSX.Element {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [body, setBody] = useState(existingReview?.body || '');
  const [containsSpoilers, setContainsSpoilers] = useState(existingReview?.containsSpoilers || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiFetch('/content/reviews', {
        method: 'POST',
        body: JSON.stringify({
          contentId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
          containsSpoilers,
        }),
      });

      if (result.success) {
        onSuccess?.();
        // Reset form if new review
        if (!existingReview) {
          setRating(0);
          setTitle('');
          setBody('');
          setContainsSpoilers(false);
        }
      } else {
        setError('Failed to submit review');
      }
    } catch {
      setError('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <form onSubmit={handleSubmit} className="az-glass p-6">
      <h3 className="text-lg font-bold text-white mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Your Rating</label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={rating}
            interactive
            onRate={setRating}
            size={28}
          />
          {rating > 0 && (
            <span className="text-sm font-medium" style={{ color: 'var(--brand-orange)' }}>
              {ratingLabels[rating]}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border outline-none focus:border-[var(--brand-orange)] transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike?"
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border outline-none focus:border-[var(--brand-orange)] transition-colors resize-none"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
        />
        <span className="text-xs text-white/30 mt-1 block">{body.length}/2000</span>
      </div>

      {/* Spoiler warning */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={containsSpoilers}
          onChange={(e) => setContainsSpoilers(e.target.checked)}
          className="w-4 h-4 rounded"
          style={{ accentColor: 'var(--brand-orange)' }}
        />
        <span className="text-sm text-white/60 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Contains spoilers
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{ background: 'var(--brand-orange)' }}
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
}
