interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const base = 'animate-pulse bg-az-surface-panel rounded';
  const variants = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`} style={style} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton width="75%" />
      <Skeleton width="50%" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
