import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SubscriptionPlan, SubscriptionStats } from '@/lib/admin-types';

const TIER_COLORS: Record<string, string> = {
  free: '#9A8A7A',
  basic: '#E8420A',
  standard: '#F59E0B',
  premium: '#CC1C1C',
  enterprise: '#0D3B2E',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(13,59,46,0.3)', color: '#34D399' },
  inactive: { bg: 'rgba(154,138,122,0.15)', color: '#9A8A7A' },
  archived: { bg: 'rgba(204,28,28,0.15)', color: '#CC1C1C' },
};

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    durationDays: '30',
    tier: 'basic' as SubscriptionPlan['tier'],
    status: 'active' as SubscriptionPlan['status'],
    features: '',
    maxContentAccess: '',
    maxUsers: '',
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'subscription-stats'],
    queryFn: async () => {
      const res = await adminApi.getSubscriptionStats();
      return res.success ? (res.data as SubscriptionStats) : null;
    },
  });

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', page, statusFilter, tierFilter],
    queryFn: async () => {
      const res = await adminApi.getSubscriptionPlans({
        page,
        limit: 15,
        status: statusFilter || undefined,
        tier: tierFilter || undefined,
      });
      return res.success
        ? (res.data as { items: SubscriptionPlan[]; total: number })
        : { items: [], total: 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createSubscriptionPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-stats'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateSubscriptionPlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setEditingPlan(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-stats'] });
      setDeleteConfirm(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.toggleSubscriptionPlanStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });

  function resetForm() {
    setForm({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      durationDays: '30',
      tier: 'basic',
      status: 'active',
      features: '',
      maxContentAccess: '',
      maxUsers: '',
    });
  }

  function openCreate() {
    resetForm();
    setEditingPlan(null);
    setShowModal(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      currency: plan.currency,
      durationDays: String(plan.durationDays),
      tier: plan.tier,
      status: plan.status,
      features: plan.features.join(', '),
      maxContentAccess: plan.maxContentAccess ? String(plan.maxContentAccess) : '',
      maxUsers: plan.maxUsers ? String(plan.maxUsers) : '',
    });
    setEditingPlan(plan);
    setShowModal(true);
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price) || 0,
      currency: form.currency,
      durationDays: parseInt(form.durationDays) || 30,
      tier: form.tier,
      status: form.status,
      features: form.features
        ? form.features
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
      maxContentAccess: form.maxContentAccess ? parseInt(form.maxContentAccess) : undefined,
      maxUsers: form.maxUsers ? parseInt(form.maxUsers) : undefined,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const plans = plansData?.items || [];
  const total = plansData?.total || 0;

  const statCards = stats
    ? [
        {
          label: 'Active Subscriptions',
          value: stats.totalActiveSubscriptions.toLocaleString(),
          color: '#E8420A',
        },
        {
          label: 'Monthly Revenue',
          value: formatCurrency(stats.monthlyRecurringRevenue),
          color: '#0D3B2E',
        },
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), color: '#F59E0B' },
        { label: 'Churn Rate', value: `${stats.churnRate.toFixed(1)}%`, color: '#CC1C1C' },
        {
          label: 'Avg Revenue / User',
          value: formatCurrency(stats.averageRevenuePerUser),
          color: '#9A8A7A',
        },
        { label: 'Active Plans', value: String(stats.activePlans), color: '#E8420A' },
      ]
    : [];

  const tiers = ['free', 'basic', 'standard', 'premium', 'enterprise'];
  const statuses = ['active', 'inactive', 'archived'];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Subscriptions</h1>
          <p style={{ color: '#9A8A7A' }}>Manage subscription plans, pricing, and tiers</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + New Plan
        </button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 20 }}>Loading stats...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {statCards.map((c, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#9A8A7A',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {c.label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #2A1A1A',
            backgroundColor: '#0D0505',
            color: '#F5F0EB',
            fontSize: 13,
          }}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => {
            setTierFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #2A1A1A',
            backgroundColor: '#0D0505',
            color: '#F5F0EB',
            fontSize: 13,
          }}
        >
          <option value="">All Tiers</option>
          {tiers.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Plans Table */}
      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading plans...</p>
      ) : plans.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            border: '1px dashed #2A1A1A',
            borderRadius: 16,
          }}
        >
          <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 12 }}>
            No subscription plans found
          </p>
          <button
            onClick={openCreate}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #E8420A',
              background: 'transparent',
              color: '#E8420A',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Create your first plan
          </button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Plan
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Price
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Tier
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Subscribers
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '12px 16px',
                      color: '#9A8A7A',
                      fontWeight: 500,
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const statusStyle = (STATUS_STYLES[plan.status] ?? STATUS_STYLES['inactive']) as {
                    bg: string;
                    color: string;
                  };
                  return (
                    <tr key={plan.id} style={{ borderBottom: '1px solid #1A0F0F' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, marginBottom: 2 }}>{plan.name}</p>
                        {plan.description && (
                          <p
                            style={{
                              color: '#9A8A7A',
                              fontSize: 11,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {plan.description}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#E8420A' }}>
                        {formatCurrency(plan.price, plan.currency)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A' }}>
                        {plan.durationDays}d
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: TIER_COLORS[plan.tier] || '#9A8A7A',
                            backgroundColor: `${TIER_COLORS[plan.tier] || '#9A8A7A'}20`,
                          }}
                        >
                          {plan.tier}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 500,
                            color: statusStyle.color,
                            backgroundColor: statusStyle.bg,
                          }}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A' }}>
                        {plan.subscriberCount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 12 }}>
                        {formatDate(plan.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: plan.id,
                                status: plan.status === 'active' ? 'inactive' : 'active',
                              })
                            }
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid #2A1A1A',
                              background: 'transparent',
                              color: '#9A8A7A',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openEdit(plan)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid #2A1A1A',
                              background: 'transparent',
                              color: '#E8420A',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          {deleteConfirm === plan.id ? (
                            <>
                              <button
                                onClick={() => deleteMutation.mutate(plan.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#CC1C1C',
                                  color: '#fff',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #2A1A1A',
                                  background: 'transparent',
                                  color: '#9A8A7A',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(plan.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #CC1C1C',
                                background: 'transparent',
                                color: '#CC1C1C',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 15 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: page <= 1 ? 'transparent' : 'rgba(232,66,10,0.1)',
                  color: page <= 1 ? '#4A3A3A' : '#E8420A',
                  fontSize: 13,
                  cursor: page <= 1 ? 'default' : 'pointer',
                }}
              >
                Prev
              </button>
              <span style={{ padding: '6px 14px', color: '#9A8A7A', fontSize: 13 }}>
                Page {page} of {Math.ceil(total / 15)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: page >= Math.ceil(total / 15) ? 'transparent' : 'rgba(232,66,10,0.1)',
                  color: page >= Math.ceil(total / 15) ? '#4A3A3A' : '#E8420A',
                  fontSize: 13,
                  cursor: page >= Math.ceil(total / 15) ? 'default' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#1A0A0A',
              border: '1px solid #2A1A1A',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                >
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Premium Monthly"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                >
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this plan"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="NGN">NGN</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Tier
                  </label>
                  <select
                    value={form.tier}
                    onChange={(e) =>
                      setForm({ ...form, tier: e.target.value as SubscriptionPlan['tier'] })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  >
                    {tiers.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                >
                  Features (comma-separated)
                </label>
                <input
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="e.g. HD Streaming, No Ads, Exclusive Content"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Max Content Access
                  </label>
                  <input
                    type="number"
                    value={form.maxContentAccess}
                    onChange={(e) => setForm({ ...form, maxContentAccess: e.target.value })}
                    placeholder="Unlimited"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                  >
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={form.maxUsers}
                    onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                    placeholder="Unlimited"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      backgroundColor: '#0D0505',
                      color: '#F5F0EB',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{ display: 'block', fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}
                >
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as SubscriptionPlan['status'] })
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 13,
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPlan(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !form.name || !form.price || createMutation.isPending || updateMutation.isPending
                }
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: !form.name || !form.price ? 'not-allowed' : 'pointer',
                  opacity: !form.name || !form.price ? 0.5 : 1,
                }}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingPlan
                    ? 'Update Plan'
                    : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
