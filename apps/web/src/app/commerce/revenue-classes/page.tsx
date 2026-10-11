'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { messageOf, requireArray } from '@/lib/payload';
import { PageShell } from '@/components/layout/PageShell';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import { DollarSign, TrendingUp, BarChart3, PieChart, ArrowRight } from 'lucide-react';

interface RevenueClass {
  id: string;
  name: string;
  description: string;
  amount: number;
  percentage: number;
  universe: string;
  recognition: 'immediate' | 'deferred' | 'recognised';
  collection: 'collected' | 'pending' | 'overdue';
}

/* Dashboard hues ride the semantic ramp. A tone is a pair of token CLASSES —
   the tint is `bg-az-<token>/<NN>` (Tailwind emits the color-mix for us), never
   a hex string with an alpha suffix concatenated onto it. */
type Tone = 'info' | 'success' | 'warning' | 'error' | 'premium';

const TONES: Record<Tone, { tint: string; text: string }> = {
  info: { tint: 'bg-az-secondary-500/15', text: 'text-az-secondary-500' },
  success: { tint: 'bg-az-success-500/15', text: 'text-az-success-500' },
  warning: { tint: 'bg-az-warning-500/15', text: 'text-az-warning-500' },
  error: { tint: 'bg-az-error-500/15', text: 'text-az-error-500' },
  premium: { tint: 'bg-[var(--brand-purple)]/15', text: 'text-[var(--brand-purple)]' },
};

const RECOGNITION_TONES: Record<RevenueClass['recognition'], Tone> = {
  immediate: 'success',
  deferred: 'warning',
  recognised: 'info',
};

const COLLECTION_TONES: Record<RevenueClass['collection'], Tone> = {
  collected: 'success',
  pending: 'warning',
  overdue: 'error',
};

const REVENUE_FLOW: Array<{ label: string; desc: string; tone: Tone }> = [
  { label: 'GMV', desc: 'Gross Merchandise Value', tone: 'info' },
  { label: 'Revenue', desc: 'Recognised Revenue', tone: 'success' },
  { label: 'Collection', desc: 'Cash Received', tone: 'warning' },
  { label: 'Settlement', desc: 'Net to Creator', tone: 'premium' },
];

const PRINCIPLES: Array<{ title: string; desc: string }> = [
  {
    title: 'GMV ≠ Revenue',
    desc: 'Gross merchandise value includes all transactions before deductions',
  },
  {
    title: 'Collection ≠ Recognition',
    desc: 'Cash received may differ from revenue recognised under accrual accounting',
  },
  {
    title: 'Property/Universe Attribution',
    desc: 'Revenue is attributed to the property/universe that generated it',
  },
  {
    title: 'Separate Ledgers',
    desc: 'Money, entitlements, points, and rewards are tracked separately',
  },
];

