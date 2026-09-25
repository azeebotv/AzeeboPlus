'use client';
import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyLoad({ fallback, children }: LazyLoadProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
}

export function lazyLoad<T extends ComponentType<Record<string, unknown>>>(
  factory: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(factory);
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <LazyLoad fallback={fallback}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </LazyLoad>
    );
  };
}
