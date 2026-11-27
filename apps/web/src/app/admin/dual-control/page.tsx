'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Dual-Control Candidate Actions (AZP-ADMIN-004, TAA §55)
 * Admin page for managing dual-control requirements for high-risk operations:
 * large refunds, manual entitlements, bulk user operations, etc.
 */

interface DualControlAction {
  id: string;
  actionType:
    | 'large_refund'
    | 'manual_entitlement'
    | 'bulk_operation'
    | 'data_export'
    | 'account_modification';
  description: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  amount?: number;
  currency?: string;
  targetUserIds?: string[];
  status: 'pending' | 'first_approved' | 'approved' | 'rejected' | 'executed';
  firstApprover?: string;
  firstApproverName?: string;
  firstApprovedAt?: string;
  secondApprover?: string;
  secondApproverName?: string;
  secondApprovedAt?: string;
  rejectionReason?: string;
  executedAt?: string;
}

interface DualControlStats {
  totalPending: number;
  awaitingFirstApproval: number;
  awaitingSecondApproval: number;
  executedThisMonth: number;
}

const ACTION_TYPES = [
  { value: 'large_refund', label: 'Large Refund' },
  { value: 'manual_entitlement', label: 'Manual Entitlement' },
  { value: 'bulk_operation', label: 'Bulk Operation' },
  { value: 'data_export', label: 'Data Export' },
  { value: 'account_modification', label: 'Account Modification' },
] as const;

interface CreateRequestForm {
  actionType: string;
  description: string;
  amount: string;
  currency: string;
  targetUserIds: string;
}

const EMPTY_FORM: CreateRequestForm = {
  actionType: 'large_refund',
  description: '',
  amount: '',
  currency: '',
  targetUserIds: '',
};

