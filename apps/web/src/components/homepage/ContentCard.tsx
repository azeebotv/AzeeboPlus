'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const { width, height } = SIZE_MAP[size];

  const handleClick = (): void => {
    analytics.homepageCardClicked(sectionId, item.id, position);
  };

  const thumbnailSrc =
    item.mediaAsset?.thumbnailUrl ||
    item.thumbnail ||
    'https://placehold.co/800x600/1a1a1a/ffffff?text=Azeebo%2B';

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
        className="block overflow-hidden rounded-az-card transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-az-flame"
        aria-label={t('content.watchLabel', { title: item.title })}
      >
        <div
          className="az-glass relative overflow-hidden"
          style={{
            width,
            height,
            // Shared-layer gap: `.az-glass` paints `--radius-az-feature` (20px) and
            // no `--card` modifier exists yet, so Figma's 12px poster radius is kept
            // inline against the token rather than with a dead `rounded-az-card` utility.
            borderRadius: 'var(--radius-az-card)',
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
              className="az-caption absolute bottom-2 right-2 rounded-az-control bg-az-surface-root/70 px-1.5 py-0.5 font-medium text-az-ink"
              aria-label={t('content.durationAria', {
                minutes: Math.floor(item.duration / 60),
                seconds: item.duration % 60,
              })}
            >
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </span>
          )}

          {/* Universe icon badge */}
          {item.universe?.icon && (
            <span
              className="absolute top-2 left-2 rounded-az-control bg-az-surface-root/50 px-1.5 py-0.5 text-sm"
              aria-label={t('content.universeAria', { name: item.universe.name })}
            >
              {item.universe.icon}
            </span>
          )}

          {/* Progress bar */}
          {showProgress && typeof progress === 'number' && progress > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 bg-az-ink/20"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('content.watchedAria', { percent: Math.round(progress * 100) })}
            >
              <div
                className="h-full rounded-r-full bg-az-flame"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <p className="az-body-strong truncate text-az-ink">{item.title}</p>
        {item.creator?.name && (
          <p className="az-caption mt-0.5 truncate text-az-ink-muted">{item.creator.name}</p>
        )}
      </div>
    </motion.div>
  );
}
