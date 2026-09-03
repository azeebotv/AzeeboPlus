import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { RealityShow } from '@/lib/admin-types';

export default function RealityPage() {
  const queryClient = useQueryClient();
  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['admin', 'reality-shows'],
    queryFn: async () => {
      const res = await adminApi.getRealityShows();
      if (res.success && res.data) {
        const d = res.data as RealityShow[] | { items: RealityShow[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateRealityShowStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reality-shows'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reality Shows</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>{shows.length} shows</p>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shows.map((show) => (
            <div
              key={show.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{show.title}</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  {show.episodeCount || 0} episodes · Season {show.seasonCount || 1}
                </p>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor:
                    show.status === 'live' ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)',
                  color: show.status === 'live' ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                }}
              >
                {show.status}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {show.status !== 'live' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: show.id, status: 'live' })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--admin-green)',
                      background: 'rgba(13,59,46,0.3)',
                      color: 'var(--admin-emerald)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Activate
                  </button>
                )}
                {show.status !== 'ended' && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: show.id, status: 'ended' })}
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
                    End
                  </button>
                )}
              </div>
            </div>
          ))}
          {shows.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No reality shows found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
