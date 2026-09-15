import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asRecord, asArray, str, num } from '@/lib/payload';
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

export default function StoryworldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    </div>
  );
}
