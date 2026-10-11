'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { messageOf, requireArray } from '@/lib/payload';
import { PageShell } from '@/components/layout/PageShell';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import {
  Smartphone,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  CreditCard,
  Landmark,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

interface TelcoReconciliation {
  id: string;
  carrier: string;
  period: string;
  activations: number;
  entitlements: number;
  billing: number;
  settled: number;
  discrepancy: number;
  status: 'reconciled' | 'pending' | 'discrepancy' | 'settled';
  lastSync: string;
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
  premium: { tint: 'bg-az-category-violet/15', text: 'text-az-category-violet' },
};

/* Carrier identity hues are categorical, not status colours, so they keep the
   brand hues — but as token classes rather than a var() string. */
const CARRIER_TONES: Record<string, string> = {
  MTN: 'bg-az-accent-gold',
  Airtel: 'bg-az-scarlet',
  Glo: 'bg-az-success-500',
  '9Mobile': 'bg-az-secondary-500',
};

const STATUS_TONES: Record<TelcoReconciliation['status'], Tone> = {
  settled: 'success',
  reconciled: 'info',
  pending: 'warning',
  discrepancy: 'error',
};

const RECONCILIATION_FLOW: Array<{ step: string; tone: Tone; icon: LucideIcon }> = [
  { step: 'Activation', tone: 'info', icon: Smartphone },
  { step: 'Entitlement', tone: 'success', icon: CheckCircle },
  { step: 'Billing', tone: 'warning', icon: CreditCard },
  { step: 'Carrier Settlement', tone: 'premium', icon: Landmark },
  { step: 'Bank Receipt', tone: 'success', icon: CircleDollarSign },
];

export default function TelcoReconciliationPage(): React.JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-09');

  const {
    data: reconciliations,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['telco-reconciliation', selectedPeriod],
    queryFn: async () => {
      const res = await apiFetch<TelcoReconciliation[]>(
        `/commerce/telco/reconciliation?period=${selectedPeriod}`
      );
      return requireArray(res);
    },
  });

  // '—' while the read failed: a discrepancy of ₦0 is exactly the all-clear a
  // reconciliation report is supposed to earn, not default to.
  const dash = '—';

  const stats = {
    totalActivations: reconciliations?.reduce((sum, r) => sum + r.activations, 0) || 0,
    totalSettled: reconciliations?.reduce((sum, r) => sum + r.settled, 0) || 0,
    totalDiscrepancy: reconciliations?.reduce((sum, r) => sum + r.discrepancy, 0) || 0,
    pendingCount: reconciliations?.filter((r) => r.status === 'pending').length || 0,
  };

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="az-heading text-az-ink">Telco Reconciliation</h1>
          <p className="az-body mt-1 text-az-ink-muted">
            Track activations, billing, and carrier settlements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label htmlFor="reconciliation-period" className="sr-only">
              Reconciliation period
            </label>
            <select
              id="reconciliation-period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="az-body rounded-az-control border border-az-glass-border bg-az-surface-panel px-4 py-2.5 text-az-ink hover:border-az-glass-border-hover"
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
          </div>
          <button
            type="button"
            className="az-body flex items-center gap-2 rounded-az-control border border-az-glass-border bg-az-glass-fill px-4 py-2.5 text-az-ink hover:border-az-glass-border-hover"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Sync
          </button>
        </div>
      </div>

      {isError && (
        <ErrorState
          title="Reconciliation figures unavailable"
          description={`${messageOf(error)} Figures are withheld rather than shown as a clean reconciliation.`}
          onButtonPress={() => refetch()}
        />
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Smartphone size={20} aria-hidden="true" />}
          label="Total Activations"
          value={isError ? dash : stats.totalActivations.toLocaleString()}
          tone="info"
        />
        <StatCard
          icon={<CheckCircle size={20} aria-hidden="true" />}
          label="Settled"
          value={isError ? dash : `₦${stats.totalSettled.toLocaleString()}`}
          tone="success"
        />
        <StatCard
          icon={<AlertTriangle size={20} aria-hidden="true" />}
          label="Discrepancy"
          value={isError ? dash : `₦${stats.totalDiscrepancy.toLocaleString()}`}
          tone="error"
        />
        <StatCard
          icon={<Clock size={20} aria-hidden="true" />}
          label="Pending"
          value={isError ? dash : stats.pendingCount}
          tone="warning"
        />
      </div>

      {/* Reconciliation Table */}
      <section className="az-glass p-6">
        <h2 className="az-subtitle mb-4 text-az-ink">Carrier Reconciliation</h2>
        {isLoading ? (
          <Skeleton height="300px" borderRadius="8px" />
        ) : isError ? null : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                Per-carrier activations, entitlements, billing, settled amounts, discrepancy and
                reconciliation status
              </caption>
              <thead>
                <tr className="border-b border-az-glass-border">
                  <th scope="col" className="az-caption px-4 py-3 text-left text-az-ink-muted">
                    Carrier
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Activations
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Entitlements
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Billing
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Settled
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-right text-az-ink-muted">
                    Discrepancy
                  </th>
                  <th scope="col" className="az-caption px-4 py-3 text-center text-az-ink-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {reconciliations?.map((rec) => (
                  <tr key={rec.id} className="border-b border-az-glass-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${CARRIER_TONES[rec.carrier] ?? 'bg-az-ink-muted'}`}
                          aria-hidden="true"
                        />
                        <span className="az-body-strong text-az-ink">{rec.carrier}</span>
                      </div>
                    </td>
                    <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                      {rec.activations.toLocaleString()}
                    </td>
                    <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                      {rec.entitlements.toLocaleString()}
                    </td>
                    <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                      ₦{rec.billing.toLocaleString()}
                    </td>
                    <td className="az-body px-4 py-3 text-right text-az-success-500">
                      ₦{rec.settled.toLocaleString()}
                    </td>
                    <td
                      className={`az-body-strong px-4 py-3 text-right ${
                        rec.discrepancy > 0 ? 'text-az-error-500' : 'text-az-success-500'
                      }`}
                    >
                      {rec.discrepancy > 0 ? '+' : ''}₦{rec.discrepancy.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ToneBadge tone={STATUS_TONES[rec.status]}>{rec.status}</ToneBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Flow Diagram */}
      <section className="az-glass mt-6 p-6">
        <h2 className="az-subtitle mb-4 text-az-ink">Reconciliation Flow</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {RECONCILIATION_FLOW.map((item, i) => {
            const StepIcon = item.icon;
            return (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-az-card ${TONES[item.tone].tint} ${TONES[item.tone].text}`}
                >
                  <StepIcon size={24} aria-hidden="true" />
                </div>
                <div>
                  <div className="az-body text-az-ink">{item.step}</div>
                  <div className="az-caption text-az-ink-muted">Step {i + 1}</div>
                </div>
                {i < RECONCILIATION_FLOW.length - 1 && (
                  <ArrowRight
                    size={20}
                    className="ml-2 shrink-0 text-az-ink/40"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
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
