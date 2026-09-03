'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
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

const RECOGNITION_COLORS: Record<string, string> = {
  immediate: 'var(--brand-emerald)',
  deferred: 'var(--brand-amber)',
  recognised: 'var(--brand-blue)',
};

const COLLECTION_COLORS: Record<string, string> = {
  collected: 'var(--brand-emerald)',
  pending: 'var(--brand-amber)',
  overdue: 'var(--brand-red)',
};

export default function RevenueClassesPage(): React.JSX.Element {
  const [selectedUniverse, setSelectedUniverse] = useState('all');

  const { data: revenueClasses, isLoading } = useQuery({
    queryKey: ['revenue-classes', selectedUniverse],
    queryFn: async () => {
      const params = selectedUniverse !== 'all' ? `?universe=${selectedUniverse}` : '';
      const res = await apiFetch<RevenueClass[]>(`/commerce/revenue-classes${params}`);
      return res.success ? res.data || [] : [];
    },
  });

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
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
              Revenue Class Separation
            </h1>
            <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
              Track GMV vs Revenue vs Collection vs Recognition
            </p>
          </div>
          <select
            value={selectedUniverse}
            onChange={(e) => setSelectedUniverse(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
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
            icon={<DollarSign size={20} />}
            label="Total GMV"
            value={`₦${stats.totalRevenue.toLocaleString()}`}
            color="#3B82F6"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Collected"
            value={`₦${stats.collected.toLocaleString()}`}
            color="#10B981"
          />
          <StatCard
            icon={<BarChart3 size={20} />}
            label="Pending"
            value={`₦${stats.pending.toLocaleString()}`}
            color="#F59E0B"
          />
          <StatCard
            icon={<PieChart size={20} />}
            label="Overdue"
            value={`₦${stats.overdue.toLocaleString()}`}
            color="#EF4444"
          />
        </div>

        {/* Revenue Flow Diagram */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Revenue Recognition Flow
          </h2>
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
              { label: 'GMV', desc: 'Gross Merchandise Value', color: 'var(--brand-blue)' },
              { label: 'Revenue', desc: 'Recognised Revenue', color: 'var(--brand-emerald)' },
              { label: 'Collection', desc: 'Cash Received', color: 'var(--brand-amber)' },
              { label: 'Settlement', desc: 'Net to Creator', color: 'var(--brand-purple)' },
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DollarSign size={24} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                {i < 3 && (
                  <ArrowRight size={20} color="var(--text-muted)" style={{ marginLeft: 8 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Classes Table */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Revenue Classes</h2>
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
                      Class
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Universe
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Percentage
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Recognition
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Collection
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {revenueClasses?.map((rc) => (
                    <tr key={rc.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{rc.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {rc.description}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                        {rc.universe}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        ₦{rc.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{rc.percentage}%</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: `${RECOGNITION_COLORS[rc.recognition]}20`,
                            color: RECOGNITION_COLORS[rc.recognition],
                            textTransform: 'capitalize',
                          }}
                        >
                          {rc.recognition}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: `${COLLECTION_COLORS[rc.collection]}20`,
                            color: COLLECTION_COLORS[rc.collection],
                            textTransform: 'capitalize',
                          }}
                        >
                          {rc.collection}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Key Principles */}
        <div
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Key Principles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
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
            ].map((principle) => (
              <div
                key={principle.title}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'rgba(26,10,10,0.3)',
                }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {principle.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {principle.desc}
                </p>
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
