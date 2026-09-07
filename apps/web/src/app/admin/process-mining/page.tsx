'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
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

const RISK_COLORS: Record<string, string> = {
  low: 'var(--brand-emerald)',
  medium: 'var(--brand-amber)',
  high: 'var(--brand-red)',
};

const AUTOMATION_COLORS: Record<string, string> = {
  ready: 'var(--brand-emerald)',
  partial: 'var(--brand-amber)',
  not_ready: 'var(--brand-grey)',
};

export default function ProcessMiningPage(): React.JSX.Element {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['process-mining', selectedDepartment],
    queryFn: async () => {
      const params = selectedDepartment !== 'all' ? `?department=${selectedDepartment}` : '';
      const res = await apiFetch<Workflow[]>(`/admin/process-mining/workflows${params}`);
      return res.success ? res.data || [] : [];
    },
  });

  const stats = {
    totalWorkflows: workflows?.length || 0,
    totalHours: workflows?.reduce((sum, w) => sum + w.avgHours * w.frequency, 0) || 0,
    totalCost: workflows?.reduce((sum, w) => sum + w.costPerExecution * w.frequency, 0) || 0,
    readyForAutomation: workflows?.filter((w) => w.automationReadiness === 'ready').length || 0,
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary, #1A0A0A)',
        minHeight: '100vh',
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Process Mining</h1>
            <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
              Inventory of recurring workflows with hours, cost, risk, and automation readiness
            </p>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard
            icon={<GitBranch size={20} />}
            label="Total Workflows"
            value={stats.totalWorkflows}
            color="#3B82F6"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Total Hours/Month"
            value={stats.totalHours.toLocaleString()}
            color="#8B5CF6"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Total Cost/Month"
            value={`₦${stats.totalCost.toLocaleString()}`}
            color="#F59E0B"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="Ready for Automation"
            value={stats.readyForAutomation}
            color="#10B981"
          />
        </div>

        {/* Workflows Table */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Workflow Inventory</h2>
          {isLoading ? (
            <Skeleton height="400px" borderRadius="8px" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Workflow
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Department
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Frequency/Month
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Avg Hours
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Cost/Execution
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Risk
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Automation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflows?.map((wf) => (
                    <tr key={wf.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{wf.name}</td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                        {wf.department}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{wf.frequency}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {wf.avgHours} hrs
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        ₦{wf.costPerExecution.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: `${RISK_COLORS[wf.riskLevel]}20`,
                            color: RISK_COLORS[wf.riskLevel],
                            textTransform: 'capitalize',
                          }}
                        >
                          {wf.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: `${AUTOMATION_COLORS[wf.automationReadiness]}20`,
                            color: AUTOMATION_COLORS[wf.automationReadiness],
                            textTransform: 'capitalize',
                          }}
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
        <div
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Automation Roadmap</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid #10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--brand-emerald)',
                  marginBottom: 8,
                }}
              >
                Ready Now
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {workflows?.filter((w) => w.automationReadiness === 'ready').length || 0} workflows
                ready for full automation
              </p>
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid #F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--brand-amber)',
                  marginBottom: 8,
                }}
              >
                Partial Automation
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {workflows?.filter((w) => w.automationReadiness === 'partial').length || 0}{' '}
                workflows with partial automation
              </p>
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid #6B7280',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--brand-grey)',
                  marginBottom: 8,
                }}
              >
                Not Ready
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {workflows?.filter((w) => w.automationReadiness === 'not_ready').length || 0}{' '}
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--glass-bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
