import React from 'react';
import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-white/60 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#E8420A] text-white rounded-lg font-semibold hover:bg-[#D03A08] transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
