'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageIcon, Film, Volume2, FileText, Music, type LucideIcon } from 'lucide-react';

/**
 * AI Provenance Reference Management (AZP-RIGHTS-005)
 * Admin page for managing AI-generated content provenance, attribution, and clearance.
 */

interface AiProvenance {
  id: string;
  contentId: string;
  contentTitle: string;
  aiTool: string;
  aiModel: string;
  generationType: 'image' | 'video' | 'audio' | 'text' | 'music';
  attributionRequired: boolean;
  talentRestriction: boolean;
  voiceRestriction: boolean;
  likenessRestriction: boolean;
  clearanceStatus: 'pending' | 'approved' | 'rejected' | 'needs_review';
  clearanceNotes: string;
  vendorIndependenceVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AiProvenancePage() {
  const [records, setRecords] = useState<AiProvenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await apiFetch<AiProvenance[]>(
        `/api/v1/admin/ai-provenance?${params.toString()}`
      );

      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        setError(response.message || 'Failed to load AI provenance records');
      }
    } catch {
      setError('Network error loading records');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleClearance = async (id: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      await apiFetch(`/api/v1/admin/ai-provenance/${id}/clearance`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
      fetchRecords();
    } catch {
      // Error handled by fetch
    }
  };

  const statusColors = {
    pending: 'bg-az-warning-500/20 text-az-warning-500',
    approved: 'bg-az-success-500/20 text-az-success-500',
    rejected: 'bg-az-error-500/15 text-az-error-500',
    needs_review: 'bg-az-scarlet/15 text-az-flame',
  };

  const restrictionChip = (tone: string) => `rounded-az-control px-2 py-1 az-micro-label ${tone}`;

  const typeIcons: Record<string, LucideIcon> = {
    image: ImageIcon,
    video: Film,
    audio: Volume2,
    text: FileText,
    music: Music,
  };

  return (
    <div className="min-h-screen bg-az-surface-root p-6 text-az-ink">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="az-heading text-az-ink">AI Provenance Management</h1>
          <p className="az-lead mt-2 text-az-ink-muted">
            Track and manage AI-generated content provenance, attribution, and clearances
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="az-input max-w-xs"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_review">Needs Review</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="az-input max-w-xs"
          >
            <option value="all">All Types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="text">Text</option>
            <option value="music">Music</option>
          </select>
        </div>

        {loading ? (
          <div className="az-lead py-12 text-center text-az-ink-muted">Loading records...</div>
        ) : error ? (
          <div className="az-lead py-12 text-center text-az-error-500">{error}</div>
        ) : records.length === 0 ? (
          <EmptyState
            icon="Bot"
            title="No AI provenance records found"
            description="No AI-generated content provenance records yet"
          />
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div key={record.id} className="az-glass p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const IconComp = typeIcons[record.generationType] || FileText;
                      return (
                        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-az-card border border-az-glass-border bg-az-flame/10 text-az-flame">
                          <IconComp size={20} strokeWidth={1.75} />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="az-body-strong text-az-ink">{record.contentTitle}</h3>
                      <p className="az-caption text-az-ink-muted">
                        {record.aiTool} / {record.aiModel}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-az-pill px-2.5 py-1 az-micro-label ${statusColors[record.clearanceStatus]}`}
                  >
                    {record.clearanceStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Restrictions */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {record.attributionRequired && (
                    <span
                      className={restrictionChip('bg-az-secondary-500/20 text-az-secondary-500')}
                    >
                      Attribution Required
                    </span>
                  )}
                  {record.talentRestriction && (
                    <span
                      className={restrictionChip('bg-az-universe-games/20 text-az-universe-games')}
                    >
                      Talent Restricted
                    </span>
                  )}
                  {record.voiceRestriction && (
                    <span className={restrictionChip('bg-az-flame/15 text-az-flame')}>
                      Voice Restricted
                    </span>
                  )}
                  {record.likenessRestriction && (
                    <span className={restrictionChip('bg-az-error-500/15 text-az-error-500')}>
                      Likeness Restricted
                    </span>
                  )}
                  {record.vendorIndependenceVerified && (
                    <span className={restrictionChip('bg-az-success-500/20 text-az-success-500')}>
                      Vendor Independent Check
                    </span>
                  )}
                </div>

                {/* Actions */}
                {record.clearanceStatus === 'pending' ||
                record.clearanceStatus === 'needs_review' ? (
                  <div className="mt-4 flex gap-3 border-t border-az-glass-border pt-4">
                    <button
                      onClick={() => handleClearance(record.id, 'approved', 'Approved by admin')}
                      className="rounded-az-control bg-az-success-500/20 px-4 py-2 az-body-strong text-az-success-500 transition-colors hover:bg-az-success-500/30"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleClearance(record.id, 'rejected', 'Rejected - needs revision')
                      }
                      className="rounded-az-control bg-az-error-500/15 px-4 py-2 az-body-strong text-az-error-500 transition-colors hover:bg-az-error-500/25"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
