import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, asArray, str, num, bool } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Detail page for a single Agbala storyworld, backed by
 * GET /admin/agbala/storyworlds/:id. Renders the world's full record plus its
 * embedded character roster (same upstream payload), with publish/unpublish
 * and delete actions and cross-links to characters' storyworld listing.
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

const actionBtn: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  background: 'var(--admin-surface)',
  color: 'var(--admin-text)',
  fontSize: 13,
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  ...actionBtn,
  borderColor: 'rgba(220,38,38,0.4)',
  color: 'var(--admin-red)',
};

const chip: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 12,
  backgroundColor: 'rgba(154,138,122,0.15)',
  color: 'var(--admin-text-muted)',
};

export default function StoryworldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const q = useQuery({
    queryKey: ['storyworld', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getStoryworldById(id as string);
      return asRecord(res);
    },
  });

  const sw = q.data ?? null;
  const characters = asArray<Record<string, unknown>>(sw?.characters).map(asRecord);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['storyworld', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'agbala'] });
  };

  const run = (fn: () => Promise<unknown>, okMsg: string) =>
    fn()
      .then(() => {
        setActionError(null);
        invalidate();
        void q.refetch();
        window.setTimeout(() => setActionError(okMsg), 0);
      })
      .catch((e: unknown) => setActionError((e as Error).message || 'Action failed'));

  const togglePublish = () => {
    const call = bool(sw?.isPublished)
      ? adminApi.unpublishStoryworld(id as string)
      : adminApi.publishStoryworld(id as string);
    run(() => call, bool(sw?.isPublished) ? 'Storyworld unpublished.' : 'Storyworld published.');
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

      {q.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading storyworld…</p>
      ) : q.isError ? (
        <p style={{ color: 'var(--admin-red)' }}>
          Failed to load storyworld: {(q.error as Error).message}
        </p>
      ) : !sw || !sw.id ? (
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
            {sw.imageUrl ? (
              <img
                src={str(sw.imageUrl)}
                alt=""
                style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover' }}
              />
            ) : null}
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
              {str(sw.title, 'Untitled world')}
            </h1>
            <span
              style={{
                padding: '3px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: bool(sw.isPublished)
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(107,114,128,0.15)',
                color: bool(sw.isPublished)
                  ? 'var(--admin-emerald)'
                  : 'var(--admin-text-muted)',
              }}
            >
              {bool(sw.isPublished) ? 'Published' : 'Draft'}
            </span>
          </div>

          {actionError && (
            <p style={{ color: actionError.endsWith('.') ? 'var(--admin-green)' : 'var(--admin-red)', marginBottom: 12 }}>
              {actionError}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={togglePublish} style={actionBtn}>
              {bool(sw.isPublished) ? 'Unpublish' : 'Publish'}
            </button>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} style={dangerBtn}>
                Delete
              </button>
            ) : (
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() =>
                    run(async () => {
                      await adminApi.deleteStoryworld(sw.id);
                      navigate('/agbala');
                    }, '')
                  }
                  style={dangerBtn}
                >
                  Confirm delete
                </button>
                <button onClick={() => setShowDelete(false)} style={actionBtn}>
                  Cancel
                </button>
              </span>
            )}
          </div>

          {str(sw.description) && (
            <div style={{ marginBottom: 24 }}>
              <Field label="Description">{str(sw.description)}</Field>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Field label="Characters">{num(sw.characterCount)}</Field>
            <Field label="Locations">{num(sw.locationCount ?? sw.pathCount)}</Field>
            <Field label="Created">
              {sw.createdAt ? new Date(str(sw.createdAt)).toLocaleDateString() : '-'}
            </Field>
            <Field label="Updated">
              {sw.updatedAt ? new Date(str(sw.updatedAt)).toLocaleDateString() : '-'}
            </Field>
          </div>

          <div>
            <p style={labelStyle}>Character roster</p>
            {characters.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                No characters recorded for this world.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {characters.map((c) => (
                  <div
                    key={str(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--admin-surface)',
                    }}
                  >
                    {c.imageUrl ? (
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
    </div>
  );
}
