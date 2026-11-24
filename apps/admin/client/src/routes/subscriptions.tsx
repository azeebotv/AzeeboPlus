import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import type { SubscriptionPlan, SubscriptionStats, PromoCode } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { formatCurrency } from './subscriptions/format';
import { PlansPanel } from './subscriptions/plans-panel';
import { PromosPanel } from './subscriptions/promos-panel';
import { PlanModal } from './subscriptions/plan-modal';
import { PromoModal } from './subscriptions/promo-modal';

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
      const data = requireData(await adminApi.getPromoCodes(), []);
      return unwrapList<PromoCode>(data).items;
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
      const data = requireData(
        await adminApi.getSubscriptionPlans({
          page,
          limit: 15,
          status: statusFilter || undefined,
          tier: tierFilter || undefined,
        }),
        []
      );
      // Upstream returns { items, total, page, limit, totalPages } — unwrap
      // through the shared guard so an envelope drift renders an empty list
      // instead of crashing (this page crashed twice on payload shape).
      const { items, total } = unwrapList<SubscriptionPlan>(data);
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
        <PlansPanel
          plans={plans}
          total={total}
          page={page}
          setPage={setPage}
          isLoading={isLoading}
          plansError={plansError}
          refetchPlans={refetchPlans}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          tierFilter={tierFilter}
          setTierFilter={setTierFilter}
          statuses={statuses}
          tiers={tiers}
          refreshAll={refreshAll}
          openCreate={openCreate}
          openEdit={openEdit}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          toggleStatusMutation={toggleStatusMutation}
          deleteMutation={deleteMutation}
        />
      ) : (
        <PromosPanel
          promoData={promoData}
          loadingPromos={loadingPromos}
          promoError={promoError}
          refetchPromos={refetchPromos}
          onNewPromo={() => setShowPromoModal(true)}
          expirePromoMutation={expirePromoMutation}
          deletePromoMutation={deletePromoMutation}
        />
      )}

      {showPromoModal && (
        <PromoModal
          form={promoForm}
          setForm={setPromoForm}
          error={promoFormError}
          onClose={() => setShowPromoModal(false)}
          onSubmit={handleCreatePromo}
          creating={createPromoMutation.isPending}
        />
      )}

      {showModal && (
        <PlanModal
          form={form}
          setForm={setForm}
          formError={formError}
          editingPlan={editingPlan}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          onSubmit={handleSubmit}
          saving={createMutation.isPending || updateMutation.isPending}
          tiers={tiers}
          statuses={statuses}
        />
      )}
    </div>
  );
}
