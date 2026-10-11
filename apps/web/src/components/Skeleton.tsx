'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Skeleton shimmer on the token vocabulary: the fill is an `az-surface` token,
// the breathing is Tailwind's `animate-pulse`, and every static box / gap /
// radius is a utility. Declarations that a caller can override through props —
// or that a shared unlayered class would pin — stay inline.
const SKELETON_FILL_CLS = 'animate-pulse bg-az-surface-panel';

export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  style,
}: SkeletonProps): React.ReactElement {
  const skeletonStyle: React.CSSProperties = { ...style };
  if (width) skeletonStyle.width = width;
  if (height) skeletonStyle.height = height;
  if (borderRadius) skeletonStyle.borderRadius = borderRadius;

  return (
    <div
      className={`${SKELETON_FILL_CLS} ${className}`}
      style={skeletonStyle}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    />
  );
}

export function CardSkeleton(): React.ReactElement {
  return (
    <div
      className="bg-az-surface-root overflow-hidden"
      // 12px === var(--radius-az-card); kept as an inline declaration because
      // components/__tests__/Skeleton.test.tsx counts cards by that style value.
      style={{ borderRadius: 12 }}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <Skeleton width="100%" height="192px" borderRadius="0" />
      <div className="p-4">
        <Skeleton width="75%" height="16px" borderRadius="4px" />
        <div className="h-3" />
        <Skeleton width="50%" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function ContentGridSkeleton({ count = 6 }: { count?: number }): React.ReactElement {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton(): React.ReactElement {
  return (
    <div
      className="flex items-center gap-4"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <Skeleton width="48px" height="48px" borderRadius="50%" />
      <div>
        <Skeleton width="128px" height="16px" borderRadius="4px" />
        <div className="h-2" />
        <Skeleton width="96px" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function StatCardSkeleton(): React.ReactElement {
  return (
    <div
      className="az-glass p-6"
      // Shared-layer gap: `.az-glass` pins `border-radius` (20px) and the sheet
      // is unlayered, so the 16px panel radius can only be expressed inline.
      style={{ borderRadius: 'var(--radius-az-panel)' }}
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="flex justify-between mb-4">
        <Skeleton width="96px" height="16px" borderRadius="4px" />
        <Skeleton width="40px" height="40px" borderRadius="50%" />
      </div>
      <Skeleton width="80px" height="32px" borderRadius="4px" />
      <div className="h-2" />
      <Skeleton width="64px" height="12px" borderRadius="4px" />
    </div>
  );
}

export function ListItemSkeleton(): React.ReactElement {
  return (
    <div
      className="flex items-center gap-4 p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <Skeleton width="40px" height="40px" borderRadius="50%" />
      <div className="flex-1">
        <Skeleton width="75%" height="16px" borderRadius="4px" />
        <div className="h-2" />
        <Skeleton width="50%" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function VideoPlayerSkeleton(): React.ReactElement {
  return (
    <div
      className="bg-black rounded-az-card overflow-hidden mb-6"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="aspect-video flex items-center justify-center">
        <Skeleton width="64px" height="64px" borderRadius="50%" />
      </div>
    </div>
  );
}

export default Skeleton;
