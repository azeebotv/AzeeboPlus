'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoints?: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2026-09-01',
    type: 'added',
    description: 'Performance monitoring and rate limiting dashboards for admin panel',
    // rate-limit dashboards shipped under the admin service, not /analytics.
    // rate-limit dashboards ship under the admin service (settings/performance), not /analytics.
    endpoints: ['/api/v1/admin/settings/performance', '/api/v1/admin/ops/gateway-rate-limits'],
  },
  {
    version: '2.1.0',
    date: '2026-09-01',
    type: 'added',
    description: 'Theme toggle for dark/light mode in user settings',
  },
  {
    version: '2.0.0',
    date: '2026-08-30',
    type: 'added',
    description: 'Agent registry, task router, and risk engine for AOS governance',
    endpoints: ['/api/v1/agents/*', '/api/v1/tasks/*', '/api/v1/risk/*'],
  },
  {
    version: '2.0.0',
    date: '2026-08-30',
    type: 'added',
    description: 'Model cost tracking middleware for AI request cost monitoring',
  },
  {
    version: '1.5.0',
    date: '2026-08-21',
    type: 'added',
    description: 'Media encryption service with AES-256-GCM encryption',
    endpoints: ['/api/v1/media/encrypt', '/api/v1/media/decrypt'],
  },
  {
    version: '1.5.0',
    date: '2026-08-21',
    type: 'added',
    description: 'Knowledge graph service for canonical knowledge entities',
    endpoints: ['/api/v1/knowledge/graph/*'],
  },
  {
    version: '1.4.0',
    date: '2026-08-19',
    type: 'security',
    description: 'Implemented exponential backoff account lockout after failed logins',
  },
  {
    version: '1.4.0',
    date: '2026-08-19',
    type: 'security',
    description: 'Added social auth redirect URI validation to prevent open redirect attacks',
  },
  {
    version: '1.4.0',
    date: '2026-08-19',
    type: 'security',
    description: 'Made CSRF token cookie httpOnly with header-based delivery',
  },
  {
    version: '1.3.0',
    date: '2026-08-18',
    type: 'changed',
    description: 'Gateway CSRF now skips Bearer token requests for mobile compatibility',
  },
  {
    version: '1.3.0',
    date: '2026-08-18',
    type: 'fixed',
    description: 'Gateway now preserves GET response bodies on cache miss',
  },
  {
    version: '1.2.0',
    date: '2026-08-15',
    type: 'added',
    description: 'WebSocket notifications for real-time push updates',
    endpoints: ['ws://localhost:3006'],
  },
  {
    version: '1.2.0',
    date: '2026-08-15',
    type: 'added',
    description: 'Tipping page with backend API endpoints',
    endpoints: ['/api/v1/tipping/*'],
  },
  {
    version: '1.1.0',
    date: '2026-08-10',
    type: 'added',
    description: 'Games section with trivia and tournament support',
    endpoints: ['/api/v1/games/*'],
  },
  {
    version: '1.0.0',
    date: '2026-08-01',
    type: 'added',
    description: 'Initial production release with 29 microservices',
  },
];

/* Changelog entry kinds are status hues, so they ride the state ramps. There is
   no violet token, so `fixed` sits on the brand ramp instead. */
const TYPE_TINT: Record<string, string> = {
  added: 'text-az-success-400',
  changed: 'text-az-secondary-400',
  deprecated: 'text-az-warning-400',
  removed: 'text-az-error-400',
  fixed: 'text-az-primary-300',
  security: 'text-az-flame',
};

export default function ChangelogPage(): React.JSX.Element {
  const [filter, setFilter] = useState<string>('all');

  const filteredChangelog =
    filter === 'all' ? CHANGELOG : CHANGELOG.filter((entry) => entry.type === filter);

  return (
    <PageShell activeNav="Developers" maxWidth="md">
      <PageHero
        eyebrow="Developer Platform"
        title="API Changelog"
        subtitle="Track all API changes, additions, and deprecations"
      />

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {['all', 'added', 'changed', 'deprecated', 'removed', 'fixed', 'security'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`cursor-pointer rounded-az-pill border px-4 py-1.5 az-caption capitalize transition-colors ${
              filter === type
                ? 'border-az-glass-border-hover bg-az-glass-fill-active text-az-ink'
                : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Changelog Entries */}
      <div className="flex flex-col gap-5">
        {filteredChangelog.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="az-glass p-6"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span
                className={`az-chip px-2.5 py-1 az-micro-label uppercase ${TYPE_TINT[entry.type] ?? 'text-az-ink-muted'}`}
              >
                {entry.type}
              </span>
              <span className="az-body-strong text-az-ink">v{entry.version}</span>
              <span className="az-caption text-az-ink-dim">{entry.date}</span>
            </div>
            <p className="az-body text-az-ink-muted">{entry.description}</p>
            {entry.endpoints && entry.endpoints.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.endpoints.map((endpoint, i) => (
                  <code
                    key={i}
                    className="rounded-az-chip bg-az-surface-root/60 px-2 py-1 az-caption font-mono text-az-ink-dim"
                  >
                    {endpoint}
                  </code>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
