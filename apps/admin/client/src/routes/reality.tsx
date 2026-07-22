import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { RealityShow } from '@/lib/admin-types';

export default function RealityPage() {
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

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reality Shows</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{shows.length} shows</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shows.map((show) => (
            <div key={show.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{show.title}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>{show.episodeCount || 0} episodes · Season {show.seasonCount || 1}</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: show.status === 'live' ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)', color: show.status === 'live' ? '#0D3B2E' : '#9A8A7A' }}>
                {show.status}
              </span>
            </div>
          ))}
          {shows.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No reality shows found</p>}
        </div>
      )}
    </div>
  );
}