export default function DualControlPage() {
  const [actions, setActions] = useState<DualControlAction[]>([]);
  const [stats, setStats] = useState<DualControlStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRequestForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiFetch<{ actions: DualControlAction[]; stats: DualControlStats }>(
        `/api/v1/admin/dual-control?${params.toString()}`
      );

      if (response.success && response.data) {
        setActions(response.data.actions);
        setStats(response.data.stats);
      } else {
        setError(response.message || 'Failed to load dual-control actions');
      }
    } catch {
      setError('Network error loading actions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/api/v1/admin/dual-control/${id}/approve`, {
        method: 'POST',
      });
      fetchActions();
    } catch {
      // Error handled by fetch
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await apiFetch(`/api/v1/admin/dual-control/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchActions();
    } catch {
      // Error handled by fetch
    }
  };

  /** Client-side mirror of the backend's create validation (action types,
   * description length, amount/currency pairing) so obvious mistakes fail
   * fast; the server remains the authority. */
  const validateForm = (): string | null => {
    if (!form.description.trim()) return 'A description of the requested action is required';
    if (form.description.trim().length > 2000)
      return 'Description must be 2000 characters or fewer';
    if (form.amount.trim()) {
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be a positive number';
      if (!form.currency.trim()) return 'Currency is required when an amount is provided';
    }
    return null;
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await apiFetch(`/api/v1/admin/dual-control`, {
        method: 'POST',
        body: JSON.stringify({
          actionType: form.actionType,
          description: form.description.trim(),
          ...(form.amount.trim()
            ? {
                amount: Number(form.amount),
                currency: form.currency.trim().toUpperCase(),
              }
            : {}),
          ...(form.targetUserIds.trim()
            ? {
                targetUserIds: form.targetUserIds
                  .split(',')
                  .map((id) => id.trim())
                  .filter(Boolean),
              }
            : {}),
        }),
      });

      if (!response.success) {
        setFormError(response.message || 'Failed to create request');
        return;
      }

      // New requests are pending — surface the pending view and refresh.
      setForm(EMPTY_FORM);
      setShowForm(false);
      setStatusFilter((prev) => (prev === 'all' || prev === 'pending' ? prev : 'pending'));
      fetchActions();
    } catch {
      setFormError('Network error creating request');
    } finally {
      setSubmitting(false);
    }
  };

  const actionTypeLabels = {
    large_refund: 'DollarSign Large Refund',
    manual_entitlement: 'Gift Manual Entitlement',
    bulk_operation: 'Package Bulk Operation',
    data_export: 'Upload Data Export',
    account_modification: 'User Account Modification',
  };

  const statusColors = {
    pending: 'bg-az-warning-500/20 text-az-warning-500',
    first_approved: 'bg-az-secondary-500/20 text-az-secondary-500',
    approved: 'bg-az-success-500/20 text-az-success-500',
    rejected: 'bg-az-error-500/15 text-az-error-500',
    executed: 'bg-az-glass-fill text-az-ink-muted',
  };

  const stepCircle = (state: 'done' | 'waiting' | 'idle') =>
    `flex size-6 items-center justify-center rounded-full az-micro-label ${
      state === 'done'
        ? 'bg-az-success-500 text-az-surface-root'
        : state === 'waiting'
          ? 'bg-az-warning-500 text-az-surface-root'
          : 'bg-az-glass-fill-hover text-az-ink-muted'
    }`;

  return (
    <div className="min-h-screen bg-az-surface-root p-6 text-az-ink">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="az-heading text-az-ink">Dual-Control Actions</h1>
            <p className="az-lead mt-2 text-az-ink-muted">
              High-risk operations requiring two-person approval before execution
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError(null);
            }}
            className="rounded-az-control bg-az-glass-fill px-4 py-2 az-body-strong text-az-ink transition-colors hover:bg-az-glass-fill-hover"
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Create-request form */}
        {showForm && (
          <div className="az-glass mb-8 p-6">
            <h2 className="az-subtitle mb-4 text-az-ink">New Dual-Control Request</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="az-label">Action type *</label>
                <select
                  value={form.actionType}
                  onChange={(e) => setForm((prev) => ({ ...prev, actionType: e.target.value }))}
                  className="az-input"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="az-label">Target user IDs (comma-separated, optional)</label>
                <input
                  type="text"
                  value={form.targetUserIds}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetUserIds: e.target.value }))}
                  className="az-input"
                  placeholder="user-id-1, user-id-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="az-label">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={2000}
                  className="az-input h-24 resize-none"
                  placeholder="What high-risk operation needs approval, and why?"
                />
                <p className="az-caption mt-1 text-az-ink-muted">{form.description.length}/2000</p>
              </div>
              <div>
                <label className="az-label">Amount (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="az-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="az-label">
                  Currency {form.amount.trim() ? '*' : '(optional)'}
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  maxLength={3}
                  className="az-input"
                  placeholder="NGN"
                />
              </div>
            </div>

            {formError && <p className="az-body mt-4 text-az-error-500">{formError}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <p className="az-caption text-az-ink-muted">
                The requesting admin cannot approve their own request — a second admin must approve.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="az-glass p-4">
              <p className="az-body text-az-ink-muted">Pending Actions</p>
              <p className="az-title text-az-warning-500">{stats.totalPending}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-body text-az-ink-muted">Awaiting First Approval</p>
              <p className="az-title text-az-secondary-500">{stats.awaitingFirstApproval}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-body text-az-ink-muted">Awaiting Second Approval</p>
              <p className="az-title text-az-flame">{stats.awaitingSecondApproval}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-body text-az-ink-muted">Executed This Month</p>
              <p className="az-title text-az-success-500">{stats.executedThisMonth}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6 flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="az-input max-w-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="first_approved">Awaiting Second Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
        </div>

        {loading ? (
          <div className="az-lead py-12 text-center text-az-ink-muted">Loading actions...</div>
        ) : error ? (
          <div className="az-lead py-12 text-center text-az-error-500">{error}</div>
        ) : actions.length === 0 ? (
          <EmptyState
            icon="Lock"
            title="No dual-control actions found"
            description="No dual-control actions are pending review"
          />
        ) : (
          <div className="grid gap-4">
            {actions.map((action) => (
              <div key={action.id} className="az-glass p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="az-body-strong text-az-ink">
                        {actionTypeLabels[action.actionType]}
                      </span>
                      <span
                        className={`rounded-az-pill px-2.5 py-1 az-micro-label ${statusColors[action.status]}`}
                      >
                        {action.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="az-body-strong text-az-ink">{action.description}</h3>
                    <p className="az-caption text-az-ink-muted">
                      Requested by {action.requestedByName} •{' '}
                      {new Date(action.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  {action.amount && (
                    <div className="text-right">
                      <p className="az-title text-az-ink">
                        {action.amount.toLocaleString()} {action.currency || 'NGN'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Approval progress */}
                <div className="mb-4 rounded-az-control bg-az-glass-fill p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={stepCircle(action.firstApprover ? 'done' : 'idle')}
                        aria-hidden="true"
                      >
                        {action.firstApprover ? 'Check' : '1'}
                      </div>
                      <span className="az-body text-az-ink-muted">First Approval</span>
                      {action.firstApproverName && (
                        <span className="az-body text-az-ink">{action.firstApproverName}</span>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-az-glass-border" />
                    <div className="flex items-center gap-2">
                      <div
                        className={stepCircle(
                          action.secondApprover
                            ? 'done'
                            : action.status === 'first_approved'
                              ? 'waiting'
                              : 'idle'
                        )}
                        aria-hidden="true"
                      >
                        {action.secondApprover ? 'Check' : '2'}
                      </div>
                      <span className="az-body text-az-ink-muted">Second Approval</span>
                      {action.secondApproverName && (
                        <span className="az-body text-az-ink">{action.secondApproverName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(action.status === 'pending' || action.status === 'first_approved') && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(action.id)}
                      className="rounded-az-control bg-az-success-500/20 px-4 py-2 az-body-strong text-az-success-500 transition-colors hover:bg-az-success-500/30"
                    >
                      {action.status === 'pending' ? 'First Approval' : 'Second Approval'}
                    </button>
                    <button
                      onClick={() => handleReject(action.id, 'Rejected by admin')}
                      className="rounded-az-control bg-az-error-500/15 px-4 py-2 az-body-strong text-az-error-500 transition-colors hover:bg-az-error-500/25"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {action.rejectionReason && (
                  <p className="az-body mt-3 text-az-error-500">
                    Rejection reason: {action.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
