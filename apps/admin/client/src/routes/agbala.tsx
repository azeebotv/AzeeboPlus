import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { Storyworld } from '@/lib/admin-types';

type Tab = 'storyworlds' | 'characters' | 'paths' | 'quizzes';

export default function AgbalaPage() {
  const [tab, setTab] = useState<Tab>('storyworlds');
  const [selectedSw, setSelectedSw] = useState<string | undefined>();

  const storyworldsQ = useQuery({
    queryKey: ['admin', 'agbala', 'storyworlds'],
    queryFn: async () => {
      const res = await adminApi.getStoryworlds();
      if (res.success && res.data) {
        const d = res.data as Storyworld[] | { items: Storyworld[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
  });

  const charactersQ = useQuery({
    queryKey: ['admin', 'agbala', 'characters', selectedSw],
    queryFn: async () => {
      const res = await adminApi.getCharacters(selectedSw);
      if (res.success && res.data) {
        const d = res.data as { items: unknown[] };
        return d.items || [];
      }
      return [];
    },
    enabled: tab === 'characters',
  });

  const pathsQ = useQuery({
    queryKey: ['admin', 'agbala', 'paths'],
    queryFn: async () => {
      const res = await adminApi.getPaths();
      if (res.success && res.data) {
        const d = res.data as { items: unknown[] };
        return d.items || [];
      }
      return [];
    },
    enabled: tab === 'paths',
  });

  const quizzesQ = useQuery({
    queryKey: ['admin', 'agbala', 'quizzes', selectedSw],
    queryFn: async () => {
      const res = await adminApi.getQuizzes(selectedSw);
      if (res.success && res.data) {
        const d = res.data as { items: unknown[] };
        return d.items || [];
      }
      return [];
    },
    enabled: tab === 'quizzes',
  });

  const sw = storyworldsQ.data as Storyworld[] | undefined;
  const storyworlds = sw || [];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'storyworlds', label: 'Storyworlds', count: storyworlds.length },
    { key: 'characters', label: 'Characters' },
    { key: 'paths', label: 'Paths' },
    { key: 'quizzes', label: 'Quizzes' },
  ];

  const baseCard: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    border: '1px solid #2A1A1A',
    backgroundColor: 'rgba(26,10,10,0.5)',
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Agbala</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
        Interactive narrative engine — storyworlds, characters, paths, and quizzes
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: tab === t.key ? '#E8420A' : '#2A1A1A',
              background: tab === t.key ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: tab === t.key ? '#E8420A' : '#9A8A7A',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
            {t.count !== undefined && ` (${t.count})`}
          </button>
        ))}
      </div>

      {tab === 'storyworlds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storyworldsQ.isLoading ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : storyworlds.length === 0 ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
              No storyworlds yet.
            </p>
          ) : (
            storyworlds.map((s) => (
              <div key={s.id} style={baseCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {s.imageUrl && (
                    <img
                      src={s.imageUrl}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{s.title}</h3>
                    {s.description && (
                      <p style={{ color: '#9A8A7A', fontSize: 13, margin: 0 }}>{s.description}</p>
                    )}
                    <p style={{ color: '#6A5A4A', fontSize: 12, marginTop: 4 }}>
                      {s.characterCount || 0} characters · {s.pathCount || 0} paths
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: s.isPublished
                        ? 'rgba(13,59,46,0.2)'
                        : 'rgba(154,138,122,0.2)',
                      color: s.isPublished ? '#0D3B2E' : '#9A8A7A',
                    }}
                  >
                    {s.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'characters' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#9A8A7A', fontSize: 13, marginRight: 8 }}>
              Filter by storyworld:
            </label>
            <select
              value={selectedSw || ''}
              onChange={(e) => setSelectedSw(e.target.value || undefined)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                background: '#140808',
                color: '#F5F0EB',
                fontSize: 13,
              }}
            >
              <option value="">All storyworlds</option>
              {storyworlds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {charactersQ.isLoading ? (
              <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : (
              (
                charactersQ.data as {
                  id: string;
                  name: string;
                  path: string;
                  storyworldTitle?: string;
                }[]
              )?.map((c) => (
                <div key={c.id} style={baseCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.name}</h3>
                      <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                        {c.path} · {c.storyworldTitle || 'Unknown world'}
                      </p>
                    </div>
                  </div>
                </div>
              )) || (
                <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No characters.</p>
              )
            )}
          </div>
        </div>
      )}

      {tab === 'paths' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pathsQ.isLoading ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : (
            (
              pathsQ.data as { id: string; name: string; totalSteps: number; color?: string }[]
            )?.map((p) => (
              <div key={p.id} style={baseCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: p.color || '#E8420A',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</h3>
                    <p style={{ color: '#9A8A7A', fontSize: 12 }}>{p.totalSteps} steps</p>
                  </div>
                </div>
              </div>
            )) || <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No paths.</p>
          )}
        </div>
      )}

      {tab === 'quizzes' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#9A8A7A', fontSize: 13, marginRight: 8 }}>
              Filter by storyworld:
            </label>
            <select
              value={selectedSw || ''}
              onChange={(e) => setSelectedSw(e.target.value || undefined)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                background: '#140808',
                color: '#F5F0EB',
                fontSize: 13,
              }}
            >
              <option value="">All storyworlds</option>
              {storyworlds.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quizzesQ.isLoading ? (
              <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
            ) : (
              (quizzesQ.data as { id: string; title: string; questionCount: number }[])?.map(
                (q) => (
                  <div key={q.id} style={baseCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                          {q.title}
                        </h3>
                        <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                          {q.questionCount} questions
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ) || <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No quizzes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
