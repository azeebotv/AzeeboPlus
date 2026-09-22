import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { Storyworld } from '@/lib/admin-types';
import { asArray, unwrapList, assertSuccess } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Agbala — the interactive narrative engine. Full CRUD:
 * storyworlds (create / edit / delete / publish), characters (create /
 * edit / delete), quizzes (create with dynamic questions / delete), and
 * the theory moderation review queue (approve / reject-with-reason).
 */

type Tab = 'storyworlds' | 'characters' | 'quizzes' | 'moderation';

const CHARACTER_PATHS = ['warrior', 'sage', 'trickster', 'healer'] as const;

interface CharacterRow {
  id: string;
  name: string;
  path?: string;
  imageUrl?: string;
  backstory?: string;
  storyworldTitle?: string;
}

interface QuizRow {
  id: string;
  title: string;
  description?: string;
  questionCount?: number;
  storyworldId?: string;
}

/** One pending theory in the upstream moderation review queue. */
interface ReviewQueueItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  storyworldSlug?: string | null;
  submittedAt?: string;
  status: string;
}

/** One editable question inside the quiz-creation modal. */
interface QuizQuestionDraft {
  question: string;
  options: string; // comma-separated while editing
  correctAnswerIndex: number;
  explanation: string;
}

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
  padding: '8px 18px',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
  color: 'white',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  ...btn,
  color: 'var(--admin-red)',
  borderColor: 'rgba(204,28,28,0.4)',
};

