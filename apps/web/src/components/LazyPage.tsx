'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

interface LazyPageProps {
  children: React.ReactNode;
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-orange)] border-t-transparent" />
        <p className="text-sm text-[var(--brand-mid-brown)]">Loading...</p>
      </div>
    </div>
  );
}

export function LazyPage({ children }: LazyPageProps) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// Dynamic import wrapper for heavy pages
export function withLazyLoading<P extends object>(Component: React.ComponentType<P>) {
  return dynamic<P>(() => Promise.resolve(Component), {
    loading: () => <PageLoader />,
    ssr: false,
  });
}
