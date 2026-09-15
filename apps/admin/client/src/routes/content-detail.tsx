import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, asArray, str, num } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Detail page for a single content item, backed by GET /admin/content/:id.
 * The payload embeds the full relations (creator, universe, categories, tags,
 * media asset, both relationship directions), so this renders everything the
 * list row cannot show — plus the publish/unpublish/delete actions.
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

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const q = useQuery({
    queryKey: ['content-item', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await adminApi.getContentItem(id as string);
      return asRecord(res);
    },
  });

  const content = q.data ?? null;
  const creator = asRecord(content?.creator);
  const universe = asRecord(content?.universe);
  const media = asRecord(content?.mediaAsset);
  const categories = asArray<Record<string, unknown>>(content?.categories);
  const tags = asArray<Record<string, unknown>>(content?.tags);
  const relatedOut = asArray<Record<string, unknown>>(content?.relationshipsAsContent).map((r) =>
    asRecord(r.relatedContent),
  );
  const relatedIn = asArray<Record<string, unknown>>(content?.relationshipsAsRelatedContent).map(
    (r) => asRecord(r.content),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['content-item', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'content-stats'] });
  };

  const run = (fn: () => Promise<unknown>, ok: string) =>
    fn()
      .then(() => {
        setActionError(null);
        invalidate();
        void q.refetch();
        window.setTimeout(() => setActionError(ok), 0);
      })
      .catch((e: unknown) => setActionError((e as Error).message || 'Action failed'));

  const status = str(content?.status, 'unknown');

  return (
    <div>
      <button
        onClick={() => navigate('/content')}
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
        <span>Back to Content</span>
      </button>

      {q.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading content…</p>
      ) : q.isError ? (
        <p style={{ color: 'var(--admin-red)' }}>
          Failed to load content: {(q.error as Error).message}
        </p>
      ) : !content || !content.id ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Content not found.</p>
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)', margin: 0 }}>
              {str(content.title, 'Untitled')}
            </h1>
            <span
              style={{
                padding: '3px 12px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor:
                  status === 'published'
                    ? 'rgba(13,59,46,0.2)'
                    : status === 'draft'
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(154,138,122,0.2)',
                color:
                  status === 'published'
                    ? 'var(--admin-green)'
                    : status === 'draft'
                      ? 'var(--admin-amber)'
                      : 'var(--admin-text-muted)',
              }}
            >
              {status}
            </span>
          </div>

          {actionError && (
            <p
              style={{
                color: ok(actionError) ? 'var(--admin-green)' : 'var(--admin-red)',
                marginBottom: 12,
              }}
            >
              {actionError}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}
          >
            {status !== 'published' && (
              <button
                onClick={() => run(() => adminApi.publishContent(content.id), 'Content published.')}
                style={actionBtn}
              >
                Publish
              </button>
            )}
            {status === 'published' && (
              <button
                onClick={() =>
                  run(() => adminApi.unpublishContent(content.id), 'Content unpublished.')
                }
                style={actionBtn}
              >
                Unpublish
              </button>
            )}
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} style={dangerBtn}>
                Delete
              </button>
            ) : (
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() =>
                    run(async () => {
                      await adminApi.deleteContent(content.id);
                      navigate('/content');
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Field label="Creator">
              {creator.id ? (
                <Link to={`/users/${creator.id}`} style={link}>
                  {str(creator.displayName) || str(creator.email) || creator.id}
                </Link>
              ) : (
                '-'
              )}
            </Field>
            <Field label="Universe">{universe.name ? str(universe.name) : '-'}</Field>
            <Field label="Views">{num(content.viewCount ?? content.views).toLocaleString()}</Field>
            <Field label="Type">{str(content.type, '-')}</Field>
          </div>

          {str(content.description) && (
            <div style={{ marginBottom: 24 }}>
              <Field label="Description">{str(content.description)}</Field>
            </div>
          )}

          {media.url ? (
            <div style={{ marginBottom: 24 }}>
              <Field label="Media">
                {/\.(mp4|webm|mov)(\?|$)/i.test(str(media.url)) ? (
                  <video src={str(media.url)} controls style={{ maxWidth: 480, borderRadius: 8 }} />
                ) : (
                  <img src={str(media.url)} alt="" style={{ maxWidth: 480, borderRadius: 8 }} />
                )}
              </Field>
            </div>
          ) : str(content.mediaUrl) ? (
            <div style={{ marginBottom: 24 }}>
              <Field label="Media URL">
                <a href={str(content.mediaUrl)} target="_blank" rel="noreferrer" style={link}>
                  {str(content.mediaUrl)}
                </a>
              </Field>
            </div>
          ) : null}

          {(categories.length > 0 || tags.length > 0) && (
            <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
              {categories.length > 0 && (
                <Field label="Categories">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {categories.map((c) => (
                      <span key={str(c.id)} style={chip}>
                        {str(c.name, 'Unnamed')}
                      </span>
                    ))}
                  </div>
                </Field>
              )}
              {tags.length > 0 && (
                <Field label="Tags">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tags.map((t) => (
                      <span key={str(t.id)} style={chip}>
                        {str(t.name, 'Unnamed')}
                      </span>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          )}

          {(relatedOut.length > 0 || relatedIn.length > 0) && (
            <div style={{ marginBottom: 24 }}>
              <Field label="Related content">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {relatedOut.map((rc) => (
                    <Link key={str(rc.id)} to={`/content/${str(rc.id)}`} style={chipLink}>
                      {str(rc.title, 'Untitled')} →
                    </Link>
                  ))}
                  {relatedIn.map((rc) => (
                    <Link key={str(rc.id)} to={`/content/${str(rc.id)}`} style={chipLink}>
                      ← {str(rc.title, 'Untitled')}
                    </Link>
                  ))}
                </div>
              </Field>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              color: 'var(--admin-text-muted)',
              fontSize: 12,
            }}
          >
            <Field label="Created">
              {content.createdAt ? new Date(str(content.createdAt)).toLocaleString() : '-'}
            </Field>
            <Field label="Updated">
              {content.updatedAt ? new Date(str(content.updatedAt)).toLocaleString() : '-'}
            </Field>
          </div>
        </>
      )}
    </div>
  );
}

function ok(message: string): boolean {
  return /published|unpublished|saved|created|deleted/i.test(message);
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

const link: React.CSSProperties = {
  color: 'var(--admin-blue, var(--admin-text))',
  textDecoration: 'none',
};

const chip: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 12,
  backgroundColor: 'rgba(154,138,122,0.15)',
  color: 'var(--admin-text-muted)',
};

const chipLink: React.CSSProperties = {
  ...chip,
  textDecoration: 'none',
};
