'use client';

import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export default function SectionHeader({
  title,
  subtitle,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <div className="mb-3">
      <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
    </div>
  );
}
