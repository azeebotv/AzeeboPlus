import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, asArray, str, num, assertSuccess } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Detail page for a single Agbala storyworld.
 *
 * Upstream contract (vertical-service) is intentionally narrower than the
 * admin proxy's surface: storyworlds are read-only upstream — there are no
 * POST/PATCH/DELETE routes for worlds, so this page is deliberately
 * read-only. What GET /admin/agbala/storyworlds/:id actually returns is the
 * world's *titles* (upstream getTitles filtered by world), and characters
 * live at the nested /vertical/characters?universe= route — both rendered
 * here alongside the world metadata from the list endpoint.
 */

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--admin-text-muted)',
  marginBottom: 4,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <div style={{ color: 'var(--admin-text)', fontSize: 14 }}>{children}</div>
    </div>
  );
}

const chip: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 12,
  backgroundColor: 'rgba(154,138,122,0.15)',
  color: 'var(--admin-text-muted)',
};

const card: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  background: 'var(--admin-surface)',
};

// Shared by the path + quiz forms' inputs and buttons.
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
  boxSizing: 'border-box',
};
const btn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid var(--admin-card)',
  background: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = {
  ...btn,
  background: 'var(--admin-orange)',
  color: 'white',
  cursor: 'pointer',
};

interface PathDraft {
  name: string;
  description: string;
  icon: string;
  color: string;
  totalSteps: string;
  sortOrder: string;
}

const DEFAULT_PATH_COLOR = 'var(--admin-grey)';

const EMPTY_PATH: PathDraft = {
  name: '',
  description: '',
  icon: '',
  color: DEFAULT_PATH_COLOR,
  totalSteps: '5',
  sortOrder: '0',
};

