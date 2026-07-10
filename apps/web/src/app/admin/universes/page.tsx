'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import type { AdminUniverse, FeatureFlag } from '@/lib/admin-types';

type SortKey = 'name' | 'contentCount' | 'status' | 'sortOrder';
type SortDir = 'asc' | 'desc';

interface UniverseFormData {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  isEnabled: boolean;
  sortOrder: number;
  metadata: string;
}

const EMPTY_FORM: UniverseFormData = {
  name: '',
  displayName: '',
  description: '',
  icon: '🌍',
  color: '#E8420A',
  isEnabled: true,
  sortOrder: 0,
  metadata: '{}',
};

export default function AdminUniversesPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('sortOrder');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState<UniverseFormData>(EMPTY_FORM);
  const [editingUniverseId, setEditingUniverseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [featureModalUniverse, setFeatureModalUniverse] = useState<AdminUniverse | null>(null);
  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureEnabled, setNewFeatureEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  const {
    data: universes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'universes'],
    queryFn: async () => {
      const response = await api.admin.getAllUniverses();
      if (response.success && response.data) {
        const data = response.data as AdminUniverse[] | { items: AdminUniverse[] };
        return Array.isArray(data) ? data : data.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'universe-stats'],
    queryFn: async () => {
      const response = await api.admin.getUniverseStats();
      if (response.success && response.data) {
        return response.data as Record<string, unknown>;
      }
      return null;
    },
    enabled: isEnabled && showStats,
  });

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
    return () => {};
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const items = universes.filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.description?.toLowerCase().includes(q)
    );
    items.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.displayName.localeCompare(b.displayName);
      else if (sortKey === 'contentCount') cmp = (a.contentCount || 0) - (b.contentCount || 0);
      else if (sortKey === 'status') cmp = (a.isEnabled ? 1 : 0) - (b.isEnabled ? 1 : 0);
      else if (sortKey === 'sortOrder') cmp = a.sortOrder - b.sortOrder;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [universes, search, sortKey, sortDir]);

  const toggleToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
  }, []);

  const handleToggleUniverse = async (id: string, currentEnabled: boolean) => {
    try {
      await api.admin.toggleUniverse(id, !currentEnabled);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      toggleToast('success', `Universe ${currentEnabled ? 'disabled' : 'enabled'}`);
    } catch {
      toggleToast('error', 'Failed to toggle universe');
    }
  };

  const handleBulkToggle = async (isEnabled: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await api.admin.bulkToggleUniverses(ids, isEnabled);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      toggleToast('success', `${ids.length} universes ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch {
      toggleToast('error', 'Failed to bulk toggle');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setModalForm(EMPTY_FORM);
    setEditingUniverseId(null);
    setModalOpen(true);
  };

  const openEditModal = (u: AdminUniverse) => {
    setModalMode('edit');
    setEditingUniverseId(u.id);
    setModalForm({
      name: u.name,
      displayName: u.displayName,
      description: u.description || '',
      icon: u.icon || '🌍',
      color: u.color || '#E8420A',
      isEnabled: u.isEnabled,
      sortOrder: u.sortOrder,
      metadata: u.metadata ? JSON.stringify(u.metadata, null, 2) : '{}',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let metadata: Record<string, unknown> = {};
      try {
        metadata = JSON.parse(modalForm.metadata);
      } catch {
        toggleToast('error', 'Invalid JSON in metadata field');
        setIsSaving(false);
        return;
      }

      if (modalMode === 'create') {
        const res = await api.admin.createUniverse({
          name: modalForm.name,
          displayName: modalForm.displayName,
          description: modalForm.description,
          icon: modalForm.icon,
          color: modalForm.color,
          isEnabled: modalForm.isEnabled,
          sortOrder: modalForm.sortOrder,
          metadata,
        });
        if (res.success && res.data) {
          queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
          toggleToast('success', 'Universe created');
        }
      } else if (editingUniverseId) {
        const res = await api.admin.updateUniverse(editingUniverseId, {
          displayName: modalForm.displayName,
          description: modalForm.description,
          icon: modalForm.icon,
          color: modalForm.color,
          isEnabled: modalForm.isEnabled,
          sortOrder: modalForm.sortOrder,
          metadata,
        });
        if (res.success && res.data) {
          queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
          toggleToast('success', 'Universe updated');
        }
      }
      setModalOpen(false);
    } catch {
      toggleToast('error', 'Failed to save universe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.admin.deleteUniverse(id);
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      toggleToast('success', 'Universe deleted');
    } catch {
      toggleToast('error', 'Failed to delete universe');
    }
  };

  const handleClone = async (u: AdminUniverse) => {
    try {
      const res = await api.admin.cloneUniverse(u.id, {
        displayName: `${u.displayName} (Copy)`,
      });
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
        toggleToast('success', `Cloned "${u.displayName}"`);
      }
    } catch {
      toggleToast('error', 'Failed to clone universe');
    }
  };

  const handleExport = async (u: AdminUniverse) => {
    try {
      const res = await api.admin.exportUniverse(u.id);
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `universe-${u.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toggleToast('success', `Exported "${u.displayName}"`);
      }
    } catch {
      toggleToast('error', 'Failed to export universe');
    }
  };

  const handleExportSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const results = await Promise.all(ids.map((id) => api.admin.exportUniverse(id)));
      const exportData = results.filter((r) => r.success && r.data).map((r) => r.data);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `universes-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toggleToast('success', `Exported ${exportData.length} universes`);
    } catch {
      toggleToast('error', 'Failed to export universes');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportData(ev.target?.result as string);
      setImportOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    setIsImporting(true);
    try {
      const parsed = JSON.parse(importData);
      const res = await api.admin.importUniverses(parsed);
      if (res.success) {
        const result = res.data as { imported: number; skipped: number; errors: string[] };
        toggleToast(
          'success',
          `Imported: ${result.imported}, Skipped: ${result.skipped}${result.errors?.length ? `, Errors: ${result.errors.length}` : ''}`
        );
        setImportOpen(false);
        setImportData('');
        queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      }
    } catch {
      toggleToast('error', 'Invalid JSON or import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openFeatureFlags = (u: AdminUniverse) => {
    setFeatureModalUniverse(u);
    setNewFeatureKey('');
    setNewFeatureEnabled(true);
  };

  const handleAddFeatureFlag = async () => {
    if (!featureModalUniverse || !newFeatureKey.trim()) return;
    try {
      await api.admin.updateFeatureFlag(featureModalUniverse.id, {
        featureKey: newFeatureKey.trim(),
        isEnabled: newFeatureEnabled,
      });
      const updated = {
        ...featureModalUniverse,
        featureFlags: [
          ...(featureModalUniverse.featureFlags || []),
          { featureKey: newFeatureKey.trim(), isEnabled: newFeatureEnabled },
        ],
      };
      setFeatureModalUniverse(updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      setNewFeatureKey('');
      setNewFeatureEnabled(true);
      toggleToast('success', 'Feature flag added');
    } catch {
      toggleToast('error', 'Failed to add feature flag');
    }
  };

  const handleToggleFeatureFlag = async (featureKey: string, currentEnabled: boolean) => {
    if (!featureModalUniverse) return;
    try {
      await api.admin.updateFeatureFlag(featureModalUniverse.id, {
        featureKey,
        isEnabled: !currentEnabled,
      });
      const flags = (featureModalUniverse.featureFlags || []).map((f) =>
        f.featureKey === featureKey ? { ...f, isEnabled: !currentEnabled } : f
      );
      const updated = { ...featureModalUniverse, featureFlags: flags };
      setFeatureModalUniverse(updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
    } catch {
      toggleToast('error', 'Failed to toggle feature flag');
    }
  };

  const handleDeleteFeatureFlag = async (featureKey: string) => {
    if (!featureModalUniverse) return;
    try {
      await api.admin.deleteFeatureFlag(featureModalUniverse.id, featureKey);
      const flags = (featureModalUniverse.featureFlags || []).filter(
        (f) => f.featureKey !== featureKey
      );
      const updated = { ...featureModalUniverse, featureFlags: flags };
      setFeatureModalUniverse(updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      toggleToast('success', 'Feature flag deleted');
    } catch {
      toggleToast('error', 'Failed to delete feature flag');
    }
  };

  const enabledCount = universes.filter((u) => u.isEnabled).length;
  const disabledCount = universes.length - enabledCount;
  const totalFlags = universes.reduce((sum, u) => sum + (u.featureFlags?.length || 0), 0);

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 5,
    color: '#9A8A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 999,
    border: active ? 'none' : '1px solid #2A1A1A',
    background: active ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
    color: active ? '#fff' : '#9A8A7A',
    fontWeight: 500,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  return (
    <AdminLayout>
      <div style={{ position: 'relative' }}>
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              zIndex: 9999,
              padding: '12px 20px',
              borderRadius: 12,
              backgroundColor: toast.type === 'success' ? '#0D3B2E' : '#3B0D0D',
              color: toast.type === 'success' ? '#4ADE80' : '#F87171',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {toast.type === 'success' ? '✓' : '✕'} {toast.text}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Universe Management</h1>
            <p style={{ color: '#9A8A7A', fontSize: 14 }}>
              {universes.length} universes · {enabledCount} enabled · {disabledCount} disabled
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid #2A1A1A',
                backgroundColor: showStats ? '#E8420A' : 'transparent',
                color: showStats ? '#fff' : '#9A8A7A',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Stats
            </button>
            <button
              onClick={handleExportSelected}
              disabled={selectedIds.size === 0}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid #2A1A1A',
                backgroundColor: 'transparent',
                color: selectedIds.size > 0 ? '#F5F0EB' : '#5A4A3A',
                fontWeight: 600,
                fontSize: 13,
                cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Export ({selectedIds.size})
            </button>
            <label
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid #2A1A1A',
                backgroundColor: 'transparent',
                color: '#F5F0EB',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Import
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={openCreateModal}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + New Universe
            </button>
          </div>
        </div>

        {showStats && (
          <div
            className="az-glass"
            style={{
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Total
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#F5F0EB' }}>{universes.length}</p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Enabled
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#4ADE80' }}>{enabledCount}</p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Disabled
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#F87171' }}>{disabledCount}</p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Feature Flags
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{totalFlags}</p>
            </div>
            {stats &&
              typeof stats === 'object' &&
              Object.entries(stats).map(([key, val]) =>
                key !== 'total' &&
                key !== 'enabled' &&
                key !== 'disabled' &&
                key !== 'featureFlags' ? (
                  <div key={key}>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#9A8A7A',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: '#F5F0EB' }}>{String(val)}</p>
                  </div>
                ) : null
              )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#5A4A3A',
                fontSize: 14,
              }}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search universes..."
              aria-label="Search universes"
              style={{
                ...inputStyle,
                paddingLeft: 36,
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                ['name', 'Name'],
                ['contentCount', 'Content'],
                ['status', 'Status'],
                ['sortOrder', 'Order'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortKey(key);
                    setSortDir('asc');
                  }
                }}
                style={pillBtn(sortKey === key)}
              >
                {label} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              padding: '10px 16px',
              borderRadius: 12,
              backgroundColor: 'rgba(232,66,10,0.1)',
              border: '1px solid rgba(232,66,10,0.2)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: '#F5F0EB', fontWeight: 600, fontSize: 13 }}>
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleBulkToggle(true)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0D3B2E',
                color: '#4ADE80',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Enable All
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#3B0D0D',
                color: '#F87171',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Disable All
            </button>
            <button
              onClick={handleExportSelected}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: 'transparent',
                color: '#F5F0EB',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Export
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                marginLeft: 'auto',
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: 'transparent',
                color: '#9A8A7A',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )}

        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Skeleton width="32px" height="32px" borderRadius="50%" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="120px" height="16px" className="mb-1" />
                    <Skeleton width="80px" height="12px" />
                  </div>
                </div>
                <Skeleton width="100%" height="40px" className="mb-3" />
                <Skeleton width="80%" height="12px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load universes"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        ) : (
          <>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #2A1A1A',
                  backgroundColor: 'transparent',
                  color: '#9A8A7A',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border:
                      selectedIds.size === filtered.length && filtered.length > 0
                        ? 'none'
                        : '1px solid #5A4A3A',
                    backgroundColor:
                      selectedIds.size === filtered.length && filtered.length > 0
                        ? '#E8420A'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: '#fff',
                  }}
                >
                  {selectedIds.size === filtered.length && filtered.length > 0 ? '✓' : ''}
                </div>
                Select all
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="az-glass"
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    position: 'relative',
                    border: selectedIds.has(u.id)
                      ? '1px solid rgba(232,66,10,0.4)'
                      : '1px solid transparent',
                    opacity: u.isEnabled ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <button
                        onClick={() => toggleSelect(u.id)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: selectedIds.has(u.id) ? 'none' : '1px solid #5A4A3A',
                          backgroundColor: selectedIds.has(u.id) ? '#E8420A' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontSize: 11,
                          color: '#fff',
                        }}
                      >
                        {selectedIds.has(u.id) ? '✓' : ''}
                      </button>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>{u.icon || '🌍'}</span>
                      <div style={{ minWidth: 0 }}>
                        <h3
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#F5F0EB',
                          }}
                        >
                          {u.displayName}
                        </h3>
                        <p
                          style={{
                            fontSize: 12,
                            color: '#5A4A3A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {u.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUniverse(u.id, u.isEnabled)}
                      title={u.isEnabled ? 'Disable' : 'Enable'}
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: u.isEnabled ? '#E8420A' : '#2A1A1A',
                        transition: 'background-color 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: u.isEnabled ? 20 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                  </div>

                  <p
                    style={{
                      color: '#9A8A7A',
                      fontSize: 13,
                      marginBottom: 14,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {u.description || 'No description'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 12,
                      color: '#9A8A7A',
                      marginBottom: 14,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(232,66,10,0.1)',
                        color: '#E8420A',
                      }}
                    >
                      {u.contentCount || 0} items
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(245,240,235,0.05)',
                        color: '#9A8A7A',
                      }}
                    >
                      {u.featureFlags?.length || 0} flags
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: 'rgba(245,240,235,0.05)',
                        color: '#9A8A7A',
                      }}
                    >
                      order: {u.sortOrder}
                    </span>
                  </div>

                  {u.color && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: u.color,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#5A4A3A' }}>{u.color}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      borderTop: '1px solid #1A0A0A',
                      paddingTop: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      onClick={() => openEditModal(u)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 8,
                        border: '1px solid #2A1A1A',
                        backgroundColor: 'transparent',
                        color: '#F5F0EB',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleClone(u)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 8,
                        border: '1px solid #2A1A1A',
                        backgroundColor: 'transparent',
                        color: '#9A8A7A',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => handleExport(u)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 8,
                        border: '1px solid #2A1A1A',
                        backgroundColor: 'transparent',
                        color: '#9A8A7A',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Export
                    </button>
                    <button
                      onClick={() => openFeatureFlags(u)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: 8,
                        border: '1px solid #2A1A1A',
                        backgroundColor: 'transparent',
                        color: '#F59E0B',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Flags
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid #3B0D0D',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        color: '#EF4444',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#9A8A7A',
                    gridColumn: '1/-1',
                  }}
                >
                  {search ? 'No universes match your search' : 'No universes found'}
                </p>
              )}
            </div>
          </>
        )}

        {modalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <div
              className="az-glass"
              style={{
                width: '100%',
                maxWidth: 560,
                maxHeight: '85vh',
                overflow: 'auto',
                padding: 28,
                borderRadius: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                  {modalMode === 'create' ? 'Create Universe' : 'Edit Universe'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'transparent',
                    color: '#9A8A7A',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {modalMode === 'create' && (
                  <div>
                    <label style={labelStyle}>Internal Name *</label>
                    <input
                      value={modalForm.name}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      placeholder="e.g. nollywood"
                      style={inputStyle}
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Display Name *</label>
                  <input
                    value={modalForm.displayName}
                    onChange={(e) => setModalForm({ ...modalForm, displayName: e.target.value })}
                    placeholder="e.g. Nollywood"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={modalForm.description}
                    onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                    placeholder="Describe this universe..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Icon</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={modalForm.icon}
                        onChange={(e) => setModalForm({ ...modalForm, icon: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <span style={{ fontSize: 28 }}>{modalForm.icon}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Color</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={modalForm.color}
                        onChange={(e) => setModalForm({ ...modalForm, color: e.target.value })}
                        style={{
                          width: 40,
                          height: 38,
                          borderRadius: 8,
                          border: '1px solid #2A1A1A',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      />
                      <input
                        value={modalForm.color}
                        onChange={(e) => setModalForm({ ...modalForm, color: e.target.value })}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Sort Order</label>
                    <input
                      type="number"
                      value={modalForm.sortOrder}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, sortOrder: Number(e.target.value) })
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Status</label>
                    <button
                      onClick={() =>
                        setModalForm({ ...modalForm, isEnabled: !modalForm.isEnabled })
                      }
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #2A1A1A',
                        backgroundColor: modalForm.isEnabled
                          ? 'rgba(13,59,46,0.2)'
                          : 'rgba(59,13,13,0.2)',
                        color: modalForm.isEnabled ? '#4ADE80' : '#F87171',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {modalForm.isEnabled ? '● Enabled' : '○ Disabled'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Metadata (JSON)</label>
                  <textarea
                    value={modalForm.metadata}
                    onChange={(e) => setModalForm({ ...modalForm, metadata: e.target.value })}
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  />
                </div>

                {modalMode === 'edit' && modalForm.metadata && (
                  <div>
                    <label style={labelStyle}>Preview</label>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: '#0D0505',
                        border: '1px solid #1A0A0A',
                        fontSize: 12,
                        color: '#9A8A7A',
                        fontFamily: 'monospace',
                        maxHeight: 80,
                        overflow: 'auto',
                      }}
                    >
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(modalForm.metadata), null, 2);
                        } catch {
                          return '⚠ Invalid JSON';
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 24,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'transparent',
                    color: '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !modalForm.name || !modalForm.displayName}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor:
                      isSaving || !modalForm.name || !modalForm.displayName
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: isSaving || !modalForm.name || !modalForm.displayName ? 0.5 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDelete(null);
            }}
          >
            <div
              className="az-glass"
              style={{
                width: '100%',
                maxWidth: 400,
                padding: 28,
                borderRadius: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delete Universe?</h3>
              <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 24 }}>
                This action cannot be undone. All data associated with this universe will be
                removed.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'transparent',
                    color: '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: '#DC2626',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {importOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setImportOpen(false);
                setImportData('');
              }
            }}
          >
            <div
              className="az-glass"
              style={{
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                overflow: 'auto',
                padding: 28,
                borderRadius: 20,
              }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Import Universes</h2>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 16 }}>
                Paste the JSON data or load it from a file above.
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={12}
                placeholder='[{"name": "nollywood", "displayName": "Nollywood", ...}]'
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 16,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => {
                    setImportOpen(false);
                    setImportData('');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'transparent',
                    color: '#9A8A7A',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={isImporting || !importData.trim()}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: isImporting || !importData.trim() ? 'not-allowed' : 'pointer',
                    opacity: isImporting || !importData.trim() ? 0.5 : 1,
                  }}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        )}

        {featureModalUniverse && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setFeatureModalUniverse(null);
            }}
          >
            <div
              className="az-glass"
              style={{
                width: '100%',
                maxWidth: 520,
                maxHeight: '85vh',
                overflow: 'auto',
                padding: 28,
                borderRadius: 20,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                }}
              >
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Feature Flags</h2>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                    {featureModalUniverse.displayName}
                  </p>
                </div>
                <button
                  onClick={() => setFeatureModalUniverse(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'transparent',
                    color: '#9A8A7A',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <input
                  value={newFeatureKey}
                  onChange={(e) => setNewFeatureKey(e.target.value)}
                  placeholder="Feature key..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFeatureFlag();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={() => setNewFeatureEnabled(!newFeatureEnabled)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: newFeatureEnabled
                      ? 'rgba(13,59,46,0.2)'
                      : 'rgba(59,13,13,0.2)',
                    color: newFeatureEnabled ? '#4ADE80' : '#F87171',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {newFeatureEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={handleAddFeatureFlag}
                  disabled={!newFeatureKey.trim()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: newFeatureKey.trim() ? 'pointer' : 'not-allowed',
                    opacity: newFeatureKey.trim() ? 1 : 0.5,
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(featureModalUniverse.featureFlags || []).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#5A4A3A', padding: 20, fontSize: 13 }}>
                    No feature flags yet
                  </p>
                )}
                {(featureModalUniverse.featureFlags || []).map((flag: FeatureFlag) => (
                  <div
                    key={flag.featureKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      backgroundColor: '#0D0505',
                      border: '1px solid #1A0A0A',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: flag.isEnabled
                          ? 'rgba(13,59,46,0.2)'
                          : 'rgba(59,13,13,0.2)',
                        color: flag.isEnabled ? '#4ADE80' : '#F87171',
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {flag.isEnabled ? 'ON' : 'OFF'}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#F5F0EB' }}>
                      {flag.featureKey}
                    </span>
                    <button
                      onClick={() => handleToggleFeatureFlag(flag.featureKey, flag.isEnabled)}
                      style={{
                        width: 34,
                        height: 18,
                        borderRadius: 9,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        backgroundColor: flag.isEnabled ? '#E8420A' : '#2A1A1A',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: flag.isEnabled ? 17 : 2,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          transition: 'left 0.2s',
                        }}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteFeatureFlag(flag.featureKey)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: '1px solid #3B0D0D',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        color: '#EF4444',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
