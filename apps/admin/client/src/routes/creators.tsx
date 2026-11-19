import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminCreator } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

export default function CreatorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const { data: creators = [], isLoading, isError, error, refetch } = useQuery<AdminCreator[]>({
    queryKey: ['admin', 'creators'],
    queryFn: async () => {
      const res = await adminApi.getCreators(1, 100);
      if (!res.success) throw new Error(res.message || 'Failed to load creators');
      if (res.data) {
        const d = res.data as unknown as
          | AdminCreator[]
          | { items?: AdminCreator[]; users?: AdminCreator[] };
        const list = Array.isArray(d) ? d : d.users || d.items || [];
        return list.map((item: any) => ({
          ...item,
          name: item.name || item.displayName || item.email?.split('@')[0] || 'Creator',
          status: item.status || (item.isActive ? 'active' : 'inactive'),
        }));
      }
      return [];
    },
  });

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const verifyMutation = useMutation({
    mutationFn: async ({ id, verify }: { id: string; verify: boolean }) => {
      setVerifyingId(id);
      return verify ? adminApi.verifyCreator(id) : adminApi.unverifyCreator(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'creators'] }),
    onSettled: () => setVerifyingId(null),
  });

  const filteredCreators = useMemo(() => {
    return (creators ?? []).filter((c) => {
      const matchesSearch =
        !search ||
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && c.isVerified) ||
        (statusFilter === 'pending' && !c.isVerified);
      return matchesSearch && matchesStatus;
    });
  }, [creators, search, statusFilter]);

  const verifiedCount = (creators ?? []).filter((c) => c.isVerified).length;
  const pendingCount = (creators ?? []).length - verifiedCount;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
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
              gap: 12,
            }}
          >
            <Icon name="users" size={28} color="var(--admin-orange)" />
            <span>Creators</span>
          </h1>
          {!isLoading && !isError && (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
              {creators.length} registered creators · {verifiedCount} verified · {pendingCount} pending verification
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 240 }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', backgroundColor: 'var(--admin-surface)', borderRadius: 8, padding: 3 }}>
            {(['all', 'verified', 'pending'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: statusFilter === filter ? 'var(--admin-orange)' : 'transparent',
                  color: statusFilter === filter ? 'white' : 'var(--admin-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 150ms ease',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading creators...</p>
      ) : isError ? (
        <div
          style={{
            padding: 32,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.08)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--admin-red)', fontWeight: 600, marginBottom: 8 }}>Failed to load creators</p>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
            {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-red)',
              backgroundColor: 'transparent',
              color: 'var(--admin-red)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16,
          }}
        >
          {filteredCreators.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(232,66,10,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--admin-orange)',
                      flexShrink: 0,
                    }}
                  >
                    {c.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.name}
                    </p>
                    <p
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.email || c.status}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 14,
                  }}
                >
                  <span>{c.contentCount || 0} videos</span>
                  <span>{c.subscriberCount || 0} subs</span>
                  {c.walletBalance !== undefined && <span>₦{(c.walletBalance || 0).toLocaleString()}</span>}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: c.isVerified ? 'rgba(13,59,46,0.3)' : 'rgba(245,158,11,0.2)',
                    color: c.isVerified ? 'var(--admin-green)' : 'var(--admin-amber)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: c.isVerified ? 'var(--admin-green)' : 'var(--admin-amber)',
                    }}
                  />
                  {c.isVerified ? 'Verified' : 'Pending'}
                </span>
                <button
                  disabled={verifyingId === c.id}
                  onClick={() => verifyMutation.mutate({ id: c.id, verify: !c.isVerified })}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color: c.isVerified ? 'var(--admin-red)' : 'var(--admin-emerald)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: verifyingId === c.id ? 'wait' : 'pointer',
                    opacity: verifyingId === c.id ? 0.5 : 1,
                    transition: 'all 150ms ease',
                  }}
                >
                  {verifyingId === c.id ? 'Updating…' : c.isVerified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
          {filteredCreators.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                padding: 40,
                color: 'var(--admin-text-muted)',
                gridColumn: '1/-1',
              }}
            >
              {search ? `No creators matching "${search}"` : 'No creators found'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
