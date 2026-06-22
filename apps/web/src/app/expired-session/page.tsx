'use client';
import React from 'react';
import { Button } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';

export default function ExpiredSessionPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: colors.bg.primary }}
    >
      <div className="text-center px-4 max-w-md">
        <div className="mb-8">
          <span className="text-8xl">⏰</span>
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
          Session Expired
        </h1>
        <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
          Your session has timed out. Please sign in again to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/login">
            <Button variant="primary" size="lg">
              <span>🔐</span> Sign In Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg">
              <span>🏠</span> Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
