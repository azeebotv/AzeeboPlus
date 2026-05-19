'use client';
import React from 'react';
import { colors, gradients } from '@azeebo/design-tokens';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.bg.primary }}>
      <div className="text-center px-4 max-w-md">
        <div className="mb-8">
          <span className="text-8xl">🛠️</span>
        </div>
        <h1 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
          Down for Maintenance
        </h1>
        <p className="text-lg mb-8" style={{ color: colors.text.secondary }}>
          We're currently making improvements to Azeebo+. We'll be back soon!
        </p>
        <div className="space-y-2" style={{ color: colors.text.tertiary }}>
          <p className="text-sm">Estimated return: 15 minutes</p>
          <p className="text-sm">Follow us on Twitter @azeeboplus for updates</p>
        </div>
      </div>
    </div>
  );
}