export default function RevenueClassesPage(): React.JSX.Element {
  const [selectedUniverse, setSelectedUniverse] = useState('all');

  const {
    data: revenueClasses,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['revenue-classes', selectedUniverse],
    queryFn: async () => {
      const params = selectedUniverse !== 'all' ? `?universe=${selectedUniverse}` : '';
      const res = await apiFetch<RevenueClass[]>(`/commerce/revenue-classes${params}`);
      return requireArray(res);
    },
  });

  // '—' while the read failed: a GMV of ₦0 here reads as "nothing collected",
  // not as "the revenue service never answered".
  const money = (value: number) => (isError ? '—' : `₦${value.toLocaleString()}`);

  const stats = {
    totalRevenue: revenueClasses?.reduce((sum, r) => sum + r.amount, 0) || 0,
    collected:
      revenueClasses
        ?.filter((r) => r.collection === 'collected')
        .reduce((sum, r) => sum + r.amount, 0) || 0,
    pending:
      revenueClasses
        ?.filter((r) => r.collection === 'pending')
        .reduce((sum, r) => sum + r.amount, 0) || 0,
    overdue:
      revenueClasses
        ?.filter((r) => r.collection === 'overdue')
        .reduce((sum, r) => sum + r.amount, 0) || 0,
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="az-heading text-az-ink">Revenue Class Separation</h1>
          <p className="az-body mt-1 text-az-ink-muted">
            Track GMV vs Revenue vs Collection vs Recognition
          </p>
        </div>
        <div>
          <label htmlFor="revenue-universe" className="sr-only">
            Filter by universe
          </label>
          <select
            id="revenue-universe"
            value={selectedUniverse}
            onChange={(e) => setSelectedUniverse(e.target.value)}
            className="az-body rounded-az-control border border-az-glass-border bg-az-surface-panel px-4 py-2.5 text-az-ink hover:border-az-glass-border-hover"
          >
            <option value="all">All Universes</option>
            <option value="movies">Movies</option>
            <option value="comedy">Comedy</option>
            <option value="games">Games</option>
            <option value="sports">Sports</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="music">Music</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>

      {isError && (
        <ErrorState
          title="Revenue figures unavailable"
          description={`${messageOf(error)} Figures are withheld rather than shown as ₦0.`}
          onButtonPress={() => refetch()}
        />
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign size={20} aria-hidden="true" />}
          label="Total GMV"
          value={money(stats.totalRevenue)}
          tone="info"
        />
        <StatCard
          icon={<TrendingUp size={20} aria-hidden="true" />}
          label="Collected"
          value={money(stats.collected)}
          tone="success"
        />
        <StatCard
          icon={<BarChart3 size={20} aria-hidden="true" />}
          label="Pending"
          value={money(stats.pending)}
          tone="warning"
        />
        <StatCard
          icon={<PieChart size={20} aria-hidden="true" />}
          label="Overdue"
          value={money(stats.overdue)}
          tone="error"
        />
      </div>

      {/* Revenue Flow Diagram */}
      <section className="az-glass mb-6 p-6">
        <h2 className="az-subtitle mb-4 text-az-ink">Revenue Recognition Flow</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {REVENUE_FLOW.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-az-card ${TONES[item.tone].tint} ${TONES[item.tone].text}`}
              >
                <DollarSign size={24} aria-hidden="true" />
              </div>
              <div>
                <div className="az-body-strong text-az-ink">{item.label}</div>
                <div className="az-caption text-az-ink-muted">{item.desc}</div>
              </div>
              {i < REVENUE_FLOW.length - 1 && (
                <ArrowRight
                  size={20}
                  className="ml-2 shrink-0 text-az-ink-muted"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Classes Table */}
      <section className="az-glass p-6">
        <h2 className="az-subtitle mb-4 text-az-ink">Revenue Classes</h2>
        {isLoading ? (
          <Skeleton height="300px" borderRadius="8px" />
        ) : isError ? null : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Revenue by class and universe, with amount, share of total, recognition timing and
                collection status
              </caption>
              <thead>
                <tr className="border-b border-az-glass-border">
                  <th scope="col" className="az-caption px-4 py-3 text-left text-az-ink-muted">
                    Class
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-left text-az-ink-muted">
                    Universe
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Amount
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Percentage
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-center text-az-ink-muted">
                    Recognition
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-center text-az-ink-muted">
                    Collection
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueClasses?.map((rc) => (
                  <tr key={rc.id} className="border-b border-az-glass-border">
                    <td className="px-4 py-3">
                      <div className="az-body-strong text-az-ink">{rc.name}</div>
                      <div className="az-caption text-az-ink-muted">{rc.description}</div>
                    </td>
                    <td className="az-body px-4 py-3 capitalize text-az-ink-dim">{rc.universe}</td>
                    <td className="az-body-strong px-4 py-3 text-right text-az-ink">
                      ₦{rc.amount.toLocaleString()}
                    </td>
                    <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                      {rc.percentage}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToneBadge tone={RECOGNITION_TONES[rc.recognition]}>
                        {rc.recognition}
                      </ToneBadge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToneBadge tone={COLLECTION_TONES[rc.collection]}>{rc.collection}</ToneBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Key Principles */}
      <section className="az-glass mt-6 p-6">
        <h2 className="az-subtitle mb-4 text-az-ink">Key Principles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div
              key={principle.title}
              className="rounded-az-card border border-az-glass-border bg-az-scarlet/10 p-4"
            >
              <h4 className="az-body-strong mb-1 text-az-ink">{principle.title}</h4>
              <p className="az-caption text-az-ink-muted">{principle.desc}</p>
            </div>
          ))}
        </div>
      </section>
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
