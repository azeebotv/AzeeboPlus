import { useConfirm } from "@/components/ui";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminUniverse } from '@/lib/admin-types';
import { requireData, assertSuccess } from '@/lib/payload';
import { Icon } from '@/components/Icons';

export default function UniversesPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    color: '#E8420A',
    sortOrder: 0,
    isEnabled: true,
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'universes', page, search],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(page, PAGE_SIZE, search || undefined);
      if (res.success && res.data) {
        // The endpoint returns a paginated envelope {data: [...], meta}, not a
        // bare array — cast carefully and never trust the shape (a mismatched
        // payload used to crash this tree with "universes.filter is not a
        // function").
        const d = res.data as unknown as
          | AdminUniverse[]
          | { data?: AdminUniverse[]; meta?: { total?: number; totalPages?: number } };
        const rows = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        return {
          rows,
          total: (!Array.isArray(d) && d?.meta?.total) || rows.length,
          totalPages: (!Array.isArray(d) && d?.meta?.totalPages) || 1,
        };
      }
      return { rows: [], total: 0, totalPages: 1 };
    },
  });

  const universes = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUniverse(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      setShowCreate(false);
      setForm({
        name: '',
        displayName: '',
        description: '',
        icon: '',
        color: '#E8420A',
        sortOrder: 0,
        isEnabled: true,
      });
    },
  });

  // Redis publish drift: toggle/bulk responses carry flagSync { ok, failedKeys }
  // — a failed sentinel publish means the DB state is right but the runtime
  // store (and therefore services/clients) still shows the OLD state. Surface it
  // per card with a one-click Re-sync (POST :id/resync republishes from DB truth).
  const [syncIssues, setSyncIssues] = useState<Record<string, string[]>>({});
  const recordSyncIssues = (
    rows: AdminUniverse[],
    flagSync: unknown,
    fallbackId?: string
  ): void => {
    const sync =
      flagSync && typeof flagSync === 'object'
        ? (flagSync as { ok?: boolean; failedKeys?: unknown })
        : null;
    if (!sync) return;
    if (sync.ok) {
      if (fallbackId) {
        setSyncIssues((prev) => {
          if (!(fallbackId in prev)) return prev;
          const rest = { ...prev };
          delete rest[fallbackId];
          return rest;
        });
      }
      return;
    }
    const failedKeys = Array.isArray(sync.failedKeys) ? (sync.failedKeys as string[]) : [];
    const byId: Record<string, string[]> = {};
    for (const key of failedKeys) {
      // universe.<name>.enabled → find the row whose name matches.
      const name = key.replace(/^universe\./, '').replace(/\.enabled$/, '');
      const row = rows.find((u) => u.name === name);
      const id = row?.id ?? fallbackId;
      if (id) (byId[id] ??= []).push(key);
    }
    setSyncIssues((prev) => ({ ...prev, ...byId }));
  };

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      setTogglingId(id);
      setToggleError(null);
      return assertSuccess(await adminApi.toggleUniverse(id, isEnabled));
    },
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      recordSyncIssues(
        universes,
        (res.data as { flagSync?: unknown } | undefined)?.flagSync,
        vars.id
      );
    },
    onError: (err: unknown) => {
      setToggleError((err as Error)?.message || 'Failed to toggle universe status');
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  const resyncMutation = useMutation({
    mutationFn: (id: string) => adminApi.resyncUniverse(id),
    onSuccess: (res, id) => {
      recordSyncIssues(universes, res.data?.flagSync, id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUniverse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] }),
  });

  // Edit (name/displayName/description) — updateUniverse existed but had no UI.
  const [editTarget, setEditTarget] = useState<AdminUniverse | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    icon: '',
    color: '#E8420A',
    sortOrder: 0,
    isEnabled: true,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateUniverse(id, data),
    onSuccess: () => {
      setEditTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
    },
  });

  // Clone (POST :id/copy) — backend route previously unused.
  const [cloneError, setCloneError] = useState<string | null>(null);
  const cloneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.cloneUniverse(id, data),
    onSuccess: () => {
      setCloneError(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
    },
    onError: (e) => setCloneError((e as Error).message || 'Clone failed'),
  });

  // Bulk enable/disable (POST bulk/toggle) — previously unused.
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const bulkToggleMutation = useMutation({
    mutationFn: ({ ids, isEnabled }: { ids: string[]; isEnabled: boolean }) =>
      adminApi.bulkToggleUniverses(ids, isEnabled),
    onSuccess: (res) => {
      setBulkSelection(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      recordSyncIssues(universes, (res.data as { flagSync?: unknown } | undefined)?.flagSync);
    },
  });

  // Stats strip (GET stats — previously unused).
  const { data: stats } = useQuery({
    queryKey: ['admin', 'universe-stats'],
    queryFn: async () => {
      const res = await adminApi.getUniverseStats();
      return requireData(res, null) as {
        totalUniverses?: number;
        enabledUniverses?: number;
        disabledUniverses?: number;
        totalContentItems?: number;
      } | null;
    },
  });

  // ── Export / import (backend routes previously unused) ────────────────
  const [ioFeedback, setIoFeedback] = useState<string | null>(null);

  const exportUniverse = async (u: AdminUniverse) => {
    setIoFeedback(`Exporting "${u.displayName || u.name}"...`);
    const res = await adminApi.exportUniverse(u.id);
    if (!res.success) {
      setIoFeedback(`Export failed: ${res.message || 'unknown error'}`);
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universe-${u.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIoFeedback(`Exported "${u.displayName || u.name}" — check your downloads.`);
  };

  /**
   * Accepts a single exported universe object, a bare array, or a wrapper
   * { universes: [...] }. The backend ValidationPipe runs with
   * forbidNonWhitelisted, so any key outside the import DTO (e.g. the
   * `exportedAt` stamp our own export adds) would 400 the whole request —
   * strip everything down to the DTO fields before sending.
   */
  const sanitizeForImport = (raw: unknown): Array<Record<string, unknown>> => {
    let list: unknown[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      list = Array.isArray(rec.universes) ? rec.universes : [rec];
    }
    return list
      .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object')
      .map((u) => {
        const flags = Array.isArray(u.featureFlags)
          ? (u.featureFlags as Record<string, unknown>[]).map((f) => ({
              featureKey: String(f.featureKey ?? ''),
              isEnabled: f.isEnabled === true,
              ...(f.metadata != null && typeof f.metadata === 'object'
                ? { metadata: f.metadata as Record<string, unknown> }
                : {}),
            }))
          : undefined;
        return {
          name: String(u.name ?? ''),
          displayName: String(u.displayName ?? u.name ?? ''),
          ...(u.description != null ? { description: String(u.description) } : {}),
          ...(u.icon != null ? { icon: String(u.icon) } : {}),
          ...(u.color != null ? { color: String(u.color) } : {}),
          ...(u.isEnabled != null ? { isEnabled: u.isEnabled === true } : {}),
          ...(u.sortOrder != null ? { sortOrder: Number(u.sortOrder) || 0 } : {}),
          ...(u.metadata != null && typeof u.metadata === 'object'
            ? { metadata: u.metadata as Record<string, unknown> }
            : {}),
          ...(flags && flags.length > 0 ? { featureFlags: flags } : {}),
        };
      })
      .filter((u) => u.name.length > 0);
  };

  const importUniversesFromFile = async (file: File) => {
    setIoFeedback(`Importing ${file.name}...`);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setIoFeedback('Import failed: file is not valid JSON.');
      return;
    }
    const universes = sanitizeForImport(parsed);
    if (universes.length === 0) {
      setIoFeedback('Import failed: no universes found in the file.');
      return;
    }
    const res = await adminApi.importUniverses({ universes });
    if (!res.success) {
      setIoFeedback(`Import failed: ${res.message || 'unknown error'}`);
      return;
    }
    // Backend sends counts as numbers ({ imported: 1, ... }) but tolerates
    // array-valued results defensively too.
    const d = (res.data ?? {}) as {
      imported?: number | unknown[];
      skipped?: number | unknown[];
      errors?: number | unknown[];
    };
    const count = (v: number | unknown[] | undefined): number =>
      typeof v === 'number' ? v : Array.isArray(v) ? v.length : 0;
    const imported = count(d.imported);
    const skipped = count(d.skipped);
    const errors = count(d.errors);
    setIoFeedback(
      `Import finished: ${imported} imported · ${skipped} skipped (already exist) · ${errors} errors.`
    );
    if (imported > 0) {
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'universe-stats'] });
    }
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void importUniversesFromFile(file);
    };
    input.click();
  };

  const toggleBulk = (id: string) => {
    setBulkSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Search is server-side (QueryUniverseDto.search) and debounced via the
  // keyed useQuery — no client-side filter to mismatch on payload shape.

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="globe" size={26} color="var(--admin-orange)" />
            Universes
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
            {stats
              ? `${stats.totalUniverses ?? total} universes · ${stats.enabledUniverses ?? 0} enabled · ${stats.disabledUniverses ?? 0} disabled · ${stats.totalContentItems ?? 0} content items`
              : `${total} universes`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ioFeedback && (
            <span
              style={{
                color:
                  ioFeedback.startsWith('Export failed') || ioFeedback.startsWith('Import failed')
                    ? 'var(--admin-red)'
                    : 'var(--admin-text-muted)',
                fontSize: 12,
                maxWidth: 320,
              }}
            >
              {ioFeedback}
            </span>
          )}
          <button
            onClick={handleImportClick}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              border: '1px solid var(--admin-card)',
              background: 'transparent',
              color: 'var(--admin-text)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Import
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
            Create Universe
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search universes..."
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'var(--admin-dark)',
          color: 'var(--admin-text)',
          fontSize: 14,
          marginBottom: 24,
          boxSizing: 'border-box',
        }}
      />

      {showCreate && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Create Universe</h3>
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
            Note: Verticals are reserved exclusively for creator uploads via Creator Studio. Movies and other universes are managed by admins.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().trim() })}
                placeholder="Slug / Name (e.g. nollywood) *"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              />
              <input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Display Name (e.g. Nollywood Premieres) *"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={2}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Icon name (e.g. film, globe)"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Theme color (#E8420A)"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                placeholder="Sort order (0)"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isEnabled}
                onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
              />
              <span>Active on public platform</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.name.trim() || !form.displayName.trim() || createMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: !form.name.trim() || !form.displayName.trim() ? 'not-allowed' : 'pointer',
                  opacity: !form.name.trim() || !form.displayName.trim() ? 0.6 : 1,
                }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Universe'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toggleError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
          }}
        >
          <span>{toggleError}</span>
          <button
            onClick={() => setToggleError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-red)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.08)',
            color: 'var(--admin-red)',
            textAlign: 'center',
          }}
        >
          Failed to load universes — {error instanceof Error ? error.message : 'unknown error'}
        </div>
      ) : universes.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          {search ? `No universes match “${search}”` : 'No universes yet.'}
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {bulkSelection.size > 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--admin-orange)',
                  backgroundColor: 'rgba(232,66,10,0.08)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-orange)' }}>
                  {bulkSelection.size} selected
                </span>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button
                    disabled={bulkToggleMutation.isPending}
                    onClick={() =>
                      bulkToggleMutation.mutate({ ids: Array.from(bulkSelection), isEnabled: true })
                    }
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'var(--admin-emerald)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Enable all
                  </button>
                  <button
                    disabled={bulkToggleMutation.isPending}
                    onClick={() =>
                      bulkToggleMutation.mutate({
                        ids: Array.from(bulkSelection),
                        isEnabled: false,
                      })
                    }
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      background: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Disable all
                  </button>
                </div>
              </div>
            )}
            {universes.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  position: 'relative',
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
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16 }}>{u.displayName || u.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>{u.name}</p>
                      {u.name.toLowerCase() === 'creator' ? (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(232, 66, 10, 0.2)',
                            color: 'var(--admin-orange)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Creator Uploads Only
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#93c5fd',
                            textTransform: 'uppercase',
                          }}
                        >
                          Admin Managed
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: u.isEnabled ? 'rgba(13,59,46,0.3)' : 'rgba(154,138,122,0.15)',
                        color: u.isEnabled ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: u.isEnabled ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                        }}
                      />
                      {u.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.isEnabled}
                      aria-label={`Toggle ${u.displayName || u.name}`}
                      disabled={togglingId === u.id}
                      onClick={() => toggleMutation.mutate({ id: u.id, isEnabled: !u.isEnabled })}
                      title={u.isEnabled ? 'Click to disable universe' : 'Click to enable universe'}
                      style={{
                        position: 'relative',
                        width: 44,
                        height: 24,
                        borderRadius: 999,
                        border: 'none',
                        backgroundColor: u.isEnabled ? 'var(--admin-orange)' : 'rgba(255,255,255,0.15)',
                        cursor: togglingId === u.id ? 'wait' : 'pointer',
                        transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: togglingId === u.id ? 0.6 : 1,
                        padding: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          transform: u.isEnabled ? 'translateX(20px)' : 'translateX(0px)',
                          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </button>
                  </div>
                </div>
                {syncIssues[u.id] && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      marginBottom: 12,
                      borderRadius: 10,
                      border: '1px solid rgba(180, 120, 20, 0.4)',
                      backgroundColor: 'rgba(180, 120, 20, 0.12)',
                      color: 'var(--admin-amber)',
                      fontSize: 12,
                    }}
                  >
                    <span>
                      Not synced to Redis — services still see the previous state (
                      {syncIssues[u.id]?.join(', ')}).
                    </span>
                    <button
                      onClick={() => resyncMutation.mutate(u.id)}
                      disabled={resyncMutation.isPending}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        border: '1px solid currentColor',
                        background: 'transparent',
                        color: 'inherit',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {resyncMutation.isPending ? 'Re-syncing…' : 'Re-sync'}
                    </button>
                  </div>
                )}
                {u.description && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                    {u.description}
                  </p>
                )}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={bulkSelection.has(u.id)}
                        onChange={() => toggleBulk(u.id)}
                        aria-label={`Select ${u.name}`}
                      />
                      {u.contentCount || 0} items
                    </label>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setEditForm({
                          displayName: u.displayName || '',
                          description: u.description || '',
                          icon: (u as any).icon || '',
                          color: (u as any).color || '#E8420A',
                          sortOrder: (u as any).sortOrder ?? 0,
                          isEnabled: u.isEnabled ?? true,
                        });
                        setEditTarget(u);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const newName = window.prompt(
                          `Clone "${u.displayName || u.name}" — new slug:`,
                          `${u.name}-copy`
                        );
                        if (newName && newName.trim())
                          cloneMutation.mutate({ id: u.id, data: { name: newName.trim() } });
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => void exportUniverse(u)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Export
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await confirm({ title: "Delete Universe", message: "Are you sure you want to delete this universe? All associated data will be removed.", variant: "danger" }); if (ok) deleteMutation.mutate(u.id);
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid #CC1C1C',
                        background: 'transparent',
                        color: 'var(--admin-red)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: page <= 1 ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Prev
              </button>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Page {page} of {totalPages} · {total} total
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: page >= totalPages ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit universe modal */}
      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setEditTarget(null)}
        >
          <div
            style={{
              width: 'min(460px, 92vw)',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Edit "{editTarget.displayName || editTarget.name}"
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Display Name *
                </label>
                <input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Display name"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Icon
                  </label>
                  <input
                    value={editForm.icon}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                    placeholder="e.g. film"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Color
                  </label>
                  <input
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    placeholder="#E8420A"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editForm.sortOrder}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.isEnabled}
                  onChange={(e) => setEditForm({ ...editForm, isEnabled: e.target.checked })}
                />
                <span>Active on public platform</span>
              </label>

              {updateMutation.isError && (
                <p style={{ color: 'var(--admin-red)', fontSize: 13, margin: 0 }}>
                  {(updateMutation.error as Error)?.message || 'Update failed'}
                </p>
              )}
              {cloneError && (
                <p style={{ color: 'var(--admin-red)', fontSize: 13, margin: 0 }}>{cloneError}</p>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => setEditTarget(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={updateMutation.isPending || !editForm.displayName.trim()}
                  onClick={() =>
                    updateMutation.mutate({
                      id: editTarget.id,
                      data: {
                        displayName: editForm.displayName.trim(),
                        description: editForm.description || undefined,
                        icon: editForm.icon || undefined,
                        color: editForm.color || undefined,
                        sortOrder: editForm.sortOrder,
                        isEnabled: editForm.isEnabled,
                      },
                    })
                  }
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: !editForm.displayName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
