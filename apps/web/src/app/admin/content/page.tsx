'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import type { ContentItem, PaginatedResponse } from '@/lib/api/base';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug?: string;
  contentCount?: number;
  description?: string;
}

interface Tag {
  id: string;
  name: string;
  contentCount?: number;
}

interface ContentStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  viewsByUniverse: { universe: string; views: number; count: number }[];
}

type SortField = 'title' | 'status' | 'createdAt' | 'views';
type SortDir = 'asc' | 'desc';
type Tab = 'content' | 'categories' | 'tags';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['all', 'published', 'draft', 'archived'] as const;
const PAGE_SIZE = 12;

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
}

function statusColor(s: string) {
  if (s === 'published') return { bg: 'rgba(13,59,46,0.25)', fg: '#2ECC71' };
  if (s === 'archived') return { bg: 'rgba(100,100,100,0.25)', fg: '#9A8A7A' };
  return { bg: 'rgba(245,158,11,0.2)', fg: '#F59E0B' };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AdminContentPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  // ── Filter / sort state ──
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [universeFilter, setUniverseFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<Tab>('content');

  // ── Modal / panel state ──
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', thumbnail: '', mediaUrl: '',
    status: 'draft', universeId: '', categoryIds: [] as string[], tags: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // ── Category / Tag modals ──
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' });
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '' });

  // ── Confirm delete ──
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'item' | 'bulk' | 'cat' | 'tag'; id?: string; ids?: string[] } | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // ─── Debounce search ────────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Data queries ──────────────────────────────────────────────────────

  const { data: contentData, isLoading: contentLoading, error: contentError } = useQuery({
    queryKey: ['admin', 'content', page, debouncedSearch, statusFilter, universeFilter, sortField, sortDir],
    queryFn: async (): Promise<{ items: ContentItem[]; total: number }> => {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (universeFilter) params.universeId = universeFilter;
      const res = await api.admin.getContentList(params);
      if (res.success && res.data) {
        const d = res.data as PaginatedResponse<ContentItem>;
        let items = d.items || [];
        items = [...items].sort((a, b) => {
          let cmp = 0;
          if (sortField === 'title') cmp = (a.title || '').localeCompare(b.title || '');
          else if (sortField === 'status') cmp = (a.status || '').localeCompare(b.status || '');
          else if (sortField === 'views') cmp = (a.views || 0) - (b.views || 0);
          else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return sortDir === 'asc' ? cmp : -cmp;
        });
        return { items, total: d.total || 0 };
      }
      return { items: [], total: 0 };
    },
    enabled: isEnabled,
  });

  const { data: auxData } = useQuery({
    queryKey: ['admin', 'content-aux'],
    queryFn: async () => {
      const [catRes, tagRes, statsRes, univRes] = await Promise.allSettled([
        api.admin.getContentCategories(),
        api.admin.getContentTags(),
        api.admin.getContentStats(),
        api.admin.getAllUniverses(),
      ]);
      const result: { categories: Category[]; tags: Tag[]; stats: ContentStats | null; universes: { id: string; name: string }[] } = { categories: [], tags: [], stats: null, universes: [] };
      if (catRes.status === 'fulfilled' && catRes.value.success && catRes.value.data) {
        const d = catRes.value.data as Category[] | { items?: Category[] };
        result.categories = Array.isArray(d) ? d : d.items || [];
      }
      if (tagRes.status === 'fulfilled' && tagRes.value.success && tagRes.value.data) {
        const d = tagRes.value.data as Tag[] | { items?: Tag[] };
        result.tags = Array.isArray(d) ? d : d.items || [];
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        result.stats = statsRes.value.data as unknown as ContentStats;
      }
      if (univRes.status === 'fulfilled' && univRes.value.success && univRes.value.data) {
        const d = univRes.value.data as Array<{ id: string; name: string }> | { items?: Array<{ id: string; name: string }> };
        const arr = Array.isArray(d) ? d : d.items || [];
        result.universes = arr.map((u) => ({ id: u.id, name: u.name }));
      }
      return result;
    },
    enabled: isEnabled,
  });

  const categories = auxData?.categories || [];
  const tags = auxData?.tags || [];
  const stats = auxData?.stats || null;
  const universes = auxData?.universes || [];
  const content = contentData?.items || [];
  const total = contentData?.total || 0;
  const isLoading = contentLoading;

  // ─── Selection logic ───────────────────────────────────────────────────

  const allSelected = content.length > 0 && content.every(c => selectedIds.has(c.id));
  const someSelected = content.some(c => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (allSelected) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(content.map(c => c.id))); }
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Bulk actions ──────────────────────────────────────────────────────

  const handleBulkPublish = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const res = await api.admin.bulkUpdateContentStatus(ids, 'published');
      if (res.success) { showToast(`${ids.length} item(s) published`); setSelectedIds(new Set()); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
      else showToast(res.message || 'Failed', false);
    } catch { showToast('Error publishing', false); }
  };
  const handleBulkUnpublish = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const res = await api.admin.bulkUpdateContentStatus(ids, 'draft');
      if (res.success) { showToast(`${ids.length} item(s) unpublished`); setSelectedIds(new Set()); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
      else showToast(res.message || 'Failed', false);
    } catch { showToast('Error', false); }
  };
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const res = await api.admin.bulkDeleteContent(ids);
      if (res.success) { showToast(`${ids.length} item(s) deleted`); setSelectedIds(new Set()); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
      else showToast(res.message || 'Failed', false);
    } catch { showToast('Error deleting', false); }
    setConfirmDelete(null);
  };

  // ─── Single item actions ────────────────────────────────────────────────

  const openEdit = async (item: ContentItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      thumbnail: item.thumbnail || '',
      mediaUrl: item.mediaUrl || '',
      status: item.status || 'draft',
      universeId: item.universeId || item.universe?.id || '',
      categoryIds: (item.categories || []).map(c => c.id),
      tags: (item.tags || []).map(t => t.name),
    });
    setShowEditPanel(true);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      const res = await api.admin.updateContentItem(editItem.id, {
        title: editForm.title,
        description: editForm.description,
        thumbnail: editForm.thumbnail,
        mediaUrl: editForm.mediaUrl,
        status: editForm.status,
        universeId: editForm.universeId,
        categoryIds: editForm.categoryIds,
        tags: editForm.tags,
      });
      if (res.success) { showToast('Content updated'); setShowEditPanel(false); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
      else showToast(res.message || 'Failed to update', false);
    } catch { showToast('Error saving', false); }
    finally { setIsSaving(false); }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await api.admin.deleteContentItem(id);
      if (res.success) { showToast('Content deleted'); setConfirmDelete(null); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
      else showToast(res.message || 'Failed', false);
    } catch { showToast('Error deleting', false); }
  };

  const handleQuickPublish = async (id: string) => {
    const res = await api.admin.publishContent(id);
    if (res.success) { showToast('Published'); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
  };
  const handleQuickUnpublish = async (id: string) => {
    const res = await api.admin.unpublishContent(id);
    if (res.success) { showToast('Unpublished'); queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }); }
  };

  // ─── Category CRUD ─────────────────────────────────────────────────────

  const handleSaveCategory = async () => {
    try {
      if (editingCat) {
        await api.admin.updateContentCategory(editingCat.id, catForm);
        showToast('Category updated');
      } else {
        await api.admin.createContentCategory(catForm);
        showToast('Category created');
      }
      setShowCatModal(false); setEditingCat(null); setCatForm({ name: '', slug: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-aux'] });
    } catch { showToast('Error saving category', false); }
  };
  const handleDeleteCategory = async (id: string) => {
    const res = await api.admin.deleteContentCategory(id);
    if (res.success) { showToast('Category deleted'); setConfirmDelete(null); queryClient.invalidateQueries({ queryKey: ['admin', 'content-aux'] }); }
    else showToast(res.message || 'Failed', false);
  };

  // ─── Tag CRUD ──────────────────────────────────────────────────────────

  const handleCreateTag = async () => {
    if (!tagForm.name.trim()) return;
    try {
      await api.admin.createContentTag({ name: tagForm.name.trim() });
      showToast('Tag created'); setShowTagModal(false); setTagForm({ name: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'content-aux'] });
    } catch { showToast('Error creating tag', false); }
  };
  const handleDeleteTag = async (id: string) => {
    const res = await api.admin.deleteContentTag(id);
    if (res.success) { showToast('Tag deleted'); setConfirmDelete(null); queryClient.invalidateQueries({ queryKey: ['admin', 'content-aux'] }); }
    else showToast(res.message || 'Failed', false);
  };

  // ─── Sort toggle ────────────────────────────────────────────────────────

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };
  const sortIcon = (field: SortField) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  // ─── Pagination ──────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: toast.ok ? 'linear-gradient(135deg, #0D3B2E, #1A5C45)' : 'linear-gradient(135deg, #5C1A1A, #7A2A2A)',
          color: '#F5F0EB', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Content Management</h1>
          <p style={{ color: '#9A8A7A', fontSize: 14 }}>{total} content items</p>
        </div>
        <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '' }); setShowCatModal(true); }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          + New Content
        </button>
      </div>

      {/* ── Stats Panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: stats?.total ?? total, color: '#F5F0EB' },
          { label: 'Published', value: stats?.published ?? 0, color: '#2ECC71' },
          { label: 'Draft', value: stats?.draft ?? 0, color: '#F59E0B' },
          { label: 'Archived', value: stats?.archived ?? 0, color: '#9A8A7A' },
        ].map(s => (
          <div key={s.label} className="az-glass" style={{ padding: 16, borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9A8A7A', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #2A1A1A', paddingBottom: 0 }}>
        {(['content', 'categories', 'tags'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} role="tab" aria-selected={activeTab === t}
            style={{
              padding: '10px 20px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, textTransform: 'capitalize',
              background: activeTab === t ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: activeTab === t ? '#E8420A' : '#9A8A7A',
              borderBottom: activeTab === t ? '2px solid #E8420A' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
            {t === 'content' ? 'Content' : t === 'categories' ? `Categories (${categories.length})` : `Tags (${tags.length})`}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Content List                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'content' && (
        <>
          {/* ── Filters / Toolbar ── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title..."
              aria-label="Search content"
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 10, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14, outline: 'none' }} />

            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filter by status"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 13, cursor: 'pointer' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>

            <select value={universeFilter} onChange={e => { setUniverseFilter(e.target.value); setPage(1); }}
              aria-label="Filter by universe"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 13, cursor: 'pointer' }}>
              <option value="">All Universes</option>
              {universes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* ── Bulk Actions Bar ── */}
          {selectedIds.size > 0 && (
            <div className="az-glass" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', borderRadius: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#F5F0EB', fontWeight: 600 }}>{selectedIds.size} selected</span>
              <button onClick={handleBulkPublish} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#0D3B2E', color: '#2ECC71', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Publish</button>
              <button onClick={handleBulkUnpublish} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Unpublish</button>
              <button onClick={() => setConfirmDelete({ type: 'bulk', ids: Array.from(selectedIds) })}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(220,50,50,0.15)', color: '#E85454', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setSelectedIds(new Set())} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Clear</button>
            </div>
          )}

          {/* ── Content Table ── */}
          {isLoading ? (
            <div className="az-glass" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: 16 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #1A0A0A' }}>
                    <Skeleton width="16px" height="16px" />
                    <Skeleton width="200px" height="14px" />
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="80px" height="14px" />
                    <Skeleton width="60px" height="14px" />
                    <Skeleton width="80px" height="14px" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #2A1A1A' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 700 }}>
                <thead>
                  <tr style={{ backgroundColor: '#140808' }}>
                    <th style={thStyle}>
                      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={toggleSelectAll} aria-label="Select all" style={{ accentColor: '#E8420A', width: 16, height: 16, cursor: 'pointer' }} />
                    </th>
                    <th style={{ ...thStyle, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('title')}>
                      Title{sortIcon('title')}
                    </th>
                    <th style={{ ...thStyle, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('status')}>
                      Status{sortIcon('status')}
                    </th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Universe</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Creator</th>
                    <th style={{ ...thStyle, textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('views')}>
                      Views{sortIcon('views')}
                    </th>
                    <th style={{ ...thStyle, textAlign: 'left', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('createdAt')}>
                      Date{sortIcon('createdAt')}
                    </th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map(item => {
                    const sc = statusColor(item.status || 'draft');
                    return (
                      <tr key={item.id} style={{ borderTop: '1px solid #1E1010', backgroundColor: selectedIds.has(item.id) ? 'rgba(232,66,10,0.06)' : 'transparent', transition: 'background 0.15s' }}>
                        <td style={tdStyle}>
                          <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.title}`} style={{ accentColor: '#E8420A', width: 16, height: 16, cursor: 'pointer' }} />
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 260 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {item.thumbnail && (
                              <img src={item.thumbnail} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{item.title || 'Untitled'}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.fg }}>
                            {item.status || 'draft'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#9A8A7A' }}>{item.universe?.name || '—'}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#9A8A7A' }}>{item.creator?.name || '—'}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {(item.views || 0).toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, color: '#9A8A7A' }}>
                          {formatDate(item.createdAt)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={() => openEdit(item)} title="Edit" style={actionBtnStyle}>✏️</button>
                            {item.status !== 'published' ? (
                              <button onClick={() => handleQuickPublish(item.id)} title="Publish" style={{ ...actionBtnStyle, color: '#2ECC71' }}>▶</button>
                            ) : (
                              <button onClick={() => handleQuickUnpublish(item.id)} title="Unpublish" style={{ ...actionBtnStyle, color: '#F59E0B' }}>⏸</button>
                            )}
                            <button onClick={() => setConfirmDelete({ type: 'item', id: item.id })} title="Delete" style={{ ...actionBtnStyle, color: '#E85454' }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {content.length === 0 && (
                    <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No content found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ ...pageBtn, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) p = i + 1;
                else if (page <= 4) p = i + 1;
                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                else p = page - 3 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ ...pageBtn, background: page === p ? 'linear-gradient(135deg, #E8420A, #CC1C1C)' : 'transparent', color: page === p ? '#fff' : '#9A8A7A' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ ...pageBtn, opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Categories                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => { setEditingCat(null); setCatForm({ name: '', slug: '', description: '' }); setShowCatModal(true); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              + Add Category
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {categories.map(cat => (
              <div key={cat.id} className="az-glass" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{cat.name}</h3>
                    {cat.slug && <span style={{ fontSize: 11, color: '#6B5A4A' }}>/ {cat.slug}</span>}
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(232,66,10,0.15)', color: '#E8420A' }}>
                    {cat.contentCount ?? 0} items
                  </span>
                </div>
                {cat.description && <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 12 }}>{cat.description}</p>}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, slug: cat.slug || '', description: cat.description || '' }); setShowCatModal(true); }}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #2A1A1A', background: 'transparent', color: '#F5F0EB', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => setConfirmDelete({ type: 'cat', id: cat.id })}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(220,50,50,0.15)', color: '#E85454', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', gridColumn: '1/-1' }}>No categories yet</p>}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: Tags                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tags' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => { setTagForm({ name: '' }); setShowTagModal(true); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              + Add Tag
            </button>
          </div>
          <div className="az-glass" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(tag => (
                <div key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(232,66,10,0.1)', border: '1px solid #2A1A1A' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>#{tag.name}</span>
                  <span style={{ fontSize: 11, color: '#9A8A7A' }}>{tag.contentCount ?? 0}</span>
                  <button onClick={() => setConfirmDelete({ type: 'tag', id: tag.id })}
                    style={{ background: 'none', border: 'none', color: '#E85454', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ))}
              {tags.length === 0 && <p style={{ color: '#9A8A7A', fontSize: 14 }}>No tags yet</p>}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Views by Universe (below tabs)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {stats?.viewsByUniverse && stats.viewsByUniverse.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Views by Universe</h2>
          <div className="az-glass" style={{ padding: 20, borderRadius: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.viewsByUniverse.map(vu => {
                const maxViews = Math.max(...stats.viewsByUniverse.map(x => x.views), 1);
                return (
                  <div key={vu.universe} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 120, fontSize: 13, color: '#F5F0EB', flexShrink: 0 }}>{vu.universe}</span>
                    <div style={{ flex: 1, height: 24, background: '#0D0505', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(vu.views / maxViews) * 100}%`, background: 'linear-gradient(90deg, #E8420A, #CC1C1C)', borderRadius: 6, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ width: 80, fontSize: 12, color: '#9A8A7A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{vu.views.toLocaleString()} views</span>
                    <span style={{ width: 60, fontSize: 12, color: '#6B5A4A', textAlign: 'right' }}>{vu.count} items</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EDIT / DETAIL PANEL (slide-out)                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showEditPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowEditPanel(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 520, backgroundColor: '#1A0A0A',
            borderLeft: '1px solid #2A1A1A', overflowY: 'auto', padding: 0,
            animation: 'slideInRight 0.3s ease',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #2A1A1A', position: 'sticky', top: 0, backgroundColor: '#1A0A0A', zIndex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Content</h2>
              <button onClick={() => setShowEditPanel(false)} style={{ background: 'none', border: 'none', color: '#9A8A7A', fontSize: 22, cursor: 'pointer', padding: 4 }}>×</button>
            </div>
            {/* Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Title</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle} placeholder="Content title" />
              </div>
              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Description..." />
              </div>
              {/* Thumbnail URL */}
              <div>
                <label style={labelStyle}>Thumbnail URL</label>
                <input value={editForm.thumbnail} onChange={e => setEditForm(f => ({ ...f, thumbnail: e.target.value }))}
                  style={inputStyle} placeholder="https://..." />
                {editForm.thumbnail && (
                  <img src={editForm.thumbnail} alt="Preview" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid #2A1A1A' }} />
                )}
              </div>
              {/* Media URL */}
              <div>
                <label style={labelStyle}>Media URL</label>
                <input value={editForm.mediaUrl} onChange={e => setEditForm(f => ({ ...f, mediaUrl: e.target.value }))}
                  style={inputStyle} placeholder="https://..." />
              </div>
              {/* Status + Universe row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    style={inputStyle}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Universe</label>
                  <select value={editForm.universeId} onChange={e => setEditForm(f => ({ ...f, universeId: e.target.value }))}
                    style={inputStyle}>
                    <option value="">Select universe</option>
                    {universes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Categories */}
              <div>
                <label style={labelStyle}>Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {categories.map(cat => {
                    const checked = editForm.categoryIds.includes(cat.id);
                    return (
                      <label key={cat.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        border: checked ? '1px solid #E8420A' : '1px solid #2A1A1A',
                        background: checked ? 'rgba(232,66,10,0.15)' : 'transparent',
                        color: checked ? '#E8420A' : '#9A8A7A',
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setEditForm(f => ({
                            ...f,
                            categoryIds: checked ? f.categoryIds.filter(id => id !== cat.id) : [...f.categoryIds, cat.id],
                          }));
                        }} style={{ display: 'none' }} />
                        {cat.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {tags.map(tag => {
                    const checked = editForm.tags.includes(tag.name);
                    return (
                      <label key={tag.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px',
                        borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        border: checked ? '1px solid #E8420A' : '1px solid #2A1A1A',
                        background: checked ? 'rgba(232,66,10,0.15)' : 'transparent',
                        color: checked ? '#E8420A' : '#9A8A7A',
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => {
                          setEditForm(f => ({
                            ...f,
                            tags: checked ? f.tags.filter(t => t !== tag.name) : [...f.tags, tag.name],
                          }));
                        }} style={{ display: 'none' }} />
                        #{tag.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Version History link */}
              {editItem && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(232,66,10,0.06)', border: '1px solid #2A1A1A' }}>
                  <span style={{ fontSize: 12, color: '#9A8A7A' }}>Created {formatDate(editItem.createdAt)} &middot; Updated {formatDate(editItem.updatedAt)}</span>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #2A1A1A', display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, backgroundColor: '#1A0A0A' }}>
              <button onClick={() => setShowEditPanel(false)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: isSaving ? 0.6 : 1 }}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CATEGORY MODAL                                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div onClick={() => { setShowCatModal(false); setEditingCat(null); }} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div className="az-glass" style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 16, padding: 24, margin: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Category name" />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle} placeholder="category-slug" />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optional description" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => { setShowCatModal(false); setEditingCat(null); }}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveCategory}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAG MODAL                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showTagModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div onClick={() => setShowTagModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div className="az-glass" style={{ position: 'relative', width: '100%', maxWidth: 360, borderRadius: 16, padding: 24, margin: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>New Tag</h2>
            <div>
              <label style={labelStyle}>Tag Name</label>
              <input value={tagForm.name} onChange={e => setTagForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle} placeholder="tag-name" onKeyDown={e => e.key === 'Enter' && handleCreateTag()} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowTagModal(false)}
                style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateTag}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E8420A, #CC1C1C)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONFIRM DELETE DIALOG                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div onClick={() => setConfirmDelete(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div className="az-glass" style={{ position: 'relative', width: '100%', maxWidth: 380, borderRadius: 16, padding: 24, margin: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Confirm Delete</h2>
            <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 20 }}>
              {confirmDelete.type === 'bulk'
                ? `Delete ${confirmDelete.ids?.length} selected item(s)? This cannot be undone.`
                : confirmDelete.type === 'item'
                ? 'Delete this content item? This cannot be undone.'
                : confirmDelete.type === 'cat'
                ? 'Delete this category? Content will be unlinked.'
                : 'Delete this tag? Content will be unlinked.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #2A1A1A', background: 'transparent', color: '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                if (confirmDelete.type === 'item' && confirmDelete.id) handleDeleteItem(confirmDelete.id);
                else if (confirmDelete.type === 'bulk') handleBulkDelete();
                else if (confirmDelete.type === 'cat' && confirmDelete.id) handleDeleteCategory(confirmDelete.id);
                else if (confirmDelete.type === 'tag' && confirmDelete.id) handleDeleteTag(confirmDelete.id);
              }}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #DC3545, #B02A37)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </AdminLayout>
  );
}

// ─── Shared style constants ─────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: '#9A8A7A',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #2A1A1A',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
  color: '#F5F0EB',
  fontSize: 13,
};

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  padding: '4px 6px',
  borderRadius: 4,
  lineHeight: 1,
  color: '#F5F0EB',
};

const pageBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: '1px solid #2A1A1A',
  background: 'transparent',
  color: '#9A8A7A',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#9A8A7A',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2A1A1A',
  backgroundColor: '#0D0505',
  color: '#F5F0EB',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
