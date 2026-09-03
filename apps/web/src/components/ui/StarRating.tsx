'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = 20,
  interactive = false,
  onRate,
  showValue = false,
  className = '',
}: StarRatingProps): React.JSX.Element {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`relative ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : isHalf
                    ? 'fill-yellow-400/50 text-yellow-400/50'
                    : 'text-white/20'
              }`}
            />
          </button>
        );
      })}
      {showValue && rating > 0 && (
        <span className="text-sm text-white/60 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
