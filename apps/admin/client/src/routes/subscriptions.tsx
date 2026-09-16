import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { unwrapList } from '@/lib/payload';
import type { SubscriptionPlan, SubscriptionStats, PromoCode } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

const TIER_COLORS: Record<string, string> = {
  free: 'var(--admin-text-muted)',
  basic: 'var(--admin-orange)',
  standard: 'var(--admin-amber)',
  premium: 'var(--admin-red)',
  enterprise: 'var(--admin-green)',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  active: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  inactive: { bg: 'rgba(154,138,122,0.15)', color: 'var(--admin-text-muted)' },
  archived: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
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
  const [activeTab, setActiveTab] = useState<'plans' | 'promos'>('plans');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Promo Code State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'flat',
    discountValue: '20',
    maxUses: '',
    expiresAt: '',
  });
  const [promoFormError, setPromoFormError] = useState<string | null>(null);

  const {
    data: promoData,
    isLoading: loadingPromos,
    isError: promoError,
    refetch: refetchPromos,
  } = useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: async () => {
      const res = await adminApi.getPromoCodes();
      return res.success ? (res.data as { items: PromoCode[] })?.items || [] : [];
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: (data: Omit<PromoCode, 'id' | 'usedCount' | 'status' | 'createdAt'>) =>
      adminApi.createPromoCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      setShowPromoModal(false);
      setPromoForm({
        code: '',
        discountType: 'percent',
        discountValue: '20',
        maxUses: '',
        expiresAt: '',
      });
      setPromoFormError(null);
    },
  });

  const expirePromoMutation = useMutation({
    mutationFn: (id: string) => adminApi.expirePromoCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => adminApi.deletePromoCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
    },
  });

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

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin', 'subscription-stats'],
    queryFn: async () => {
      const res = await adminApi.getSubscriptionStats();
      // Defensive spread: a partial/undefined payload can never crash the
      // stat cards (this page crashed twice on unguarded field access).
      const base = res.success && res.data ? (res.data as SubscriptionStats) : {};
      return { ...base } as SubscriptionStats;
    },
  });

  const {
    data: plansData,
    isLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['admin', 'subscriptions', page, statusFilter, tierFilter],
    queryFn: async () => {
      const res = await adminApi.getSubscriptionPlans({
        page,
        limit: 15,
        status: statusFilter || undefined,
        tier: tierFilter || undefined,
      });
      // Upstream returns { items, total, page, limit, totalPages } — unwrap
      // through the shared guard so an envelope drift renders an empty list
      // instead of crashing (this page crashed twice on payload shape).
      const { items, total } = unwrapList<SubscriptionPlan>(res.success ? res.data : null);
      return { items, total: total ?? items.length };
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
    setFormError(null);
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
    const price = Number(form.price);
    const durationDays = Number(form.durationDays);
    if (!form.name.trim()) {
      setFormError('Plan name is required.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError('Price must be a non-negative number.');
      return;
    }
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      setFormError('Duration must be at least 1 day.');
      return;
    }
    setFormError(null);
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      price,
      currency: form.currency,
      durationDays,
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
  const hasSubscriptionData = Boolean(
    stats &&
    ((stats.totalActiveSubscriptions ?? 0) > 0 ||
      (stats.totalRevenue ?? 0) > 0 ||
      (stats.monthlyRecurringRevenue ?? 0) > 0 ||
      (stats.activePlans ?? 0) > 0)
  );
  const refreshAll = () => {
    void Promise.all([refetchStats(), refetchPlans(), refetchPromos()]);
  };

  function handleCreatePromo() {
    const code = promoForm.code.trim().toUpperCase();
    const discountValue = Number(promoForm.discountValue);
    const maxUses = promoForm.maxUses ? Number(promoForm.maxUses) : null;
    if (!code) return setPromoFormError('Promo code is required.');
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return setPromoFormError('Use 3–32 letters, numbers, hyphens, or underscores.');
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return setPromoFormError('Discount must be greater than zero.');
    }
    if (promoForm.discountType === 'percent' && discountValue > 100) {
      return setPromoFormError('Percentage discount cannot exceed 100%.');
    }
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return setPromoFormError('Maximum redemptions must be a positive whole number.');
    }
    if (
      promoForm.expiresAt &&
      new Date(`${promoForm.expiresAt}T23:59:59`).getTime() <= Date.now()
    ) {
      return setPromoFormError('Expiry date must be in the future.');
    }
    setPromoFormError(null);
    createPromoMutation.mutate({
      code,
      discountType: promoForm.discountType,
      discountValue,
      maxUses,
      expiresAt: promoForm.expiresAt || null,
      applicablePlanIds: [],
    });
  }

  const statCards = stats
    ? [
        {
          label: 'Active Subscriptions',
          value: (stats.totalActiveSubscriptions ?? 0).toLocaleString(),
          color: 'var(--admin-orange)',
        },
        {
          label: 'Monthly Revenue',
          value: formatCurrency(stats.monthlyRecurringRevenue ?? 0),
          color: 'var(--admin-green)',
        },
        {
          label: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue ?? 0),
          color: 'var(--admin-amber)',
        },
        {
          label: 'Churn Rate',
          value: hasSubscriptionData ? `${(stats.churnRate ?? 0).toFixed(1)}%` : '—',
          color: 'var(--admin-red)',
        },
        {
          label: 'Avg Revenue / User',
          value: hasSubscriptionData ? formatCurrency(stats.averageRevenuePerUser ?? 0) : '—',
          color: 'var(--admin-text-muted)',
        },
        {
          label: 'Active Plans',
          value: String(stats.activePlans ?? 0),
          color: 'var(--admin-orange)',
        },
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
          gap: 20,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="repeat" size={26} color="var(--admin-orange)" />
            Subscriptions
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', maxWidth: 680, lineHeight: 1.5 }}>
            Manage subscription plans, pricing, and promotional discount codes. Changes here affect
            what customers can purchase.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {activeTab === 'plans' ? (
            <button
              onClick={openCreate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              New Plan
            </button>
          ) : (
            <button
              onClick={() => setShowPromoModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              New Promo Code
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        role="tablist"
        aria-label="Subscription management"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid var(--admin-card)',
          paddingBottom: 12,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'plans'}
          aria-controls="subscription-plans-panel"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'plans' ? 'var(--admin-orange)' : 'transparent',
            color: activeTab === 'plans' ? 'white' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Subscription Plans ({total})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'promos'}
          aria-controls="promo-codes-panel"
          onClick={() => setActiveTab('promos')}
          style={{
            padding: '8px 18px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'promos' ? 'var(--admin-orange)' : 'transparent',
            color: activeTab === 'promos' ? 'white' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Promo Codes ({promoData?.length ?? 0})
        </button>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div
          aria-label="Loading subscription metrics"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{
                height: 82,
                borderRadius: 12,
                background:
                  'linear-gradient(90deg, var(--admin-surface), var(--admin-card), var(--admin-surface))',
                opacity: 0.65,
              }}
            />
          ))}
        </div>
      ) : statsError ? (
        <div
          role="alert"
          style={{
            padding: 16,
            marginBottom: 24,
            borderRadius: 12,
            border: '1px solid rgba(204,28,28,0.35)',
            background: 'rgba(204,28,28,0.08)',
            color: 'var(--admin-text-muted)',
          }}
        >
          <strong style={{ color: 'var(--admin-red)' }}>Metrics unavailable.</strong> Subscription
          plans are still usable while the metrics service recovers.{' '}
          <button
            type="button"
            onClick={() => void refetchStats()}
            style={{
              border: 0,
              background: 'transparent',
              color: 'var(--admin-orange)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
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
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
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

      {activeTab === 'plans' ? (
        <div id="subscription-plans-panel" role="tabpanel" aria-label="Subscription plans">
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 20,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
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
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
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
            {(statusFilter || tierFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('');
                  setTierFilter('');
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={refreshAll}
              aria-label="Refresh subscriptions"
              style={{
                marginLeft: 'auto',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'transparent',
                color: 'var(--admin-orange)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Refresh data
            </button>
          </div>

          {/* Plans Table */}
          {isLoading ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Loading plans...
            </p>
          ) : plansError ? (
            <div
              role="alert"
              style={{
                textAlign: 'center',
                padding: 48,
                border: '1px solid rgba(204,28,28,0.35)',
                borderRadius: 16,
                background: 'rgba(204,28,28,0.06)',
              }}
            >
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>Plans could not be loaded</h2>
              <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Check the subscription service connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void refetchPlans()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-orange)',
                  background: 'transparent',
                  color: 'var(--admin-orange)',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 56,
                border: '1px dashed var(--admin-card)',
                borderRadius: 16,
                background: 'linear-gradient(180deg, rgba(232,66,10,0.04), transparent)',
              }}
            >
              <Icon name="package" size={32} color="var(--admin-orange)" />
              <h2 style={{ fontSize: 18, margin: '16px 0 8px' }}>No subscription plans yet</h2>
              <p
                style={{
                  color: 'var(--admin-text-muted)',
                  maxWidth: 440,
                  margin: '0 auto 18px',
                  lineHeight: 1.5,
                }}
              >
                Create your first plan to configure pricing, access rules, and subscriber benefits.
              </p>
              <button
                onClick={openCreate}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-orange)',
                  background: 'transparent',
                  color: 'var(--admin-orange)',
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
                    <tr style={{ borderBottom: '1px solid var(--admin-card)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Plan
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Price
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Duration
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Tier
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Subscribers
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Created
                      </th>
                      <th
                        style={{
                          textAlign: 'right',
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 500,
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => {
                      const statusStyle = (STATUS_STYLES[plan.status] ??
                        STATUS_STYLES['inactive']) as {
                        bg: string;
                        color: string;
                      };
                      return (
                        <tr key={plan.id} style={{ borderBottom: '1px solid var(--admin-card)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: 600, marginBottom: 2 }}>
                              {plan.name}
                              <Link
                                to={`/subscriptions/plans/${plan.id}`}
                                style={{ marginLeft: 8, fontSize: 12, textDecoration: 'none' }}
                              >
                                View →
                              </Link>
                            </p>
                            {plan.description && (
                              <p
                                style={{
                                  color: 'var(--admin-text-muted)',
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
                          <td
                            style={{
                              padding: '12px 16px',
                              fontWeight: 600,
                              color: 'var(--admin-orange)',
                            }}
                          >
                            {formatCurrency(plan.price, plan.currency)}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
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
                                color: TIER_COLORS[plan.tier] || 'var(--admin-text-muted)',
                                backgroundColor: `${TIER_COLORS[plan.tier] || 'var(--admin-text-muted)'}20`,
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
                          <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                            {(plan.subscriberCount ?? 0).toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: 'var(--admin-text-muted)',
                              fontSize: 12,
                            }}
                          >
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
                                  border: '1px solid var(--admin-surface)',
                                  background: 'transparent',
                                  color: 'var(--admin-text-muted)',
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
                                  border: '1px solid var(--admin-surface)',
                                  background: 'transparent',
                                  color: 'var(--admin-orange)',
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
                                      background: 'var(--admin-red)',
                                      color: 'white',
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
                                      border: '1px solid var(--admin-surface)',
                                      background: 'transparent',
                                      color: 'var(--admin-text-muted)',
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
                                    color: 'var(--admin-red)',
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
                      border: '1px solid var(--admin-surface)',
                      background: page <= 1 ? 'transparent' : 'rgba(232,66,10,0.1)',
                      color: page <= 1 ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                      fontSize: 13,
                      cursor: page <= 1 ? 'default' : 'pointer',
                    }}
                  >
                    Prev
                  </button>
                  <span
                    style={{ padding: '6px 14px', color: 'var(--admin-text-muted)', fontSize: 13 }}
                  >
                    Page {page} of {Math.ceil(total / 15)}
                  </span>
                  <button
                    disabled={page >= Math.ceil(total / 15)}
                    onClick={() => setPage(page + 1)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      background:
                        page >= Math.ceil(total / 15) ? 'transparent' : 'rgba(232,66,10,0.1)',
                      color:
                        page >= Math.ceil(total / 15)
                          ? 'var(--admin-text-muted)'
                          : 'var(--admin-orange)',
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
        </div>
      ) : (
        /* Promo Codes Table Tab */
        <div id="promo-codes-panel" role="tabpanel" aria-label="Promo codes">
          {loadingPromos ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Loading promo codes...
            </p>
          ) : promoError ? (
            <div
              role="alert"
              style={{
                textAlign: 'center',
                padding: 48,
                border: '1px solid rgba(204,28,28,0.35)',
                borderRadius: 16,
                background: 'rgba(204,28,28,0.06)',
              }}
            >
              <h2 style={{ fontSize: 18, marginBottom: 8 }}>Promo codes could not be loaded</h2>
              <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Try again or contact the subscription service owner.
              </p>
              <button
                type="button"
                onClick={() => void refetchPromos()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-orange)',
                  background: 'transparent',
                  color: 'var(--admin-orange)',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (promoData?.length ?? 0) === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 60,
                border: '1px dashed var(--admin-card)',
                borderRadius: 16,
              }}
            >
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginBottom: 12 }}>
                No promo codes created yet
              </p>
              <button
                onClick={() => setShowPromoModal(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--admin-orange)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Create Promo Code
              </button>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-card)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        Code
                      </th>
                      <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        Discount
                      </th>
                      <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        Redemptions
                      </th>
                      <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        Expires
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          textAlign: 'right',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoData?.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 14,
                              color: 'var(--admin-orange)',
                              letterSpacing: 1,
                            }}
                          >
                            {p.code}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: 600,
                            color: 'var(--admin-emerald)',
                          }}
                        >
                          {p.discountType === 'percent'
                            ? `${p.discountValue}% OFF`
                            : `$${p.discountValue} OFF`}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--admin-text)' }}>
                          {p.usedCount} / {p.maxUses ? p.maxUses : '∞'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor:
                                p.status === 'active'
                                  ? 'rgba(13,59,46,0.3)'
                                  : 'rgba(204,28,28,0.2)',
                              color:
                                p.status === 'active' ? 'var(--admin-emerald)' : 'var(--admin-red)',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                          {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            {p.status === 'active' && (
                              <button
                                onClick={() => expirePromoMutation.mutate(p.id)}
                                disabled={expirePromoMutation.isPending}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid var(--admin-card)',
                                  backgroundColor: 'transparent',
                                  color: 'var(--admin-amber)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Expire
                              </button>
                            )}
                            <button
                              onClick={() => deletePromoMutation.mutate(p.id)}
                              disabled={deletePromoMutation.isPending}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--admin-red)',
                                backgroundColor: 'transparent',
                                color: 'var(--admin-red)',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Promo Code Modal */}
      {showPromoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-dark)',
              border: '1px solid var(--admin-card)',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 420,
            }}
          >
            <h3 id="promo-dialog-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Create Promo Code
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Promo Code
              </label>
              <input
                type="text"
                placeholder="e.g. SUMMER50"
                value={promoForm.code}
                onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              />
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Discount Type
                </label>
                <select
                  value={promoForm.discountType}
                  onChange={(e) =>
                    setPromoForm({
                      ...promoForm,
                      discountType: e.target.value as 'percent' | 'flat',
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Discount Value
                </label>
                <input
                  type="number"
                  min="1"
                  value={promoForm.discountValue}
                  onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={promoForm.maxUses}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
                >
                  Expires At
                </label>
                <input
                  type="date"
                  value={promoForm.expiresAt}
                  onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            {promoFormError && (
              <p
                role="alert"
                style={{ color: 'var(--admin-red)', fontSize: 12, margin: '0 0 12px' }}
              >
                {promoFormError}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowPromoModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePromo}
                disabled={!promoForm.code || createPromoMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--admin-orange)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: !promoForm.code ? 'not-allowed' : 'pointer',
                  opacity: !promoForm.code ? 0.5 : 1,
                }}
              >
                {createPromoMutation.isPending ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-dialog-title"
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
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-surface)',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 520,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="plan-dialog-title" style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 4,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 4,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
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
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
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
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 4,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--admin-text-muted)',
                      marginBottom: 4,
                    }}
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
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 4,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
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

            {formError && (
              <p role="alert" style={{ color: 'var(--admin-red)', fontSize: 13, marginTop: 16 }}>
                {formError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPlan(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor:
                    createMutation.isPending || updateMutation.isPending
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: createMutation.isPending || updateMutation.isPending ? 0.6 : 1,
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
