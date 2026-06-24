'use client';
import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  style,
}: SkeletonProps): React.ReactElement {
  const skeletonStyle: React.CSSProperties = {
    backgroundColor: '#2A1A1A',
    animation: 'pulse 1.5s ease-in-out infinite',
    ...style,
  };
  if (width) skeletonStyle.width = width;
  if (height) skeletonStyle.height = height;
  if (borderRadius) skeletonStyle.borderRadius = borderRadius;

  return <div className={className} style={skeletonStyle} />;
}

export function CardSkeleton(): React.ReactElement {
  return (
    <div style={{ backgroundColor: '#1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
      <Skeleton width="100%" height="192px" borderRadius="0" />
      <div style={{ padding: 16 }}>
        <Skeleton width="75%" height="16px" borderRadius="4px" />
        <div style={{ height: 12 }} />
        <Skeleton width="50%" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function ContentGridSkeleton({ count = 6 }: { count?: number }): React.ReactElement {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 24,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton(): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Skeleton width="48px" height="48px" borderRadius="50%" />
      <div>
        <Skeleton width="128px" height="16px" borderRadius="4px" />
        <div style={{ height: 8 }} />
        <Skeleton width="96px" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function StatCardSkeleton(): React.ReactElement {
  return (
    <div className="az-glass" style={{ padding: 24, borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Skeleton width="96px" height="16px" borderRadius="4px" />
        <Skeleton width="40px" height="40px" borderRadius="50%" />
      </div>
      <Skeleton width="80px" height="32px" borderRadius="4px" />
      <div style={{ height: 8 }} />
      <Skeleton width="64px" height="12px" borderRadius="4px" />
    </div>
  );
}

export function ListItemSkeleton(): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
      <Skeleton width="40px" height="40px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="75%" height="16px" borderRadius="4px" />
        <div style={{ height: 8 }} />
        <Skeleton width="50%" height="12px" borderRadius="4px" />
      </div>
    </div>
  );
}

export function VideoPlayerSkeleton(): React.ReactElement {
  return (
    <div
      style={{ backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}
    >
      <div
        style={{
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton width="64px" height="64px" borderRadius="50%" />
      </div>
    </div>
  );
}

export default Skeleton;
