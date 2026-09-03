import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminCreator } from '@/lib/admin-types';

export default function CreatorsPage() {
  const queryClient = useQueryClient();
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['admin', 'creators'],
    queryFn: async () => {
      const res = await adminApi.getCreators();
      if (res.success && res.data) {
        const d = res.data as unknown as AdminCreator[] | { items: AdminCreator[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verify }: { id: string; verify: boolean }) =>
      verify ? adminApi.verifyCreator(id) : adminApi.unverifyCreator(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'creators'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Creators</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>{creators.length} registered creators</p>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {creators.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'var(--admin-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--admin-orange)',
                  }}
                >
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</p>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>{c.status}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--admin-text-muted)' }}>
                <span>{c.contentCount || 0} videos</span>
                <span>{c.subscriberCount || 0} subs</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: c.isVerified ? 'rgba(13,59,46,0.2)' : 'rgba(245,158,11,0.2)',
                    color: c.isVerified ? 'var(--admin-green)' : 'var(--admin-amber)',
                  }}
                >
                  {c.isVerified ? 'Verified' : 'Pending'}
                </span>
                <button
                  onClick={() => verifyMutation.mutate({ id: c.id, verify: !c.isVerified })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color: c.isVerified ? 'var(--admin-red)' : 'var(--admin-emerald)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {c.isVerified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
          {creators.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)', gridColumn: '1/-1' }}>
              No creators found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
