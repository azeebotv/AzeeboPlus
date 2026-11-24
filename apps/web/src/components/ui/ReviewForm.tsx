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
  const [containsSpoilers, setContainsSpoilers] = useState(
    existingReview?.containsSpoilers || false
  );
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
      <h3 className="text-lg font-bold text-az-ink mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="text-sm text-az-ink/60 mb-2 block">Your Rating</label>
        <div className="flex items-center gap-3">
          <StarRating rating={rating} interactive onRate={setRating} size={28} />
          {rating > 0 && (
            <span className="text-sm font-medium text-az-flame">{ratingLabels[rating]}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-sm text-az-ink/60 mb-2 block">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="az-input"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="text-sm text-az-ink/60 mb-2 block">Your Review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike?"
          rows={4}
          maxLength={2000}
          className="az-input resize-none"
        />
        <span className="text-xs text-az-ink/30 mt-1 block">{body.length}/2000</span>
      </div>

      {/* Spoiler warning */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={containsSpoilers}
          onChange={(e) => setContainsSpoilers(e.target.checked)}
          className="w-4 h-4 rounded accent-az-flame"
        />
        <span className="text-sm text-az-ink/60 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Contains spoilers
        </span>
      </label>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm bg-az-error-500/10 text-az-error-500">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="az-btn-primary az-btn-primary--inline flex items-center gap-2 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
}
