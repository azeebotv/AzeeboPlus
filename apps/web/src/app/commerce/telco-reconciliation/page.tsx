'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { Smartphone, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

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

const CARRIER_COLORS: Record<string, string> = {
  MTN: 'var(--brand-gold)',
  Airtel: 'var(--brand-red)',
  Glo: 'var(--brand-green)',
  '9Mobile': 'var(--brand-blue)',
};

export default function TelcoReconciliationPage(): React.JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState('2026-09');

  const { data: reconciliations, isLoading } = useQuery({
    queryKey: ['telco-reconciliation', selectedPeriod],
    queryFn: async () => {
      const res = await apiFetch<TelcoReconciliation[]>(
        `/commerce/telco/reconciliation?period=${selectedPeriod}`
      );
      return res.success ? res.data || [] : [];
    },
  });

  const stats = {
    totalActivations: reconciliations?.reduce((sum, r) => sum + r.activations, 0) || 0,
    totalSettled: reconciliations?.reduce((sum, r) => sum + r.settled, 0) || 0,
    totalDiscrepancy: reconciliations?.reduce((sum, r) => sum + r.discrepancy, 0) || 0,
    pendingCount: reconciliations?.filter((r) => r.status === 'pending').length || 0,
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
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Telco Reconciliation</h1>
            <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
              Track activations, billing, and carrier settlements
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={16} />
              Sync
            </button>
          </div>
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
            icon={<Smartphone size={20} />}
            label="Total Activations"
            value={stats.totalActivations.toLocaleString()}
            color="#3B82F6"
          />
          <StatCard
            icon={<CheckCircle size={20} />}
            label="Settled"
            value={`₦${stats.totalSettled.toLocaleString()}`}
            color="#10B981"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Discrepancy"
            value={`₦${stats.totalDiscrepancy.toLocaleString()}`}
            color="#EF4444"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="Pending"
            value={stats.pendingCount}
            color="#F59E0B"
          />
        </div>

        {/* Reconciliation Table */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Carrier Reconciliation
          </h2>
          {isLoading ? (
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
                      Carrier
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Activations
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Entitlements
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Billing
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Settled
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Discrepancy
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
                  {reconciliations?.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: CARRIER_COLORS[rec.carrier] || 'var(--brand-grey)',
                            }}
                          />
                          <span style={{ fontWeight: 500 }}>{rec.carrier}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {rec.activations.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {rec.entitlements.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        ₦{rec.billing.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--brand-emerald)' }}>
                        ₦{rec.settled.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          color: rec.discrepancy > 0 ? 'var(--brand-red)' : 'var(--brand-emerald)',
                        }}
                      >
                        {rec.discrepancy > 0 ? '+' : ''}₦{rec.discrepancy.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor:
                              rec.status === 'settled'
                                ? 'rgba(16,185,129,0.12)'
                                : rec.status === 'reconciled'
                                  ? 'rgba(59,130,246,0.12)'
                                  : rec.status === 'pending'
                                    ? 'rgba(245,158,11,0.12)'
                                    : 'rgba(239,68,68,0.12)',
                            color:
                              rec.status === 'settled'
                                ? 'var(--brand-emerald)'
                                : rec.status === 'reconciled'
                                  ? 'var(--brand-blue)'
                                  : rec.status === 'pending'
                                    ? 'var(--brand-amber)'
                                    : 'var(--brand-red)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Flow Diagram */}
        <div
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Reconciliation Flow</h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {[
              { step: 'Activation', icon: '📱', color: 'var(--brand-blue)' },
              { step: 'Entitlement', icon: '✅', color: 'var(--brand-emerald)' },
              { step: 'Billing', icon: '💳', color: 'var(--brand-amber)' },
              { step: 'Carrier Settlement', icon: '🏦', color: 'var(--brand-purple)' },
              { step: 'Bank Receipt', icon: '💰', color: 'var(--brand-emerald)' },
            ].map((item, i) => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.step}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {i + 1}</div>
                </div>
                {i < 4 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 20, marginLeft: 8 }}>→</div>
                )}
              </div>
            ))}
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