export default function AgbalaPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('storyworlds');
  const [selectedSw, setSelectedSw] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);

  // Storyworld form (create + edit)
  const [swModal, setSwModal] = useState<null | 'create' | Storyworld>(null);
  const [swForm, setSwForm] = useState({ title: '', description: '', imageUrl: '' });

  // Character form (create + edit)
  const [charModal, setCharModal] = useState<null | 'create' | CharacterRow>(null);
  const [charForm, setCharForm] = useState({
    name: '',
    path: 'warrior',
    imageUrl: '',
    backstory: '',
  });

  // Quiz form
  const [quizModal, setQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    storyworldId: '',
    questions: [
      { question: '', options: '', correctAnswerIndex: 0, explanation: '' },
    ] as QuizQuestionDraft[],
  });

  // Moderation review queue
  const [queuePage, setQueuePage] = useState(1);
  const [rejecting, setRejecting] = useState<ReviewQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const storyworldsQ = useQuery({
    queryKey: ['admin', 'agbala', 'storyworlds'],
    queryFn: async () => {
      const res = await adminApi.getStoryworlds();
      if (res.success && res.data) {
        // Accept bare array or { items } envelope via the shared guard.
        const list = asArray<Record<string, unknown>>(res.data);
        // vertical-service returns name/status/locationCount; the page
        // contract (and Storyworld type) uses title/isPublished/pathCount —
        // normalize here so upstream field drift can't blank the cards.
        return list.map((s) => ({
          ...s,
          title: (s.title as string) ?? (s.name as string) ?? '(untitled)',
          isPublished:
            (s.isPublished as boolean | undefined) ??
            (s.status === 'active' || s.status === 'published'),
        })) as unknown as Storyworld[];
      }
      return [];
    },
  });

  const charactersQ = useQuery({
    queryKey: ['admin', 'agbala', 'characters', selectedSw],
    queryFn: async () => {
      // Nested route: characters list requires the storyworld id.
      const res = await adminApi.getCharacters(selectedSw as string);
      return res.success ? asArray<CharacterRow>(res.data) : [];
    },
    enabled: tab === 'characters' && !!selectedSw,
  });

  const quizzesQ = useQuery({
    queryKey: ['admin', 'agbala', 'quizzes', selectedSw],
    queryFn: async () => {
      const res = await adminApi.getQuizzes(selectedSw);
      return res.success ? asArray<QuizRow>(res.data) : [];
    },
    enabled: tab === 'quizzes',
  });

  const reviewQueueQ = useQuery({
    queryKey: ['admin', 'agbala', 'review-queue', queuePage],
    queryFn: async () => {
      const res = await adminApi.getReviewQueue(queuePage);
      // Upstream returns the paginated envelope under data; unwrapList
      // handles both that shape and a bare array fallback.
      const { items, total } = res.success
        ? unwrapList<ReviewQueueItem>(res.data)
        : { items: [] as ReviewQueueItem[], total: null };
      return { items, total: total ?? items.length };
    },
    enabled: tab === 'moderation',
  });
  const queueItems = reviewQueueQ.data?.items ?? [];
  const queueTotal = reviewQueueQ.data?.total ?? 0;
  const queueLimit = 20;
  const queueTotalPages = Math.max(1, Math.ceil(queueTotal / queueLimit));

  const storyworlds = storyworldsQ.data || [];

  // Characters are fetched per storyworld (nested upstream route) — default
  // the filter to the first world so the tab is never stuck empty.
  useEffect(() => {
    if (tab === 'characters' && !selectedSw && storyworlds.length > 0) {
      setSelectedSw(storyworlds[0]?.id);
    }
  }, [tab, selectedSw, storyworlds]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'agbala'] });
  };

  const onError = (e: unknown) => setFormError((e as Error).message || 'Request failed');

  // ── Storyworld mutations ───────────────────────────────────────────────────
  const createSwMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createStoryworld(data),
    onSuccess: () => {
      setSwModal(null);
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const updateSwMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateStoryworld(id, data),
    onSuccess: () => {
      setSwModal(null);
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const deleteSwMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStoryworld(id),
    onSuccess: () => {
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const publishSwMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? adminApi.publishStoryworld(id) : adminApi.unpublishStoryworld(id),
    onSuccess: () => {
      setFormError(null);
      invalidateAll();
    },
    onError,
  });

  // ── Character mutations ────────────────────────────────────────────────────
  const saveCharMutation = useMutation({
    mutationFn: (input: { id?: string; data: Record<string, unknown>; storyworldId?: string }) =>
      input.id
        ? adminApi.updateCharacter(input.id, input.data)
        : adminApi.createCharacter(input.storyworldId as string, input.data),
    onSuccess: () => {
      setCharModal(null);
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const deleteCharMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCharacter(id),
    onSuccess: () => {
      setFormError(null);
      invalidateAll();
    },
    onError,
  });

  // ── Quiz mutations ───────────────────────────────────────────────────────
  const createQuizMutation = useMutation({
    // assertSuccess so a failed write keeps the modal open and the inline
    // error shows instead of the modal silently closing on a 4xx/5xx.
    mutationFn: async (data: Record<string, unknown>) =>
      assertSuccess(await adminApi.createQuiz(data)),
    onSuccess: () => {
      setQuizModal(false);
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.deleteQuiz(id)),
    onSuccess: () => {
      setFormError(null);
      invalidateAll();
    },
    onError,
  });

  // ── Moderation mutations ──────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async (contentId: string) =>
      assertSuccess(await adminApi.approveAgbalaContent(contentId)),
    onSuccess: () => {
      setFormError(null);
      invalidateAll();
    },
    onError,
  });
  const rejectMutation = useMutation({
    mutationFn: async (input: { contentId: string; reason: string }) =>
      assertSuccess(await adminApi.rejectAgbalaContent(input.contentId, input.reason)),
    onSuccess: () => {
      setRejecting(null);
      setRejectReason('');
      setFormError(null);
      invalidateAll();
    },
    onError,
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'storyworlds', label: 'Storyworlds', count: storyworlds.length },
    { key: 'characters', label: 'Characters' },
    { key: 'quizzes', label: 'Quizzes' },
    {
      key: 'moderation',
      label: 'Moderation',
      count: tab === 'moderation' ? queueTotal : undefined,
    },
  ];

  const baseCard: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    border: '1px solid var(--admin-card)',
    backgroundColor: 'var(--admin-surface)',
  };

  const openCreateSw = () => {
    setSwForm({ title: '', description: '', imageUrl: '' });
    setSwModal('create');
  };
  const openEditSw = (s: Storyworld) => {
    setSwForm({
      title: s.title || '',
      description: s.description || '',
      imageUrl: s.imageUrl || '',
    });
    setSwModal(s);
  };

  const openCreateChar = () => {
    setCharForm({ name: '', path: 'warrior', imageUrl: '', backstory: '' });
    setCharModal('create');
  };
  const openEditChar = (c: CharacterRow) => {
    setCharForm({
      name: c.name || '',
      path: c.path || 'warrior',
      imageUrl: c.imageUrl || '',
      backstory: c.backstory || '',
    });
    setCharModal(c);
  };

  const emptyQuizQuestions = (): QuizQuestionDraft[] => [
    { question: '', options: '', correctAnswerIndex: 0, explanation: '' },
  ];
  const openCreateQuiz = () => {
    setQuizForm({ title: '', description: '', storyworldId: '', questions: emptyQuizQuestions() });
    setQuizModal(true);
  };
  const updateQuestion = (idx: number, patch: Partial<QuizQuestionDraft>) => {
    setQuizForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  };
  const addQuestion = () =>
    setQuizForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        { question: '', options: '', correctAnswerIndex: 0, explanation: '' },
      ],
    }));
  const removeQuestion = (idx: number) =>
    setQuizForm((f) => ({
      ...f,
      // Never leave the form with zero questions — reset to one blank row.
      questions:
        f.questions.length > 1 ? f.questions.filter((_, i) => i !== idx) : emptyQuizQuestions(),
    }));

  /**
   * Client-side mirror of the upstream CreateQuizDto so the Submit button
   * can block early with a specific message instead of a generic 400.
   */
  const validateQuizForm = (): string | null => {
    if (!quizForm.title.trim()) return 'Quiz title is required';
    if (quizForm.questions.length === 0) return 'Add at least one question';
    for (const [i, q] of quizForm.questions.entries()) {
      const label = quizForm.questions.length > 1 ? `Question ${i + 1}: ` : '';
      if (!q.question.trim()) return `${label}question text is required`;
      const options = q.options
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length < 2) return `${label}needs at least 2 options (comma-separated)`;
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= options.length) {
        return `${label}correct answer index must be between 0 and ${options.length - 1}`;
      }
    }
    return null;
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="bookOpen" size={28} color="var(--admin-orange)" />
            <span>Agbala</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            Interactive narrative engine — storyworlds, characters, and quizzes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'storyworlds' && (
            <button onClick={openCreateSw} style={btnPrimary}>
              + New Storyworld
            </button>
          )}
          {tab === 'characters' && (
            <button
              onClick={openCreateChar}
              style={btnPrimary}
              disabled={!selectedSw}
              title={selectedSw ? undefined : 'Select a storyworld first'}
            >
              + New Character
            </button>
          )}
          {tab === 'quizzes' && (
            <button onClick={openCreateQuiz} style={btnPrimary}>
              + New Quiz
            </button>
          )}
        </div>
      </div>

      {formError && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 8,
            border: '1px solid rgba(204,28,28,0.4)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
            fontSize: 13,
          }}
        >
          {formError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: tab === t.key ? 'var(--admin-orange)' : 'var(--admin-surface)',
              background: tab === t.key ? 'rgba(232,66,10,0.15)' : 'transparent',
              color: tab === t.key ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
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

      {/* ── Storyworlds ─────────────────────────────────────────────────── */}
      {tab === 'storyworlds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storyworldsQ.isLoading ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Loading...
            </p>
          ) : storyworlds.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              No storyworlds yet — create the first one.
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
                    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                      {s.title}{' '}
                      <Link
                        to={`/agbala/storyworlds/${s.id}`}
                        style={{ fontSize: 12, textDecoration: 'none' }}
                      >
                        View →
                      </Link>
                    </h3>
                    {s.description && (
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
                        {s.description}
                      </p>
                    )}
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>
                      {s.characterCount || 0} characters · {s.locationCount || 0} locations
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: s.isPublished
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(107,114,128,0.15)',
                      color: s.isPublished ? 'var(--admin-emerald)' : 'var(--admin-text-muted)',
                    }}
                  >
                    {s.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEditSw(s)} style={btn}>
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        publishSwMutation.mutate({ id: s.id, publish: !s.isPublished })
                      }
                      style={btn}
                    >
                      {s.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(`Delete storyworld "${s.title}"? This cannot be undone.`)
                        )
                          deleteSwMutation.mutate(s.id);
                      }}
                      style={btnDanger}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Characters ──────────────────────────────────────────────────── */}
      {tab === 'characters' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginRight: 8 }}>
              Filter by storyworld:
            </label>
            <select
              value={selectedSw || ''}
              onChange={(e) => setSelectedSw(e.target.value || undefined)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'var(--admin-darker)',
                color: 'var(--admin-text)',
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
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
                Loading...
              </p>
            ) : (charactersQ.data ?? []).length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
                No characters{selectedSw ? ' in this storyworld' : ''}.
              </p>
            ) : (
              (charactersQ.data ?? []).map((c) => (
                <div key={c.id} style={baseCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{c.name}</h3>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                        {c.path || '—'} · {c.storyworldTitle || 'Unknown world'}
                      </p>
                    </div>
                    <button onClick={() => openEditChar(c)} style={btn}>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete character "${c.name}"?`))
                          deleteCharMutation.mutate(c.id);
                      }}
                      style={btnDanger}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Quizzes ─────────────────────────────────────────────────────── */}
      {tab === 'quizzes' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginRight: 8 }}>
              Filter by storyworld:
            </label>
            <select
              value={selectedSw || ''}
              onChange={(e) => setSelectedSw(e.target.value || undefined)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'var(--admin-darker)',
                color: 'var(--admin-text)',
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
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
                Loading...
              </p>
            ) : (quizzesQ.data ?? []).length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
                No quizzes yet.
              </p>
            ) : (
              (quizzesQ.data ?? []).map((q) => (
                <div key={q.id} style={baseCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{q.title}</h3>
                      <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                        {q.questionCount ?? 0} questions
                        {q.storyworldId ? '' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete quiz "${q.title}"?`))
                          deleteQuizMutation.mutate(q.id);
                      }}
                      style={btnDanger}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Moderation review queue ─────────────────────────────────────── */}
      {tab === 'moderation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviewQueueQ.isLoading ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Loading...
            </p>
          ) : queueItems.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Review queue is clear — no pending theory submissions.
            </p>
          ) : (
            queueItems.map((item) => (
              <div key={item.id} style={baseCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{item.title}</h3>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>
                      {item.type || 'theory'}
                      {item.authorName ? ` · by ${item.authorName}` : ''}
                      {item.submittedAt
                        ? ` · submitted ${new Date(item.submittedAt).toLocaleString()}`
                        : ''}
                    </p>
                    {item.content && (
                      <p
                        style={{
                          color: 'var(--admin-text)',
                          fontSize: 13,
                          marginTop: 8,
                          whiteSpace: 'pre-wrap',
                          maxHeight: 120,
                          overflow: 'hidden',
                        }}
                      >
                        {item.content}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => approveMutation.mutate(item.id)}
                      disabled={approveMutation.isPending}
                      style={{
                        ...btn,
                        color: 'var(--admin-emerald)',
                        borderColor: 'rgba(16,185,129,0.4)',
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectReason('');
                        setRejecting(item);
                      }}
                      disabled={rejectMutation.isPending}
                      style={btnDanger}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {queueTotalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '8px 0',
                color: 'var(--admin-text-muted)',
                fontSize: 13,
              }}
            >
              <button
                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                disabled={queuePage <= 1 || reviewQueueQ.isFetching}
                style={btn}
              >
                ← Prev
              </button>
              <span>
                {queueTotal} pending · page {queuePage} of {queueTotalPages}
              </span>
              <button
                onClick={() => setQueuePage((p) => Math.min(queueTotalPages, p + 1))}
                disabled={queuePage >= queueTotalPages || reviewQueueQ.isFetching}
                style={btn}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Reject-reason modal ─────────────────────────────────────────── */}
      {rejecting && (
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
          onClick={() => setRejecting(null)}
        >
          <div
            style={{
              width: 'min(440px, 92vw)',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Reject submission</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
              {rejecting.title}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (required — shown to the author)"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejecting(null)} style={btn}>
                Cancel
              </button>
              <button
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({ contentId: rejecting.id, reason: rejectReason.trim() })
                }
                style={{
                  ...btnPrimary,
                  background: 'linear-gradient(135deg, #CC1C1C 0%, #CC1C1C 100%)',
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Storyworld modal (create + edit) ────────────────────────────── */}
      {swModal && (
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
          onClick={() => setSwModal(null)}
        >
          <div
            style={{
              width: 'min(480px, 92vw)',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {swModal === 'create' ? 'New Storyworld' : `Edit "${swModal.title}"`}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={swForm.title}
                onChange={(e) => setSwForm({ ...swForm, title: e.target.value })}
                placeholder="Title *"
                style={inputStyle}
              />
              <textarea
                value={swForm.description}
                onChange={(e) => setSwForm({ ...swForm, description: e.target.value })}
                placeholder="Description"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <input
                value={swForm.imageUrl}
                onChange={(e) => setSwForm({ ...swForm, imageUrl: e.target.value })}
                placeholder="Image URL"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setSwModal(null)} style={btn}>
                  Cancel
                </button>
                <button
                  disabled={
                    !swForm.title.trim() || createSwMutation.isPending || updateSwMutation.isPending
                  }
                  onClick={() => {
                    const data: Record<string, unknown> = {
                      title: swForm.title.trim(),
                      description: swForm.description || undefined,
                      imageUrl: swForm.imageUrl || undefined,
                    };
                    if (swModal === 'create') createSwMutation.mutate(data);
                    else updateSwMutation.mutate({ id: swModal.id, data });
                  }}
                  style={btnPrimary}
                >
                  {swModal === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Character modal (create + edit) ─────────────────────────────── */}
      {charModal && (
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
          onClick={() => setCharModal(null)}
        >
          <div
            style={{
              width: 'min(480px, 92vw)',
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {charModal === 'create'
                ? `New Character${selectedSw ? ` in ${storyworlds.find((s) => s.id === selectedSw)?.title ?? ''}` : ''}`
                : `Edit "${charModal.name}"`}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={charForm.name}
                onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                placeholder="Name *"
                style={inputStyle}
              />
              <select
                value={charForm.path}
                onChange={(e) => setCharForm({ ...charForm, path: e.target.value })}
                style={inputStyle}
              >
                {CHARACTER_PATHS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                value={charForm.imageUrl}
                onChange={(e) => setCharForm({ ...charForm, imageUrl: e.target.value })}
                placeholder="Image URL"
                style={inputStyle}
              />
              <textarea
                value={charForm.backstory}
                onChange={(e) => setCharForm({ ...charForm, backstory: e.target.value })}
                placeholder="Backstory"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setCharModal(null)} style={btn}>
                  Cancel
                </button>
                <button
                  disabled={!charForm.name.trim() || saveCharMutation.isPending}
                  onClick={() => {
                    const data: Record<string, unknown> = {
                      name: charForm.name.trim(),
                      path: charForm.path,
                      imageUrl: charForm.imageUrl || undefined,
                      backstory: charForm.backstory || undefined,
                    };
                    saveCharMutation.mutate({
                      id: charModal === 'create' ? undefined : charModal.id,
                      data,
                      storyworldId: selectedSw,
                    });
                  }}
                  style={btnPrimary}
                >
                  {charModal === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz modal (dynamic questions) ──────────────────────────────── */}
      {quizModal && (
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
          onClick={() => setQuizModal(false)}
        >
          <div
            style={{
              width: 'min(640px, 94vw)',
              maxHeight: '88vh',
              overflowY: 'auto',
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
              <select
                value={quizForm.storyworldId}
                onChange={(e) => setQuizForm({ ...quizForm, storyworldId: e.target.value })}
                style={inputStyle}
              >
                <option value="">No storyworld</option>
                {storyworlds.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>

              {quizForm.questions.map((q, i) => {
                const optionCount = q.options
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean).length;
                return (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: '1px solid var(--admin-card)',
                      background: 'var(--admin-dark)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--admin-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        Question {i + 1}
                      </span>
                      <button
                        onClick={() => removeQuestion(i)}
                        disabled={quizForm.questions.length === 1}
                        style={{ ...btnDanger, padding: '4px 10px', fontSize: 11 }}
                        title={
                          quizForm.questions.length === 1
                            ? 'A quiz needs at least one question'
                            : 'Remove this question'
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={q.question}
                      onChange={(e) => updateQuestion(i, { question: e.target.value })}
                      placeholder="Question text *"
                      style={inputStyle}
                    />
                    <input
                      value={q.options}
                      onChange={(e) => updateQuestion(i, { options: e.target.value })}
                      placeholder="Options (comma-separated) *"
                      style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        min={0}
                        max={Math.max(0, optionCount - 1)}
                        value={q.correctAnswerIndex}
                        onChange={(e) =>
                          updateQuestion(i, { correctAnswerIndex: Number(e.target.value) })
                        }
                        placeholder="Correct option (0-based)"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        value={q.explanation}
                        onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                        placeholder="Explanation (optional)"
                        style={{ ...inputStyle, flex: 2 }}
                      />
                    </div>
                  </div>
                );
              })}

              <button onClick={addQuestion} style={{ ...btn, alignSelf: 'flex-start' }}>
                + Add question
              </button>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setQuizModal(false)} style={btn}>
                  Cancel
                </button>
                <button
                  disabled={createQuizMutation.isPending || !!validateQuizForm()}
                  title={validateQuizForm() ?? undefined}
                  onClick={() => {
                    const problem = validateQuizForm();
                    if (problem) {
                      setFormError(problem);
                      return;
                    }
                    createQuizMutation.mutate({
                      title: quizForm.title.trim(),
                      description: quizForm.description || undefined,
                      storyworldId: quizForm.storyworldId || undefined,
                      questions: quizForm.questions.map((q) => {
                        const options = q.options
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        return {
                          question: q.question.trim(),
                          options,
                          correctAnswerIndex: Math.min(
                            Math.max(0, q.correctAnswerIndex),
                            Math.max(0, options.length - 1)
                          ),
                          explanation: q.explanation || undefined,
                        };
                      }),
                    });
                  }}
                  style={btnPrimary}
                >
                  {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
