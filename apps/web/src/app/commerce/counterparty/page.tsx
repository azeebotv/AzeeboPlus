'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
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

const TYPE_COLORS: Record<string, string> = {
  sponsor: 'var(--brand-emerald)',
  venue: 'var(--brand-blue)',
  rights_holder: 'var(--brand-purple)',
  creator: 'var(--brand-pink)',
  telco: 'var(--brand-amber)',
  distributor: 'var(--brand-red)',
  vendor: 'var(--brand-grey)',
};

export default function CounterpartyPage(): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: counterparties, isLoading } = useQuery({
    queryKey: ['counterparties', searchQuery, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      const res = await apiFetch<Counterparty[]>(`/commerce/counterparties?${params.toString()}`);
      return res.success ? res.data || [] : [];
    },
  });

  const stats = {
    total: counterparties?.length || 0,
    active: counterparties?.filter((c) => c.status === 'active').length || 0,
    totalExposure: counterparties?.reduce((sum, c) => sum + c.exposure, 0) || 0,
    pendingReview: counterparties?.filter((c) => c.status === 'pending').length || 0,
  };

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
              Counterparty Management
            </h1>
            <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
              Manage legal entities and commercial relationships
            </p>
          </div>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: 'var(--brand-orange)',
              color: 'white',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Add Counterparty
          </button>
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
            icon={<Building2 size={20} />}
            label="Total"
            value={stats.total}
            color="#3B82F6"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Active"
            value={stats.active}
            color="#10B981"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Total Exposure"
            value={`₦${stats.totalExposure.toLocaleString()}`}
            color="#F59E0B"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="Pending Review"
            value={stats.pendingReview}
            color="#EF4444"
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search counterparties..."
              style={{
                flex: 1,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
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

        {/* Counterparty List */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height="200px" borderRadius="16px" />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: 16,
            }}
          >
            {counterparties?.map((cp, i) => (
              <motion.div
                key={cp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--glass-bg)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{cp.name}</h3>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: `${TYPE_COLORS[cp.type]}20`,
                        color: TYPE_COLORS[cp.type],
                        textTransform: 'capitalize',
                      }}
                    >
                      {cp.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor:
                        cp.status === 'active'
                          ? 'rgba(16,185,129,0.12)'
                          : cp.status === 'pending'
                            ? 'rgba(245,158,11,0.12)'
                            : 'rgba(239,68,68,0.12)',
                      color:
                        cp.status === 'active'
                          ? 'var(--brand-emerald)'
                          : cp.status === 'pending'
                            ? 'var(--brand-amber)'
                            : 'var(--brand-red)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {cp.status}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                      Exposure
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      ₦{cp.exposure.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                      Relationships
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cp.relationshipCount}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Last activity: {new Date(cp.lastActivity).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
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
