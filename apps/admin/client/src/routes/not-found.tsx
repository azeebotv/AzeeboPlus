import { Link } from 'react-router-dom';

/**
 * Catch-all for paths the portal does not route.
 *
 * React Router renders nothing when no route matches, so an unknown URL used to
 * produce a completely blank page with no way back. This ships a real 404 so
 * stale bookmarks and mis-built links land somewhere useful.
 */
export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'var(--admin-bg)',
        color: 'var(--admin-text)',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: 24,
          border: '1px solid var(--admin-border, rgba(255,255,255,0.07))',
          backgroundColor: 'var(--admin-surface)',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: 'var(--admin-orange)',
          }}
        >
          404
        </p>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Page not found</h1>
        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--admin-text-muted)',
          }}
        >
          This admin page does not exist. It may have moved, or the link that brought you here is
          out of date.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            color: '#fff',
            backgroundColor: 'var(--admin-orange)',
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
