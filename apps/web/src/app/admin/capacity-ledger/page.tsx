'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { messageOf, requireArray } from '@/lib/payload';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import { Clock, Users, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';

interface CapacityRelease {
  id: string;
  workflow: string;
  department: string;
  hoursBefore: number;
  hoursAfter: number;
  hoursReleased: number;
  automationLevel: 'manual' | 'semi' | 'full';
  status: 'active' | 'completed' | 'planned';
  startDate: string;
  completionDate?: string;
}

interface HeadcountAvoidance {
  id: string;
  role: string;
  department: string;
  reason: string;
  estimatedCost: number;
  status: 'active' | 'approved' | 'deferred';
  approvalDate?: string;
}

/** Status pill classes — token pairs from the generated design system. */
const AUTOMATION_PILL: Record<CapacityRelease['automationLevel'], string> = {
  full: 'bg-az-success-500/20 text-az-success-500',
  semi: 'bg-az-warning-500/20 text-az-warning-500',
  manual: 'bg-az-glass-fill text-az-ink-muted',
};

const RELEASE_STATUS_PILL: Record<CapacityRelease['status'], string> = {
  completed: 'bg-az-success-500/20 text-az-success-500',
  active: 'bg-az-secondary-500/20 text-az-secondary-500',
  planned: 'bg-az-warning-500/20 text-az-warning-500',
};

const HEADCOUNT_STATUS_PILL: Record<HeadcountAvoidance['status'], string> = {
  approved: 'bg-az-success-500/20 text-az-success-500',
  active: 'bg-az-secondary-500/20 text-az-secondary-500',
  deferred: 'bg-az-warning-500/20 text-az-warning-500',
};

