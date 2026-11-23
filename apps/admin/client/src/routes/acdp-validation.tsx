import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AcdpPackageItem } from '@/lib/admin-types';
import { assertSuccess, requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import QueryErrorBanner from '@/components/QueryErrorBanner';
import { Pagination } from '@/components/ui';

export default function AcdpValidationPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'acdp-packages', page],
    queryFn: async () => {
      const res = await adminApi.getAcdpPackages(page, 20);
      return unwrapList<AcdpPackageItem>(requireData(res, null));
    },
  });

  const packages = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const validateMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.validateAcdpPackage(id)),
    onSuccess: () => {
      setActionError('');
      setActionSuccess('Automated validation check completed successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'acdp-packages'] });
    },
    onError: (e: Error) => setActionError(e.message || 'Validation failed'),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.approveAcdpPackage(id)),
    onSuccess: () => {
      setActionError('');
      setActionSuccess('ACDP Package approved for publication.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'acdp-packages'] });
    },
    onError: (e: Error) => setActionError(e.message || 'Failed to approve package'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      assertSuccess(await adminApi.rejectAcdpPackage(id, reason)),
    onSuccess: () => {
      setActionError('');
      setActionSuccess('ACDP Package rejected and returned with remediation notes.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'acdp-packages'] });
      setActiveRejectId(null);
      setRejectReason('');
    },
    onError: (e: Error) => setActionError(e.message || 'Failed to reject package'),
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="checkCircle" size={28} color="var(--admin-orange)" />
          <span>Content Clearance & Technical Validation (ACDP)</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>
          Verify technical delivery standards, audio loudness compliance, and category suitability before publishing.
        </p>
      </div>

      {actionError && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid rgba(204,28,28,0.4)',
            backgroundColor: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid rgba(46,160,67,0.4)',
            backgroundColor: 'rgba(46,160,67,0.1)',
            color: '#3fb950',
            fontSize: 13,
          }}
        >
          {actionSuccess}
        </div>
      )}

      {isError && (
        <QueryErrorBanner
          title="Failed to load ACDP packages"
          detail={(error as Error)?.message}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
          Loading ACDP packages...
        </div>
      ) : packages.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            backgroundColor: 'var(--admin-card-bg)',
            borderRadius: 16,
            border: '1px solid var(--admin-border)',
          }}
        >
          <Icon name="checkCircle" size={40} color="#3fb950" />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
            All ACDP Packages Validated
          </h3>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            No content packages are currently awaiting validation.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(255,107,0,0.15)',
                        color: 'var(--admin-orange)',
                      }}
                    >
                      {pkg.universe}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 6, color: 'var(--admin-text)' }}>
                      {pkg.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 8,
                      backgroundColor:
                        pkg.status === 'compliant'
                          ? 'rgba(46,160,67,0.15)'
                          : pkg.status === 'rejected'
                          ? 'rgba(204,28,28,0.15)'
                          : 'rgba(245,158,11,0.15)',
                      color:
                        pkg.status === 'compliant'
                          ? '#3fb950'
                          : pkg.status === 'rejected'
                          ? 'var(--admin-red)'
                          : '#f59e0b',
                    }}
                  >
                    {pkg.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Universe Fit Score */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Universe Fit Score</span>
                    <span style={{ fontWeight: 700, color: pkg.universeFitScore >= 70 ? '#3fb950' : '#f59e0b' }}>
                      {pkg.universeFitScore}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pkg.universeFitScore}%`,
                        backgroundColor: pkg.universeFitScore >= 70 ? '#3fb950' : '#f59e0b',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>

                {/* Component Checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{pkg.masterVideoValid ? '✅' : '❌'}</span>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Master Video</span>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{pkg.verticalDerivativeValid ? '✅' : '❌'}</span>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Vertical Video (9:16 Shorts/Reels)</span>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{pkg.audioTracksValid ? '✅' : '❌'}</span>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Audio Loudness (-24 LUFS / EBU R128)</span>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{pkg.subtitlesValid ? '✅' : '❌'}</span>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Subtitles & Captions (VTT)</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 14 }}>
                {activeRejectId === pkg.id ? (
                  <div>
                    <textarea
                      placeholder="Enter remediation requirements for creator/studio..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{
                        width: '100%',
                        height: 70,
                        backgroundColor: 'var(--admin-bg)',
                        border: '1px solid var(--admin-border)',
                        borderRadius: 8,
                        padding: 8,
                        fontSize: 12,
                        color: 'var(--admin-text)',
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setActiveRejectId(null)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          backgroundColor: 'transparent',
                          color: 'var(--admin-text-muted)',
                          border: '1px solid var(--admin-border)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!rejectReason.trim()}
                        onClick={() => rejectMutation.mutate({ id: pkg.id, reason: rejectReason.trim() })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          backgroundColor: 'var(--admin-red)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: !rejectReason.trim() ? 0.5 : 1,
                        }}
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => validateMutation.mutate(pkg.id)}
                      disabled={validateMutation.isPending}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'rgba(255,107,0,0.1)',
                        color: 'var(--admin-orange)',
                        border: '1px solid rgba(255,107,0,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      Verify Integrity Check
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(pkg.id)}
                      disabled={approveMutation.isPending}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: '#2ea043',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setActiveRejectId(pkg.id);
                        setRejectReason('');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'rgba(204,28,28,0.1)',
                        color: 'var(--admin-red)',
                        border: '1px solid rgba(204,28,28,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ marginTop: 24 }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
