import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Capacity-ledger  - Azeebo+',
  description: 'Admin Capacity-ledger  on Azeebo+',
};

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
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

export default function CapacityLedgerPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'capacity' | 'headcount'>('capacity');

  const { data: capacityReleases, isLoading: loadingCapacity } = useQuery({
    queryKey: ['capacity-releases'],
    queryFn: async () => {
      const res = await apiFetch<CapacityRelease[]>('/admin/capacity/releases');
      return res.success ? res.data || [] : [];
    },
  });

  const { data: headcountAvoidances, isLoading: loadingHeadcount } = useQuery({
    queryKey: ['headcount-avoidances'],
    queryFn: async () => {
      const res = await apiFetch<HeadcountAvoidance[]>('/admin/headcount/avoidances');
      return res.success ? res.data || [] : [];
    },
  });

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
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            Human Capacity Release Ledger
          </h1>
          <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
            Track hours released and headcount avoidance from automation
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('capacity')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'capacity' ? 'var(--brand-orange)' : 'var(--glass-bg)',
              color: activeTab === 'capacity' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Capacity Release
          </button>
          <button
            onClick={() => setActiveTab('headcount')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor:
                activeTab === 'headcount' ? 'var(--brand-orange)' : 'var(--glass-bg)',
              color: activeTab === 'headcount' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Headcount Avoidance
          </button>
        </div>

        {/* Capacity Release Tab */}
        {activeTab === 'capacity' && (
          <>
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <StatCard
                icon={<Clock size={20} />}
                label="Hours Released"
                value={capacityStats.totalHoursReleased.toLocaleString()}
                color="#10B981"
              />
              <StatCard
                icon={<Users size={20} />}
                label="Active Workflows"
                value={capacityStats.activeWorkflows}
                color="#3B82F6"
              />
              <StatCard
                icon={<CheckCircle size={20} />}
                label="Completed"
                value={capacityStats.completedWorkflows}
                color="#8B5CF6"
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                label="Fully Automated"
                value={capacityStats.avgAutomation}
                color="#F59E0B"
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
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                Automation Workflows
              </h2>
              {loadingCapacity ? (
                <Skeleton height="300px" borderRadius="8px" />
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
                          Before (hrs/week)
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          After (hrs/week)
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          Released
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
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReleases?.map((cr) => (
                        <tr key={cr.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{cr.workflow}</td>
                          <td style={{ padding: '12px 16px' }}>{cr.department}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {cr.hoursBefore}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {cr.hoursAfter}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              color: 'var(--brand-emerald)',
                              fontWeight: 600,
                            }}
                          >
                            {cr.hoursReleased} hrs
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor:
                                  cr.automationLevel === 'full'
                                    ? 'rgba(16,185,129,0.12)'
                                    : cr.automationLevel === 'semi'
                                      ? 'rgba(245,158,11,0.12)'
                                      : 'rgba(107,114,128,0.12)',
                                color:
                                  cr.automationLevel === 'full'
                                    ? 'var(--brand-emerald)'
                                    : cr.automationLevel === 'semi'
                                      ? 'var(--brand-amber)'
                                      : 'var(--brand-grey)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {cr.automationLevel}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor:
                                  cr.status === 'completed'
                                    ? 'rgba(16,185,129,0.12)'
                                    : cr.status === 'active'
                                      ? 'rgba(59,130,246,0.12)'
                                      : 'rgba(245,158,11,0.12)',
                                color:
                                  cr.status === 'completed'
                                    ? 'var(--brand-emerald)'
                                    : cr.status === 'active'
                                      ? 'var(--brand-blue)'
                                      : 'var(--brand-amber)',
                                textTransform: 'capitalize',
                              }}
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
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <StatCard
                icon={<Users size={20} />}
                label="Roles Avoided"
                value={headcountStats.totalAvoided}
                color="#10B981"
              />
              <StatCard
                icon={<DollarSign size={20} />}
                label="Cost Saved"
                value={`₦${headcountStats.totalCostSaved.toLocaleString()}`}
                color="#3B82F6"
              />
              <StatCard
                icon={<Clock size={20} />}
                label="Pending Approval"
                value={headcountStats.pendingApproval}
                color="#F59E0B"
              />
            </div>

            {/* Avoidances Table */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                Headcount Avoidance Register
              </h2>
              {loadingHeadcount ? (
                <Skeleton height="300px" borderRadius="8px" />
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
                          Role
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
                            textAlign: 'left',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          Reason
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          Estimated Cost
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {headcountAvoidances?.map((ha) => (
                        <tr key={ha.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{ha.role}</td>
                          <td style={{ padding: '12px 16px' }}>{ha.department}</td>
                          <td
                            style={{
                              padding: '12px 16px',
                              fontSize: 13,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {ha.reason}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                            ₦{ha.estimatedCost.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor:
                                  ha.status === 'approved'
                                    ? 'rgba(16,185,129,0.12)'
                                    : ha.status === 'active'
                                      ? 'rgba(59,130,246,0.12)'
                                      : 'rgba(245,158,11,0.12)',
                                color:
                                  ha.status === 'approved'
                                    ? 'var(--brand-emerald)'
                                    : ha.status === 'active'
                                      ? 'var(--brand-blue)'
                                      : 'var(--brand-amber)',
                                textTransform: 'capitalize',
                              }}
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