export default function CapacityLedgerPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'capacity' | 'headcount'>('capacity');

  const {
    data: capacityReleases,
    isLoading: loadingCapacity,
    isError: capacityFailed,
    error: capacityError,
    refetch: refetchCapacity,
  } = useQuery({
    queryKey: ['capacity-releases'],
    queryFn: async () => {
      const res = await apiFetch<CapacityRelease[]>('/admin/capacity/releases');
      return requireArray(res);
    },
  });

  const {
    data: headcountAvoidances,
    isLoading: loadingHeadcount,
    isError: headcountFailed,
    error: headcountError,
    refetch: refetchHeadcount,
  } = useQuery({
    queryKey: ['headcount-avoidances'],
    queryFn: async () => {
      const res = await apiFetch<HeadcountAvoidance[]>('/admin/headcount/avoidances');
      return requireArray(res);
    },
  });

  // '—' while a read failed: zero here is a claim about the ledger, not the
  // absence of one.
  const dash = '—';

  const capacityStats = {
    totalHoursReleased: capacityReleases?.reduce((sum, r) => sum + r.hoursReleased, 0) || 0,
    activeWorkflows: capacityReleases?.filter((r) => r.status === 'active').length || 0,
    completedWorkflows: capacityReleases?.filter((r) => r.status === 'completed').length || 0,
    avgAutomation: capacityReleases?.filter((r) => r.automationLevel === 'full').length || 0,
  };

  const headcountStats = {
    totalAvoided: headcountAvoidances?.filter((h) => h.status === 'approved').length || 0,
    totalCostSaved:
      headcountAvoidances
        ?.filter((h) => h.status === 'approved')
        .reduce((sum, h) => sum + h.estimatedCost, 0) || 0,
    pendingApproval: headcountAvoidances?.filter((h) => h.status === 'active').length || 0,
  };

  const tabClass = (selected: boolean) =>
    `rounded-az-control px-5 py-2.5 transition-colors ${
      selected
        ? 'az-body-strong bg-az-scarlet text-az-ink'
        : 'az-body bg-az-glass-fill text-az-ink-muted hover:bg-az-glass-fill-hover hover:text-az-ink'
    }`;

  return (
    <div className="min-h-screen bg-az-surface-root text-az-ink">
      <AppHeader />
      <main className="mx-auto max-w-[1200px] px-6 pb-[60px] pt-[100px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="az-heading text-az-ink">Human Capacity Release Ledger</h1>
          <p className="az-lead mt-1 text-az-ink-muted">
            Track hours released and headcount avoidance from automation
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('capacity')}
            className={tabClass(activeTab === 'capacity')}
          >
            Capacity Release
          </button>
          <button
            onClick={() => setActiveTab('headcount')}
            className={tabClass(activeTab === 'headcount')}
          >
            Headcount Avoidance
          </button>
        </div>

        {/* Capacity Release Tab */}
        {activeTab === 'capacity' && (
          <>
            {capacityFailed && (
              <ErrorState
                title="Capacity releases unavailable"
                description={`${messageOf(capacityError)} Totals are withheld rather than shown as zero.`}
                onButtonPress={() => refetchCapacity()}
              />
            )}
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Clock size={20} />}
                label="Hours Released"
                value={capacityFailed ? dash : capacityStats.totalHoursReleased.toLocaleString()}
                tone="bg-az-success-500/20 text-az-success-500"
              />
              <StatCard
                icon={<Users size={20} />}
                label="Active Workflows"
                value={capacityFailed ? dash : capacityStats.activeWorkflows}
                tone="bg-az-secondary-500/20 text-az-secondary-500"
              />
              <StatCard
                icon={<CheckCircle size={20} />}
                label="Completed"
                value={capacityFailed ? dash : capacityStats.completedWorkflows}
                tone="bg-az-universe-games/20 text-az-universe-games"
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                label="Fully Automated"
                value={capacityFailed ? dash : capacityStats.avgAutomation}
                tone="bg-az-warning-500/20 text-az-warning-500"
              />
            </div>

            {/* Workflows Table */}
            <div className="az-glass p-6">
              <h2 className="az-subtitle mb-4 text-az-ink">Automation Workflows</h2>
              {loadingCapacity ? (
                <Skeleton height="300px" borderRadius="8px" />
              ) : capacityFailed ? null : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-az-glass-border">
                        <th className="az-overline px-4 py-3 text-left font-normal text-az-ink-muted">
                          Workflow
                        </th>
                        <th className="az-overline px-4 py-3 text-left font-normal text-az-ink-muted">
                          Department
                        </th>
                        <th className="az-overline px-4 py-3 text-right font-normal text-az-ink-muted">
                          Before (hrs/week)
                        </th>
                        <th className="az-overline px-4 py-3 text-right font-normal text-az-ink-muted">
                          After (hrs/week)
                        </th>
                        <th className="az-overline px-4 py-3 text-right font-normal text-az-ink-muted">
                          Released
                        </th>
                        <th className="az-overline px-4 py-3 text-center font-normal text-az-ink-muted">
                          Automation
                        </th>
                        <th className="az-overline px-4 py-3 text-center font-normal text-az-ink-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReleases?.map((cr) => (
                        <tr key={cr.id} className="border-b border-az-glass-border">
                          <td className="az-body-strong px-4 py-3 text-az-ink">{cr.workflow}</td>
                          <td className="az-body px-4 py-3 text-az-ink-dim">{cr.department}</td>
                          <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                            {cr.hoursBefore}
                          </td>
                          <td className="az-body px-4 py-3 text-right text-az-ink-dim">
                            {cr.hoursAfter}
                          </td>
                          <td className="az-body-strong px-4 py-3 text-right text-az-success-500">
                            {cr.hoursReleased} hrs
                          </td>
                          <td className="az-body px-4 py-3 text-center">
                            <span
                              className={`rounded-az-control px-2 py-1 az-micro-label font-semibold ${AUTOMATION_PILL[cr.automationLevel]}`}
                            >
                              {cr.automationLevel}
                            </span>
                          </td>
                          <td className="az-body px-4 py-3 text-center">
                            <span
                              className={`rounded-az-control px-2 py-1 az-micro-label font-semibold ${RELEASE_STATUS_PILL[cr.status]}`}
                            >
                              {cr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Headcount Avoidance Tab */}
        {activeTab === 'headcount' && (
          <>
            {headcountFailed && (
              <ErrorState
                title="Headcount avoidances unavailable"
                description={`${messageOf(headcountError)} Totals are withheld rather than shown as zero.`}
                onButtonPress={() => refetchHeadcount()}
              />
            )}
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={<Users size={20} />}
                label="Roles Avoided"
                value={headcountFailed ? dash : headcountStats.totalAvoided}
                tone="bg-az-success-500/20 text-az-success-500"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                label="Cost Saved"
                value={
                  headcountFailed ? dash : `₦${headcountStats.totalCostSaved.toLocaleString()}`
                }
                tone="bg-az-secondary-500/20 text-az-secondary-500"
              />
              <StatCard
                icon={<Clock size={20} />}
                label="Pending Approval"
                value={headcountFailed ? dash : headcountStats.pendingApproval}
                tone="bg-az-warning-500/20 text-az-warning-500"
              />
            </div>

            {/* Avoidances Table */}
            <div className="az-glass p-6">
              <h2 className="az-subtitle mb-4 text-az-ink">Headcount Avoidance Register</h2>
              {loadingHeadcount ? (
                <Skeleton height="300px" borderRadius="8px" />
              ) : headcountFailed ? null : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-az-glass-border">
                        <th className="az-overline px-4 py-3 text-left font-normal text-az-ink-muted">
                          Role
                        </th>
                        <th className="az-overline px-4 py-3 text-left font-normal text-az-ink-muted">
                          Department
                        </th>
                        <th className="az-overline px-4 py-3 text-left font-normal text-az-ink-muted">
                          Reason
                        </th>
                        <th className="az-overline px-4 py-3 text-right font-normal text-az-ink-muted">
                          Estimated Cost
                        </th>
                        <th className="az-overline px-4 py-3 text-center font-normal text-az-ink-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcountAvoidances?.map((ha) => (
                        <tr key={ha.id} className="border-b border-az-glass-border">
                          <td className="az-body-strong px-4 py-3 text-az-ink">{ha.role}</td>
                          <td className="az-body px-4 py-3 text-az-ink-dim">{ha.department}</td>
                          <td className="az-caption px-4 py-3 text-az-ink-muted">{ha.reason}</td>
                          <td className="az-body-strong px-4 py-3 text-right text-az-ink">
                            ₦{ha.estimatedCost.toLocaleString()}
                          </td>
                          <td className="az-body px-4 py-3 text-center">
                            <span
                              className={`rounded-az-control px-2 py-1 az-micro-label font-semibold ${HEADCOUNT_STATUS_PILL[ha.status]}`}
                            >
                              {ha.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
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
  tone: string;
}) {
  return (
    <div className="az-glass p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-az-card ${tone}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <span className="az-body text-az-ink-muted">{label}</span>
      </div>
      <div className="az-section-title text-az-ink">{value}</div>
    </div>
  );
}
