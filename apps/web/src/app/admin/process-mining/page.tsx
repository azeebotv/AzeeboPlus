'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { messageOf, requireArray } from '@/lib/payload';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ErrorState, Skeleton } from '@azeebo/ui/web';
import { GitBranch, Clock, DollarSign, Zap } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  department: string;
  frequency: number;
  avgHours: number;
  costPerExecution: number;
  riskLevel: 'low' | 'medium' | 'high';
  automationReadiness: 'ready' | 'partial' | 'not_ready';
  lastAnalyzed: string;
}

const RISK_CLASSES: Record<Workflow['riskLevel'], string> = {
  low: 'bg-az-success-500/20 text-az-success-400',
  medium: 'bg-az-warning-500/20 text-az-warning-400',
  high: 'bg-az-error-500/20 text-az-error-400',
};

const AUTOMATION_CLASSES: Record<Workflow['automationReadiness'], string> = {
  ready: 'bg-az-success-500/20 text-az-success-400',
  partial: 'bg-az-warning-500/20 text-az-warning-400',
  not_ready: 'bg-az-ink/10 text-az-ink-muted',
};

export default function ProcessMiningPage(): React.JSX.Element {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const {
    data: workflows,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['process-mining', selectedDepartment],
    queryFn: async () => {
      const params = selectedDepartment !== 'all' ? `?department=${selectedDepartment}` : '';
      const res = await apiFetch<Workflow[]>(`/admin/process-mining/workflows${params}`);
      return requireArray(res);
    },
  });

  // '—' while the read failed: "0 workflows, ₦0/month" is the finding this
  // page is supposed to produce, not the state of a service that never answered.
  const dash = '—';

  const stats = {
    totalWorkflows: workflows?.length || 0,
    totalHours: workflows?.reduce((sum, w) => sum + w.avgHours * w.frequency, 0) || 0,
    totalCost: workflows?.reduce((sum, w) => sum + w.costPerExecution * w.frequency, 0) || 0,
    readyForAutomation: workflows?.filter((w) => w.automationReadiness === 'ready').length || 0,
  };

  return (
    <div className="min-h-screen bg-az-surface-root text-az-ink">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="az-section-title mb-1 text-az-ink">Process Mining</h1>
            <p className="az-body text-az-ink-muted">
              Inventory of recurring workflows with hours, cost, risk, and automation readiness
            </p>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="az-body rounded-az-control border border-az-glass-border bg-az-glass-fill px-4 py-2.5 text-az-ink"
          >
            <option value="all">All Departments</option>
            <option value="content">Content</option>
            <option value="moderation">Moderation</option>
            <option value="finance">Finance</option>
            <option value="support">Support</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        {/* Stats Cards */}
        {isError && (
          <ErrorState
            title="Workflow data unavailable"
            description={`${messageOf(error)} Totals are withheld rather than shown as zero.`}
            onButtonPress={() => refetch()}
          />
        )}

        <div className="mb-8 grid grid-cols-4 gap-4">
          <StatCard
            icon={<GitBranch size={20} />}
            label="Total Workflows"
            value={isError ? dash : stats.totalWorkflows}
            tone="bg-az-secondary-500/20 text-az-secondary-400"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Total Hours/Month"
            value={isError ? dash : stats.totalHours.toLocaleString()}
            tone="bg-[var(--brand-purple)]/20 text-[var(--brand-purple)]"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Cost/Month"
            value={isError ? dash : `₦${stats.totalCost.toLocaleString()}`}
            tone="bg-az-warning-500/20 text-az-warning-400"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="Ready for Automation"
            value={isError ? dash : stats.readyForAutomation}
            tone="bg-az-success-500/20 text-az-success-400"
          />
        </div>

        {/* Workflows Table */}
        <div className="az-glass p-6">
          <h2 className="az-title mb-4 text-az-ink">Workflow Inventory</h2>
          {isLoading ? (
            <Skeleton height="400px" borderRadius="8px" />
          ) : isError ? null : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-az-glass-border">
                    <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Workflow</th>
                    <th className="az-overline px-4 py-3 text-left text-az-ink-muted">
                      Department
                    </th>
                    <th className="az-overline px-4 py-3 text-right text-az-ink-muted">
                      Frequency/Month
                    </th>
                    <th className="az-overline px-4 py-3 text-right text-az-ink-muted">
                      Avg Hours
                    </th>
                    <th className="az-overline px-4 py-3 text-right text-az-ink-muted">
                      Cost/Execution
                    </th>
                    <th className="az-overline px-4 py-3 text-center text-az-ink-muted">Risk</th>
                    <th className="az-overline px-4 py-3 text-center text-az-ink-muted">
                      Automation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows?.map((wf) => (
                    <tr key={wf.id} className="border-b border-az-glass-border last:border-b-0">
                      <td className="az-body-strong px-4 py-3 text-az-ink">{wf.name}</td>
                      <td className="az-body px-4 py-3 capitalize text-az-ink-muted">
                        {wf.department}
                      </td>
                      <td className="az-body px-4 py-3 text-right text-az-ink">{wf.frequency}</td>
                      <td className="az-body px-4 py-3 text-right text-az-ink">
                        {wf.avgHours} hrs
                      </td>
                      <td className="az-body px-4 py-3 text-right text-az-ink">
                        ₦{wf.costPerExecution.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`az-caption inline-block rounded-az-pill px-2.5 py-1 capitalize ${RISK_CLASSES[wf.riskLevel]}`}
                        >
                          {wf.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`az-caption inline-block rounded-az-pill px-2.5 py-1 capitalize ${AUTOMATION_CLASSES[wf.automationReadiness]}`}
                        >
                          {wf.automationReadiness.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Automation Roadmap */}
        <div className="az-glass mt-6 p-6">
          <h2 className="az-title mb-4 text-az-ink">Automation Roadmap</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-az-card border border-az-success-500/30 bg-az-success-500/10 p-4">
              <h3 className="az-body-strong mb-2 text-az-success-400">Ready Now</h3>
              <p className="az-caption text-az-ink-muted">
                {isError
                  ? dash
                  : workflows?.filter((w) => w.automationReadiness === 'ready').length || 0}{' '}
                workflows ready for full automation
              </p>
            </div>
            <div className="rounded-az-card border border-az-warning-500/30 bg-az-warning-500/10 p-4">
              <h3 className="az-body-strong mb-2 text-az-warning-400">Partial Automation</h3>
              <p className="az-caption text-az-ink-muted">
                {isError
                  ? dash
                  : workflows?.filter((w) => w.automationReadiness === 'partial').length || 0}{' '}
                workflows with partial automation
              </p>
            </div>
            <div className="rounded-az-card border border-az-ink/10 bg-az-ink/5 p-4">
              <h3 className="az-body-strong mb-2 text-az-ink-muted">Not Ready</h3>
              <p className="az-caption text-az-ink-muted">
                {isError
                  ? dash
                  : workflows?.filter((w) => w.automationReadiness === 'not_ready').length ||
                    0}{' '}
                workflows need process redesign
              </p>
            </div>
          </div>
        </div>
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
        <div className={`grid size-10 place-items-center rounded-az-card ${tone}`}>{icon}</div>
        <span className="az-caption text-az-ink-muted">{label}</span>
      </div>
      <div className="az-section-title text-az-ink">{value}</div>
    </div>
  );
}
