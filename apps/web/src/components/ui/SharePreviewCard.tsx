'use client';

import { Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '../OptimizedImage';

interface SharePreviewCardProps {
  contentId: string;
  title: string;
  description: string;
  thumbnail: string;
  type?: string;
  className?: string;
}

export function SharePreviewCard({
  contentId,
  title,
  description,
  thumbnail,
  type = 'content',
  className = '',
}: SharePreviewCardProps): React.JSX.Element {
  return (
    <div className={`az-glass overflow-hidden ${className}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <OptimizedImage src={thumbnail} alt={title} className="w-full h-full object-cover" fill />
        <div className="absolute inset-0 az-scrim" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-az-pill bg-gradient-to-r from-az-scarlet to-az-flame text-az-ink">
            {type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-az-ink text-sm mb-1 line-clamp-2">{title}</h3>
        <p className="text-xs text-az-ink/50 mb-3 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between">
          <Link
            href={`/content/${contentId}`}
            className="flex items-center gap-1 text-xs font-medium text-az-flame transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View on Azeebo+
          </Link>
          <Share2 className="w-4 h-4 text-az-ink/30" />
        </div>
      </div>
    </div>
  );
}
