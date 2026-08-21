'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

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

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  const typeIcons = {
    talent: '👤',
    music: '🎵',
    likeness: '📷',
    voice: '🎙️',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Talent & Music Clearance</h1>
          <p className="text-muted-foreground mt-2">
            Manage talent clearances, music licenses, and rights for content
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by talent name, content title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-card border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg text-foreground"
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
            className="px-4 py-2 bg-card border rounded-lg text-foreground"
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
          <div className="text-center py-12 text-muted-foreground">Loading clearances...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : clearances.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No clearances found</div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Talent</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Content</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Scope</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Expires</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clearances.map((clearance) => (
                  <tr key={clearance.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span title={clearance.type}>{typeIcons[clearance.type]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{clearance.talentName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{clearance.contentTitle}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{clearance.clearanceScope}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[clearance.status]}`}>
                        {clearance.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(clearance.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {clearance.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(clearance.id, 'approved')}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(clearance.id, 'rejected')}
                            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
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
