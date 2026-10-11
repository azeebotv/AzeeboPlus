'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { messageOf, requireArray } from '@/lib/payload';
import { PageShell } from '@/components/layout/PageShell';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import { Building2, Users, TrendingUp, AlertTriangle, Plus, Search } from 'lucide-react';

interface Counterparty {
  id: string;
  name: string;
  type: 'sponsor' | 'venue' | 'rights_holder' | 'creator' | 'telco' | 'distributor' | 'vendor';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  exposure: number;
  relationshipCount: number;
  lastActivity: string;
}

/* Dashboard hues ride the semantic ramp. A tone is a pair of token CLASSES —
   the tint is `bg-az-<token>/<NN>` (Tailwind emits the color-mix for us), never
   a hex string with an alpha suffix concatenated onto it. `accent`/`neutral`
   cover the categorical type hues (creator pink, vendor grey) that sit outside
   the state ramp. */
type Tone = 'info' | 'success' | 'warning' | 'error' | 'premium' | 'accent' | 'neutral';

const TONES: Record<Tone, { tint: string; text: string }> = {
  info: { tint: 'bg-az-secondary-500/15', text: 'text-az-secondary-500' },
  success: { tint: 'bg-az-success-500/15', text: 'text-az-success-500' },
  warning: { tint: 'bg-az-warning-500/15', text: 'text-az-warning-500' },
  error: { tint: 'bg-az-error-500/15', text: 'text-az-error-500' },
  premium: { tint: 'bg-[var(--brand-purple)]/15', text: 'text-[var(--brand-purple)]' },
  accent: { tint: 'bg-[var(--brand-pink)]/15', text: 'text-[var(--brand-pink)]' },
  neutral: { tint: 'bg-az-ink/10', text: 'text-az-ink-muted' },
};

const TYPE_TONES: Record<Counterparty['type'], Tone> = {
  sponsor: 'success',
  venue: 'info',
  rights_holder: 'premium',
  creator: 'accent',
  telco: 'warning',
  distributor: 'error',
  vendor: 'neutral',
};

const STATUS_TONES: Record<Counterparty['status'], Tone> = {
  active: 'success',
  pending: 'warning',
  inactive: 'error',
  suspended: 'error',
};

export default function CounterpartyPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const {
    data: counterparties,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['counterparties', searchQuery, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      const res = await apiFetch<Counterparty[]>(`/commerce/counterparties?${params.toString()}`);
      return requireArray(res);
    },
  });

  // '—' while the read failed: a computed 0 here would claim an exposure-free
  // book of counterparties when the service never answered.
  const stats = isError
    ? { total: '—', active: '—', totalExposure: '—', pendingReview: '—' }
    : {
        total: counterparties?.length || 0,
        active: counterparties?.filter((c) => c.status === 'active').length || 0,
        totalExposure: `₦${(counterparties?.reduce((sum, c) => sum + c.exposure, 0) || 0).toLocaleString()}`,
        pendingReview: counterparties?.filter((c) => c.status === 'pending').length || 0,
      };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="az-heading text-az-ink">Counterparty Management</h1>
          <p className="az-body mt-1 text-az-ink-muted">
            Manage legal entities and commercial relationships
          </p>
        </div>
        <button
          type="button"
          className="az-btn-primary az-btn-primary--inline flex items-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          Add Counterparty
        </button>
      </div>

      {isError && (
        <ErrorState
          title="Counterparty records unavailable"
          description={`${messageOf(error)} Totals below are withheld rather than shown as zero.`}
          onButtonPress={() => refetch()}
        />
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Building2 size={20} aria-hidden="true" />}
          label="Total"
          value={stats.total}
          tone="info"
        />
        <StatCard
          icon={<Users size={20} aria-hidden="true" />}
          label="Active"
          value={stats.active}
          tone="success"
        />
        <StatCard
          icon={<TrendingUp size={20} aria-hidden="true" />}
          label="Total Exposure"
          value={stats.totalExposure}
          tone="warning"
        />
        <StatCard
          icon={<AlertTriangle size={20} aria-hidden="true" />}
          label="Pending Review"
          value={stats.pendingReview}
          tone="error"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-az-control border border-az-glass-border bg-az-glass-fill px-4 py-3 focus-within:border-az-glass-border-hover">
          <Search size={18} className="shrink-0 text-az-ink-muted" aria-hidden="true" />
          <label htmlFor="counterparty-search" className="sr-only">
            Search counterparties
          </label>
          <input
            id="counterparty-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search counterparties..."
            className="az-body min-w-0 flex-1 bg-transparent text-az-ink placeholder:text-az-glass-placeholder"
          />
        </div>
        <div>
          <label htmlFor="counterparty-type" className="sr-only">
            Filter by counterparty type
          </label>
          <select
            id="counterparty-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="az-body rounded-az-control border border-az-glass-border bg-az-surface-panel px-4 py-3 text-az-ink hover:border-az-glass-border-hover"
          >
            <option value="all">All Types</option>
            <option value="sponsor">Sponsors</option>
            <option value="venue">Venues</option>
            <option value="rights_holder">Rights Holders</option>
            <option value="creator">Creators</option>
            <option value="telco">Telcos</option>
            <option value="distributor">Distributors</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
      </div>

      {/* Counterparty List */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="16px" />
          ))}
        </div>
      ) : isError ? null : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-4">
          {counterparties?.map((cp, i) => (
            <motion.div
              key={cp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="az-glass cursor-pointer p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="mb-1 text-base font-semibold text-az-ink">{cp.name}</h3>
                  <ToneBadge tone={TYPE_TONES[cp.type]}>{cp.type.replace('_', ' ')}</ToneBadge>
                </div>
                <ToneBadge tone={STATUS_TONES[cp.status]}>{cp.status}</ToneBadge>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="az-caption text-az-ink-muted">Exposure</div>
                  <div className="az-body-strong text-az-ink">₦{cp.exposure.toLocaleString()}</div>
                </div>
                <div>
                  <div className="az-caption text-az-ink-muted">Relationships</div>
                  <div className="az-body-strong text-az-ink">{cp.relationshipCount}</div>
                </div>
              </div>
              <div className="az-caption text-az-ink-muted">
                Last activity: {new Date(cp.lastActivity).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  return (
    <div className="az-glass p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-az-card ${TONES[tone].tint} ${TONES[tone].text}`}
        >
          {icon}
        </div>
        <span className="az-caption text-az-ink-muted">{label}</span>
      </div>
      <div className="az-section-title text-az-ink">{value}</div>
    </div>
  );
}

function ToneBadge({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span
      className={`inline-block rounded px-2 py-1 text-[11px] font-semibold capitalize ${TONES[tone].tint} ${TONES[tone].text}`}
    >
      {children}
    </span>
  );
}
