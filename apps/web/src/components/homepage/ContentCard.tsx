'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
import type { ContentItem } from '@/lib/api';
import analytics from '@/lib/analytics';

interface ContentCardProps {
  item: ContentItem;
  sectionId: string;
  position: number;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { width: 160, height: 224 },
  md: { width: 220, height: 310 },
  lg: { width: 280, height: 400 },
};

export default function ContentCard({
  item,
  sectionId,
  position,
  progress,
  showProgress = false,
  size = 'md',
}: ContentCardProps): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const { width, height } = SIZE_MAP[size];

  const handleClick = (): void => {
    analytics.homepageCardClicked(sectionId, item.id, position);
  };

  const thumbnailSrc =
    item.mediaAsset?.thumbnailUrl || item.thumbnail || 'https://placehold.co/800x600/1a1a1a/ffffff?text=Azeebo%2B';

  return (
    <motion.div
      ref={cardRef}
      className="flex-shrink-0 group"
      style={{ width }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/watch/${item.id}`}
        onClick={handleClick}
        className="block rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--brand-orange)]"
        aria-label={`Watch ${item.title}`}
      >
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            width,
            height,
            background: 'var(--brand-surface)',
          }}
        >
          <OptimizedImage
            src={thumbnailSrc}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={`${width}px`}
          />

          {/* Duration badge */}
          {item.duration && (
            <span
              className="absolute bottom-2 right-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-black/70 text-white"
              aria-label={`${Math.floor(item.duration / 60)} minutes ${item.duration % 60} seconds`}
            >
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </span>
          )}

          {/* Universe icon badge */}
          {item.universe?.icon && (
            <span
              className="absolute top-2 left-2 text-sm px-1.5 py-0.5 rounded-md bg-black/50"
              aria-label={`Universe: ${item.universe.name}`}
            >
              {item.universe.icon}
            </span>
          )}

          {/* Progress bar */}
          {showProgress && typeof progress === 'number' && progress > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round(progress * 100)}% watched`}
            >
              <div
                className="h-full rounded-r-full"
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: 'var(--brand-orange)',
                }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-white truncate leading-tight">{item.title}</p>
        {item.creator?.name && (
          <p className="text-xs text-white/50 truncate mt-0.5">{item.creator.name}</p>
        )}
      </div>
    </motion.div>
  );
}