export default function StoryworldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Paths CRUD — the backend exposes POST storyworlds/:id/paths and
  // PATCH/DELETE paths/:id, but the page was read-only. Mirrors CreatePathDto:
  // name required; description/icon/color/totalSteps/sortOrder optional with
  // totalSteps ≥ 1 and sortOrder ≥ 0.
  const [pathPanelOpen, setPathPanelOpen] = useState(false);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [pathDraft, setPathDraft] = useState<PathDraft>(EMPTY_PATH);
  const [pathError, setPathError] = useState<string | null>(null);

  // World metadata lives on the list payload (name, description, counts).
  const worldQ = useQuery({
    queryKey: ['storyworld-meta', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getStoryworlds();
      const worlds = asArray<Record<string, unknown>>(res.success ? res.data : null);
      return worlds.find((w) => str(w.id) === id) ?? null;
    },
  });

  // GET storyworlds/:id → the world's titles, paginated.
  const titlesQ = useQuery({
    queryKey: ['storyworld', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getStoryworldById(id as string);
      return asArray<Record<string, unknown>>(res.success ? res.data : null);
    },
  });

  // Characters are filterable by world/universe id on the nested route.
  const charsQ = useQuery({
    queryKey: ['storyworld-characters', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getCharacters(id as string);
      return asArray<Record<string, unknown>>(res.success ? res.data : null).map(asRecord);
    },
  });

  const world = worldQ.data ?? null;
  const titles = titlesQ.data ?? [];
  const characters = charsQ.data ?? [];

  // Paths load from the upstream GET storyworlds/:id/paths route (paginated,
  // searchable — same envelope as the quizzes list) and survive reloads;
  // mutations invalidate the query so the list refetches. pageQuery/search
  // are part of the query key so each combination refetches independently.
  const [pathPage, setPathPage] = useState(1);
  const [pathSearch, setPathSearch] = useState('');
  const [pathSearchInput, setPathSearchInput] = useState('');
  const PATH_PAGE_SIZE = 10;

  const pathsQ = useQuery({
    queryKey: ['storyworld-paths', id, pathPage, pathSearch],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getPaths(id as string, {
        page: pathPage,
        limit: PATH_PAGE_SIZE,
        search: pathSearch || undefined,
      });
      const env = res.success && res.data ? (res.data as Record<string, unknown>) : null;
      return {
        items: asArray<Record<string, unknown>>(env),
        total: num(env?.total, 0),
        totalPages: num(env?.totalPages, 1),
      };
    },
  });
  const paths = pathsQ.data?.items ?? [];
  const pathsTotal = pathsQ.data?.total ?? 0;
  const pathsTotalPages = pathsQ.data?.totalPages ?? 1;

  const queryClient = useQueryClient();
  const invalidatePaths = () =>
    queryClient.invalidateQueries({ queryKey: ['storyworld-paths', id] });

  const savePathMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        name: pathDraft.name.trim(),
        description: pathDraft.description.trim() || undefined,
        icon: pathDraft.icon.trim() || undefined,
        color: pathDraft.color || undefined,
        totalSteps: pathDraft.totalSteps ? Number(pathDraft.totalSteps) : undefined,
        sortOrder: pathDraft.sortOrder ? Number(pathDraft.sortOrder) : undefined,
      };
      const res = editingPathId
        ? await adminApi.updatePath(editingPathId, body)
        : await adminApi.createPath(id as string, body);
      // apiFetch resolves (not rejects) on 4xx/5xx — enforce success here so
      // the panel stays open and the inline error shows instead of silently
      // closing on a failed write.
      return assertSuccess(res);
    },
    onSuccess: () => {
      setPathDraft(EMPTY_PATH);
      setEditingPathId(null);
      setPathError(null);
      setPathPanelOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['storyworld-paths', id] });
    },
    onError: (err) => {
      setPathError(err instanceof Error ? err.message : 'Failed to save path');
    },
  });

  const deletePathMutation = useMutation({
    mutationFn: (pathId: string) => adminApi.deletePath(pathId),
    onSuccess: () => invalidatePaths(),
  });

  const submitPath = () => {
    // Client-side validation mirroring CreatePathDto rules.
    if (!pathDraft.name.trim()) {
      setPathError('Name is required.');
      return;
    }
    const steps = Number(pathDraft.totalSteps);
    if (pathDraft.totalSteps && (!Number.isFinite(steps) || steps < 1)) {
      setPathError('Total steps must be at least 1.');
      return;
    }
    const order = Number(pathDraft.sortOrder);
    if (pathDraft.sortOrder && (!Number.isFinite(order) || order < 0)) {
      setPathError('Sort order must be 0 or greater.');
      return;
    }
    setPathError(null);
    savePathMutation.mutate();
  };

  const startEditPath = (p: Record<string, unknown>) => {
    setEditingPathId(str(p.id));
    setPathDraft({
      name: str(p.name),
      description: str(p.description),
      icon: str(p.icon),
      color: str(p.color, DEFAULT_PATH_COLOR),
      totalSteps: p.totalSteps != null ? String(num(p.totalSteps, 5)) : '',
      sortOrder: p.sortOrder != null ? String(num(p.sortOrder, 0)) : '',
    });
    setPathPanelOpen(true);
  };

  // ── Quizzes for this storyworld ────────────────────────────────────────────
  // Mirrors the quizzes tab on the Agbala list page, but permanently scoped
  // to this world via the upstream storyworldId filter.
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    question: '',
    options: '',
    correctAnswerIndex: 0,
    explanation: '',
  });
  const [quizError, setQuizError] = useState<string | null>(null);

  const quizzesQ = useQuery({
    queryKey: ['storyworld-quizzes', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getQuizzes(id as string);
      const env = res.success && res.data ? (res.data as Record<string, unknown>) : null;
      return asArray<Record<string, unknown>>(env);
    },
  });
  const quizzes = quizzesQ.data ?? [];

  const createQuizMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      // apiFetch resolves (not rejects) on 4xx/5xx — enforce success so the
      // modal stays open and the inline error shows on a failed write.
      return assertSuccess(await adminApi.createQuiz(data));
    },
    onSuccess: () => {
      setQuizForm({
        title: '',
        description: '',
        question: '',
        options: '',
        correctAnswerIndex: 0,
        explanation: '',
      });
      setQuizError(null);
      setQuizModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['storyworld-quizzes', id] });
    },
    onError: (err) => setQuizError(err instanceof Error ? err.message : 'Failed to create quiz'),
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: string) => assertSuccess(await adminApi.deleteQuiz(quizId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['storyworld-quizzes', id] });
    },
    onError: (err) => setQuizError(err instanceof Error ? err.message : 'Failed to delete quiz'),
  });

  const submitQuiz = () => {
    if (!quizForm.title.trim()) {
      setQuizError('Title is required.');
      return;
    }
    if (!quizForm.question.trim()) {
      setQuizError('The question text is required.');
      return;
    }
    const options = quizForm.options
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (options.length < 2) {
      setQuizError('Provide at least two options, separated by commas.');
      return;
    }
    const idx = Number(quizForm.correctAnswerIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
      setQuizError(`Correct answer index must be between 0 and ${options.length - 1}.`);
      return;
    }
    setQuizError(null);
    createQuizMutation.mutate({
      title: quizForm.title.trim(),
      description: quizForm.description.trim() || undefined,
      storyworldId: id,
      questions: [
        {
          question: quizForm.question.trim(),
          options,
          correctAnswerIndex: idx,
          explanation: quizForm.explanation.trim() || undefined,
        },
      ],
    });
  };

  const openQuizModal = () => {
    setQuizForm({
      title: '',
      description: '',
      question: '',
      options: '',
      correctAnswerIndex: 0,
      explanation: '',
    });
    setQuizError(null);
    setQuizModalOpen(true);
  };

  return (
    <div>
      <button
        onClick={() => navigate('/agbala')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          color: 'var(--admin-text-muted)',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <Icon name="arrowLeft" size={16} />
        <span>Back to Agbala</span>
      </button>

      {worldQ.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading storyworld…</p>
      ) : !world ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Storyworld not found.</p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {str(world.imageUrl) ? (
              <img
                src={str(world.imageUrl)}
                alt=""
                style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }}
              />
            ) : null}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
              {str(world.name, 'Untitled world')}
            </h1>
            <span style={chip}>{str(world.status, 'unknown')}</span>
          </div>

          {str(world.description) && (
            <p
              style={{
                color: 'var(--admin-text-muted)',
                fontSize: 14,
                marginBottom: 24,
                maxWidth: 640,
              }}
            >
              {str(world.description)}
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <Field label="Titles">{num(world.titleCount)}</Field>
            <Field label="Characters">{num(world.characterCount)}</Field>
            <Field label="Locations">{num(world.locationCount)}</Field>
            <Field label="World ID">
              <code style={{ fontSize: 12 }}>{str(world.id)}</code>
            </Field>
          </div>

          {/* Paths CRUD panel — previously backend-only surface */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <p style={{ ...labelStyle, marginBottom: 0 }}>Learning Paths</p>
              <button
                onClick={() => {
                  if (pathPanelOpen && !editingPathId) {
                    setPathPanelOpen(false);
                  } else {
                    setEditingPathId(null);
                    setPathDraft(EMPTY_PATH);
                    setPathError(null);
                    setPathPanelOpen(true);
                  }
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  background: 'transparent',
                  color: 'var(--admin-orange)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {pathPanelOpen && !editingPathId ? 'Close' : '+ New Path'}
              </button>
            </div>

            {pathPanelOpen && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: 'var(--admin-surface)',
                  marginBottom: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="text"
                    placeholder="Path name *"
                    value={pathDraft.name}
                    onChange={(e) => setPathDraft({ ...pathDraft, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      background: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="text"
                    placeholder="Description"
                    value={pathDraft.description}
                    onChange={(e) => setPathDraft({ ...pathDraft, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      background: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Icon (emoji or URL)"
                  value={pathDraft.icon}
                  onChange={(e) => setPathDraft({ ...pathDraft, icon: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    background: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={pathDraft.color}
                    onChange={(e) => setPathDraft({ ...pathDraft, color: e.target.value })}
                    style={{
                      width: 40,
                      height: 34,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                    aria-label="Path color"
                  />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {pathDraft.color}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="Total steps"
                  value={pathDraft.totalSteps}
                  onChange={(e) => setPathDraft({ ...pathDraft, totalSteps: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    background: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Sort order"
                  value={pathDraft.sortOrder}
                  onChange={(e) => setPathDraft({ ...pathDraft, sortOrder: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    background: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                  }}
                />
                {pathError && (
                  <p
                    style={{
                      gridColumn: '1 / -1',
                      fontSize: 12,
                      color: 'var(--admin-red)',
                      margin: 0,
                    }}
                  >
                    {pathError}
                  </p>
                )}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    onClick={() => {
                      setPathPanelOpen(false);
                      setEditingPathId(null);
                      setPathError(null);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      background: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPath}
                    disabled={savePathMutation.isPending}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--admin-orange)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: savePathMutation.isPending ? 'wait' : 'pointer',
                    }}
                  >
                    {savePathMutation.isPending
                      ? 'Saving…'
                      : editingPathId
                        ? 'Save Changes'
                        : 'Create Path'}
                  </button>
                </div>
              </div>
            )}

            {/* Search — committed on Enter/button to avoid a request per
                keystroke; resetting the query always returns to page 1. */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={pathSearchInput}
                onChange={(e) => setPathSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPathPage(1);
                    setPathSearch(pathSearchInput.trim());
                  }
                }}
                placeholder="Search paths by name or description…"
                style={{
                  flex: 1,
                  maxWidth: 320,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              {pathSearchInput !== pathSearch && (
                <button
                  onClick={() => {
                    setPathPage(1);
                    setPathSearch(pathSearchInput.trim());
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    background: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Search
                </button>
              )}
              {pathSearch && (
                <button
                  onClick={() => {
                    setPathSearchInput('');
                    setPathSearch('');
                    setPathPage(1);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {pathsQ.isLoading ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading paths…</p>
            ) : paths.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                {pathSearch
                  ? `No paths match "${pathSearch}" — clear the search or create one.`
                  : 'No learning paths yet — create the first one.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {paths.map((p) => (
                  <div
                    key={str(p.id)}
                    style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: str(p.color, 'var(--admin-grey)'),
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {str(p.icon) && <span style={{ marginRight: 6 }}>{str(p.icon)}</span>}
                        {str(p.name, 'Unnamed path')}
                      </p>
                      {str(p.description) && (
                        <p
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {str(p.description)}
                        </p>
                      )}
                    </div>
                    {p.totalSteps != null && <span style={chip}>{num(p.totalSteps)} steps</span>}
                    <button
                      onClick={() => startEditPath(p)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-card)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete path "${str(p.name)}"?`)) {
                          deletePathMutation.mutate(str(p.id));
                        }
                      }}
                      disabled={deletePathMutation.isPending}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'transparent',
                        color: 'var(--admin-red)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination footer — mirrors the quizzes list: total count plus
                prev/next through the server-computed totalPages. */}
            {(pathsTotal > 0 || pathSearch) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                  {pathsTotal} path{pathsTotal === 1 ? '' : 's'}
                  {pathSearch ? ` matching "${pathSearch}"` : ''} · page {pathPage} of{' '}
                  {pathsTotalPages}
                </span>
                {pathsTotalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPathPage((p) => Math.max(1, p - 1))}
                      disabled={pathPage <= 1}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-card)',
                        background: 'transparent',
                        color: pathPage <= 1 ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                        fontSize: 12,
                        cursor: pathPage <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPathPage((p) => Math.min(pathsTotalPages, p + 1))}
                      disabled={pathPage >= pathsTotalPages}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-card)',
                        background: 'transparent',
                        color:
                          pathPage >= pathsTotalPages
                            ? 'var(--admin-text-muted)'
                            : 'var(--admin-text)',
                        fontSize: 12,
                        cursor: pathPage >= pathsTotalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <p style={{ ...labelStyle, marginBottom: 0 }}>Quizzes</p>
              <button
                onClick={openQuizModal}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  background: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + New Quiz
              </button>
            </div>
            {quizzesQ.isLoading ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading quizzes…</p>
            ) : quizzes.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                No quizzes for this storyworld yet — create the first one.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quizzes.map((q) => (
                  <div
                    key={str(q.id)}
                    style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {str(q.title, 'Untitled quiz')}
                      </p>
                      {str(q.description) && (
                        <p
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {str(q.description)}
                        </p>
                      )}
                    </div>
                    <span style={chip}>{num(q.questionCount, 0)} questions</span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete quiz "${str(q.title)}"?`)) {
                          deleteQuizMutation.mutate(str(q.id));
                        }
                      }}
                      disabled={deleteQuizMutation.isPending}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'transparent',
                        color: 'var(--admin-red)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            {quizError && (
              <p
                style={{
                  color: 'var(--admin-red)',
                  fontSize: 12,
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                {quizError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <p style={labelStyle}>Titles in this world</p>
            {titlesQ.isLoading ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading…</p>
            ) : titles.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                No titles recorded for this world.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {titles.map((t) => (
                  <div
                    key={str(t.id)}
                    style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {str(t.name, str(t.title, 'Untitled'))}
                      </p>
                      {str(t.description) && (
                        <p
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {str(t.description)}
                        </p>
                      )}
                    </div>
                    {str(t.type) && <span style={chip}>{str(t.type)}</span>}
                    <span style={chip}>{str(t.status, 'unknown')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p style={labelStyle}>Characters</p>
            {charsQ.isLoading ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading…</p>
            ) : characters.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                No characters recorded for this world.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {characters.map((c) => (
                  <div
                    key={str(c.id)}
                    style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    {str(c.imageUrl) ? (
                      <img
                        src={str(c.imageUrl)}
                        alt=""
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {str(c.name, 'Unnamed')}
                      </p>
                      {str(c.description) && (
                        <p
                          style={{
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {str(c.description)}
                        </p>
                      )}
                    </div>
                    {str(c.path) && <span style={chip}>{str(c.path)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Quiz create modal ─────────────────────────────────────────────── */}
      {quizModalOpen && (
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
          onClick={() => setQuizModalOpen(false)}
        >
          <div
            style={{
              width: 'min(560px, 92vw)',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Quiz</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={quizForm.title}
                onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                placeholder="Quiz title *"
                style={inputStyle}
              />
              <input
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Description"
                style={inputStyle}
              />
              <input
                value={quizForm.question}
                onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                placeholder="Question *"
                style={inputStyle}
              />
              <input
                value={quizForm.options}
                onChange={(e) => setQuizForm({ ...quizForm, options: e.target.value })}
                placeholder="Options (comma-separated) *"
                style={inputStyle}
              />
              <input
                type="number"
                min={0}
                value={quizForm.correctAnswerIndex}
                onChange={(e) =>
                  setQuizForm({ ...quizForm, correctAnswerIndex: Number(e.target.value) })
                }
                placeholder="Correct option index (0-based)"
                style={inputStyle}
              />
              <input
                value={quizForm.explanation}
                onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
                placeholder="Explanation (optional)"
                style={inputStyle}
              />
              {quizError && (
                <p style={{ color: 'var(--admin-red)', fontSize: 12, margin: 0 }}>{quizError}</p>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setQuizModalOpen(false)} style={btn}>
                  Cancel
                </button>
                <button
                  disabled={
                    !quizForm.title.trim() ||
                    !quizForm.question.trim() ||
                    createQuizMutation.isPending
                  }
                  onClick={submitQuiz}
                  style={btnPrimary}
                >
                  {createQuizMutation.isPending ? 'Creating…' : 'Create Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
