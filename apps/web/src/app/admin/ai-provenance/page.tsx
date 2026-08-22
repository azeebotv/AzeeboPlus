'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

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
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_review: 'bg-orange-100 text-orange-800',
  };

  const typeIcons: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🔊',
    text: '📝',
    music: '🎵',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AI Provenance Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage AI-generated content provenance, attribution, and clearances
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border rounded-lg text-foreground"
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
            className="px-4 py-2 bg-card border rounded-lg text-foreground"
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
          <div className="text-center py-12 text-muted-foreground">Loading records...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No AI provenance records found
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div key={record.id} className="bg-card rounded-xl border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeIcons[record.generationType]}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{record.contentTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {record.aiTool} / {record.aiModel}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusColors[record.clearanceStatus]}`}
                  >
                    {record.clearanceStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Restrictions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {record.attributionRequired && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Attribution Required
                    </span>
                  )}
                  {record.talentRestriction && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Talent Restricted
                    </span>
                  )}
                  {record.voiceRestriction && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      Voice Restricted
                    </span>
                  )}
                  {record.likenessRestriction && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Likeness Restricted
                    </span>
                  )}
                  {record.vendorIndependenceVerified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Vendor Independent ✓
                    </span>
                  )}
                </div>

                {/* Actions */}
                {record.clearanceStatus === 'pending' ||
                record.clearanceStatus === 'needs_review' ? (
                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleClearance(record.id, 'approved', 'Approved by admin')}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleClearance(record.id, 'rejected', 'Rejected - needs revision')
                      }
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg"
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
