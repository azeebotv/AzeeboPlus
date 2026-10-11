'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Talent/Music Clearance Management (AZP-RIGHTS-003/004)
 * Admin page for managing talent clearances, music licenses, and rights clearances.
 */

interface TalentClearance {
  id: string;
  talentName: string;
  type: 'talent' | 'music' | 'likeness' | 'voice';
  contentId: string;
  contentTitle: string;
  universe: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiryDate: string;
  clearanceScope: 'worldwide' | 'region' | 'platform';
  regions: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface ClearanceStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expiringSoon: number;
}

export default function TalentClearancePage() {
  const [clearances, setClearances] = useState<TalentClearance[]>([]);
  const [stats, setStats] = useState<ClearanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClearances = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('q', searchQuery);

      const response = await apiFetch<TalentClearance[]>(
        `/api/v1/admin/rights/clearances?${params.toString()}`
      );

      if (response.success && response.data) {
        setClearances(response.data);

        // Calculate stats
        const all = response.data;
        setStats({
          total: all.length,
          pending: all.filter((c) => c.status === 'pending').length,
          approved: all.filter((c) => c.status === 'approved').length,
          rejected: all.filter((c) => c.status === 'rejected').length,
          expiringSoon: all.filter((c) => {
            const expiry = new Date(c.expiryDate);
            const now = new Date();
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            return expiry.getTime() - now.getTime() < thirtyDays && c.status === 'approved';
          }).length,
        });
      } else {
        setError(response.message || 'Failed to load clearances');
      }
    } catch {
      setError('Network error loading clearances');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchClearances();
  }, [fetchClearances]);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await apiFetch(`/api/v1/admin/rights/clearances/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchClearances();
    } catch {
      // Error handled by fetch
    }
  };

  const statusClasses = {
    pending: 'bg-az-warning-500/20 text-az-warning-400',
    approved: 'bg-az-success-500/20 text-az-success-400',
    rejected: 'bg-az-error-500/20 text-az-error-400',
    expired: 'bg-az-ink/10 text-az-ink-muted',
  };

  const typeIcons = {
    talent: 'User',
    music: 'Music',
    likeness: 'Camera',
    voice: 'Mic',
  };

  return (
    <div className="min-h-screen bg-az-surface-root p-6 text-az-ink">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="az-headline text-3xl text-az-ink">Talent & Music Clearance</h1>
          <p className="az-body mt-2 text-az-ink-muted">
            Manage talent clearances, music licenses, and rights for content
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="az-glass p-4">
              <p className="az-caption text-az-ink-muted">Total</p>
              <p className="az-section-title text-az-ink">{stats.total}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-caption text-az-ink-muted">Pending</p>
              <p className="az-section-title text-az-warning-500">{stats.pending}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-caption text-az-ink-muted">Approved</p>
              <p className="az-section-title text-az-success-400">{stats.approved}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-caption text-az-ink-muted">Rejected</p>
              <p className="az-section-title text-az-error-500">{stats.rejected}</p>
            </div>
            <div className="az-glass p-4">
              <p className="az-caption text-az-ink-muted">Expiring Soon</p>
              <p className="az-section-title text-az-flame">{stats.expiringSoon}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <input
              type="text"
              placeholder="Search by talent name, content title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="az-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="az-body rounded-az-control border border-az-glass-border bg-az-glass-fill px-4 py-2 text-az-ink"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="az-body rounded-az-control border border-az-glass-border bg-az-glass-fill px-4 py-2 text-az-ink"
          >
            <option value="all">All Types</option>
            <option value="talent">Talent</option>
            <option value="music">Music</option>
            <option value="likeness">Likeness</option>
            <option value="voice">Voice</option>
          </select>
        </div>

        {/* Clearances table */}
        {loading ? (
          <div className="az-body py-12 text-center text-az-ink-muted">Loading clearances...</div>
        ) : error ? (
          <div className="az-body py-12 text-center text-az-error-400">{error}</div>
        ) : clearances.length === 0 ? (
          <EmptyState
            icon="ClipboardList"
            title="No clearances found"
            description="No talent or music clearances have been submitted"
          />
        ) : (
          <div className="az-glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-az-glass-border">
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Type</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Talent</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Content</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Scope</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Status</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Expires</th>
                  <th className="az-overline px-4 py-3 text-left text-az-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-az-glass-border">
                {clearances.map((clearance) => (
                  <tr key={clearance.id} className="hover:bg-az-glass-fill">
                    <td className="az-body px-4 py-3 text-az-ink">
                      <span title={clearance.type}>{typeIcons[clearance.type]}</span>
                    </td>
                    <td className="az-body-strong px-4 py-3 text-az-ink">{clearance.talentName}</td>
                    <td className="az-body px-4 py-3 text-az-ink-muted">
                      {clearance.contentTitle}
                    </td>
                    <td className="az-body px-4 py-3 capitalize text-az-ink-muted">
                      {clearance.clearanceScope}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`az-caption inline-block rounded-az-pill px-2.5 py-1 capitalize ${statusClasses[clearance.status]}`}
                      >
                        {clearance.status}
                      </span>
                    </td>
                    <td className="az-body px-4 py-3 text-az-ink-muted">
                      {new Date(clearance.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {clearance.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(clearance.id, 'approved')}
                            className="rounded-az-control bg-az-success-500 px-3 py-1 text-xs text-az-ink transition-colors hover:bg-az-success-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(clearance.id, 'rejected')}
                            className="rounded-az-control bg-az-error-500 px-3 py-1 text-xs text-az-ink transition-colors hover:bg-az-error-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
