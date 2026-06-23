'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminContentPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadContent();
  }, [isAuthenticated, user]);

  const loadContent = async () => {
    try {
      const response = await api.admin.getContent();
      if (response.success && response.data) {
        const data = response.data as any;
        setContent(Array.isArray(data) ? data : data.items || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const filtered = content.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Management</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{content.length} total content items</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search content..." style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 12, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'video', 'audio', 'article'].map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} style={{ padding: '8px 16px', borderRadius: 999, border: typeFilter === type ? 'none' : '1px solid #2A1A1A', background: typeFilter === type ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: typeFilter === type ? '#fff' : '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
              {item.thumbnail && <img src={item.thumbnail} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
              <div style={{ padding: 16 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9A8A7A' }}>{item.type || 'video'}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: item.status === 'published' ? 'rgba(13,59,46,0.2)' : 'rgba(245,158,11,0.2)', color: item.status === 'published' ? '#0D3B2E' : '#F59E0B' }}>
                    {item.status || 'draft'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>No content found</p>}
        </div>
      )}
    </AdminLayout>
  );
}
