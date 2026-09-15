'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
    endpoints: ['/api/v1/analytics/performance', '/api/v1/admin/ops/gateway-rate-limits'],
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

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  added: { bg: 'rgba(16,185,129,0.12)', text: 'var(--brand-emerald)' },
  changed: { bg: 'rgba(59,130,246,0.12)', text: 'var(--brand-blue)' },
  deprecated: { bg: 'rgba(245,158,11,0.12)', text: 'var(--brand-amber)' },
  removed: { bg: 'rgba(239,68,68,0.12)', text: 'var(--brand-red)' },
  fixed: { bg: 'rgba(139,92,246,0.12)', text: 'var(--brand-purple)' },
  security: { bg: 'rgba(236,72,153,0.12)', text: 'var(--brand-pink)' },
};

export default function ChangelogPage(): React.JSX.Element {
  const [filter, setFilter] = useState<string>('all');

  const filteredChangelog =
    filter === 'all' ? CHANGELOG : CHANGELOG.filter((entry) => entry.type === filter);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 800,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>API Changelog</h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 32 }}>
          Track all API changes, additions, and deprecations
        </p>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {['all', 'added', 'changed', 'deprecated', 'removed', 'fixed', 'security'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: filter === type ? 'var(--brand-orange)' : 'var(--glass-bg)',
                color: filter === type ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Changelog Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filteredChangelog.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: TYPE_COLORS[entry.type]?.bg || 'rgba(102,102,102,0.12)',
                    color: TYPE_COLORS[entry.type]?.text || 'var(--brand-grey)',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.type}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  v{entry.version}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted, #9A8A7A)' }}>
                  {entry.date}
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: entry.endpoints ? 12 : 0 }}>
                {entry.description}
              </p>
              {entry.endpoints && entry.endpoints.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {entry.endpoints.map((endpoint, i) => (
                    <code
                      key={i}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(26,10,10,0.5)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {endpoint}
                    </code>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
