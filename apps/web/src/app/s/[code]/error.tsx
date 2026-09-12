'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ShareError() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="az-glass p-8 max-w-md text-center">
        <AlertTriangle
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--color-error-500, #EF4444)' }}
        />
        <h2 className="text-xl font-bold text-white mb-2">Link not found</h2>
        <p className="text-white/60 text-sm mb-6">
          This share link may have expired or been removed.
        </p>
        <Link
          href="/home"
          className="inline-block px-6 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--brand-orange)' }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
