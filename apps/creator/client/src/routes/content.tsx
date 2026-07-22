import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { ContentItem, ContentList } from '@/lib/creator-types';

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'video' });

  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'content', page, statusFilter],
    queryFn: async () => {
      const res = await creatorApi.getContent(page, 20, statusFilter || undefined);
      return res.success ? (res.data as ContentList) : null;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => creatorApi.createContent(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }); setShowCreate(false); setForm({ title: '', description: '', type: 'video' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<ContentItem> }) => creatorApi.updateContent(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }); setEditItem(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => creatorApi.deleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'content'] }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Content</h1>
          <p style={{ color: '#9A8A7A', fontSize: 14 }}>{total} items</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          + New Content
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['', 'draft', 'published', 'archived'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{ padding: '8px 16px', borderRadius: 999, border: statusFilter === s ? 'none' : '1px solid #2A1A1A', background: statusFilter === s ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: statusFilter === s ? '#fff' : '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
            {s || 'all'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No content found</p>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['Title', 'Type', 'Status', 'Views', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#9A8A7A', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.title}</td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A', textTransform: 'capitalize' }}>{item.type}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: item.status === 'published' ? 'rgba(13,59,46,0.2)' : item.status === 'draft' ? 'rgba(245,158,11,0.2)' : 'rgba(154,138,122,0.2)', color: item.status === 'published' ? '#0D3B2E' : item.status === 'draft' ? '#F59E0B' : '#9A8A7A', textTransform: 'capitalize' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9A8A7A' }}>{(item.viewCount || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditItem(item); setForm({ title: item.title, description: item.description || '', type: item.type }); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => { if (confirm('Delete this content?')) deleteMutation.mutate(item.id); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CC1C1C', background: 'transparent', color: '#CC1C1C', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: page === 1 ? '#4A3A3A' : '#E8420A', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
            <span style={{ padding: '8px 16px', color: '#9A8A7A', fontSize: 13 }}>Page {page} of {Math.ceil(total / 20) || 1}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: page >= Math.ceil(total / 20) ? '#4A3A3A' : '#E8420A', cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer' }}>Next</button>
          </div>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <div style={{ width: 500, maxWidth: '90%', backgroundColor: '#1A0A0A', border: '1px solid #2A1A1A', borderRadius: 16, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Create Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14 }} />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14, resize: 'vertical' }} />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14 }}>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Document</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.title} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{createMutation.isPending ? 'Creating...' : 'Create'}</button>
                <button onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditItem(null)}>
          <div style={{ width: 500, maxWidth: '90%', backgroundColor: '#1A0A0A', border: '1px solid #2A1A1A', borderRadius: 16, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Edit Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14 }} />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => updateMutation.mutate({ id: editItem.id, data: { title: form.title, description: form.description } })} disabled={updateMutation.isPending} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setEditItem(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
