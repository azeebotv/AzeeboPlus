import { Link } from 'react-router-dom';
import { Icon } from '@/components/Icons';
import type { SubscriptionPlan } from '@/lib/admin-types';
import { formatCurrency, formatDate } from './format';

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

interface PlansPanelProps {
  plans: SubscriptionPlan[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  isLoading: boolean;
  plansError: boolean;
  refetchPlans: () => Promise<unknown>;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  tierFilter: string;
  setTierFilter: (tier: string) => void;
  statuses: string[];
  tiers: string[];
  refreshAll: () => void;
  openCreate: () => void;
  openEdit: (plan: SubscriptionPlan) => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  toggleStatusMutation: {
    mutate: (vars: { id: string; status: string }) => void;
    isPending: boolean;
  };
  deleteMutation: { mutate: (id: string) => void; isPending: boolean };
}

export function PlansPanel({
  plans,
  total,
  page,
  setPage,
  isLoading,
  plansError,
  refetchPlans,
  statusFilter,
  setStatusFilter,
  tierFilter,
  setTierFilter,
  statuses,
  tiers,
  refreshAll,
  openCreate,
  openEdit,
  deleteConfirm,
  setDeleteConfirm,
  toggleStatusMutation,
  deleteMutation,
}: PlansPanelProps) {
  return (
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
  );
}
