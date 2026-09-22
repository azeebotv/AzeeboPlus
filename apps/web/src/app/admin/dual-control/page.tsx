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
    pending: 'bg-yellow-100 text-yellow-800',
    first_approved: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    executed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dual-Control Actions</h1>
            <p className="text-muted-foreground mt-2">
              High-risk operations requiring two-person approval before execution
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {/* Create-request form */}
        {showForm && (
          <div className="bg-card rounded-xl border p-6 mb-8">
            <h2 className="font-semibold text-foreground mb-4">New Dual-Control Request</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Action type *
                </label>
                <select
                  value={form.actionType}
                  onChange={(e) => setForm((prev) => ({ ...prev, actionType: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                >
                  {ACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Target user IDs (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={form.targetUserIds}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, targetUserIds: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                  placeholder="user-id-1, user-id-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={2000}
                  className="w-full px-4 py-2 bg-background border rounded-lg text-foreground h-24 resize-none"
                  placeholder="What high-risk operation needs approval, and why?"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.description.length}/2000
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Amount (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Currency {form.amount.trim() ? '*' : '(optional)'}
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  maxLength={3}
                  className="w-full px-4 py-2 bg-background border rounded-lg text-foreground"
                  placeholder="NGN"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive mt-4">{formError}</p>
            )}

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-muted disabled:text-muted-foreground text-white text-sm px-6 py-2 rounded-lg"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <p className="text-xs text-muted-foreground">
                The requesting admin cannot approve their own request — a second admin must
                approve.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Pending Actions</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Awaiting First Approval</p>
              <p className="text-2xl font-bold text-blue-600">{stats.awaitingFirstApproval}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Awaiting Second Approval</p>
              <p className="text-2xl font-bold text-orange-600">{stats.awaitingSecondApproval}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Executed This Month</p>
              <p className="text-2xl font-bold text-green-600">{stats.executedThisMonth}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg text-foreground"
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
          <div className="text-center py-12 text-muted-foreground">Loading actions...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : actions.length === 0 ? (
          <EmptyState
            icon="Lock"
            title="No dual-control actions found"
            description="No dual-control actions are pending review"
          />
        ) : (
          <div className="grid gap-4">
            {actions.map((action) => (
              <div key={action.id} className="bg-card rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{actionTypeLabels[action.actionType]}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[action.status]}`}
                      >
                        {action.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{action.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      Requested by {action.requestedByName} •{' '}
                      {new Date(action.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  {action.amount && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        {action.amount.toLocaleString()} {action.currency || 'NGN'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Approval progress */}
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          action.firstApprover ? 'bg-green-600 text-white' : 'bg-gray-300'
                        }`}
                      >
                        {action.firstApprover ? 'Check' : '1'}
                      </div>
                      <span className="text-muted-foreground">First Approval</span>
                      {action.firstApproverName && (
                        <span className="text-foreground">{action.firstApproverName}</span>
                      )}
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          action.secondApprover
                            ? 'bg-green-600 text-white'
                            : action.status === 'first_approved'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-300'
                        }`}
                      >
                        {action.secondApprover ? 'Check' : '2'}
                      </div>
                      <span className="text-muted-foreground">Second Approval</span>
                      {action.secondApproverName && (
                        <span className="text-foreground">{action.secondApproverName}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(action.status === 'pending' || action.status === 'first_approved') && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(action.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      {action.status === 'pending' ? 'First Approval' : 'Second Approval'}
                    </button>
                    <button
                      onClick={() => handleReject(action.id, 'Rejected by admin')}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {action.rejectionReason && (
                  <p className="text-sm text-destructive mt-3">
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
