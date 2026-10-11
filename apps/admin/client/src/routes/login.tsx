import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { WEB_APP_URL, goToWebLogin, safePath, webLoginUrl } from '@/lib/web-auth';

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: 'var(--admin-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  position: 'relative',
  overflow: 'hidden',
};

const glowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '30%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  height: 500,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(232,66,10,0.08) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  width: 420,
  maxWidth: '100%',
  backgroundColor: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 24,
  padding: '40px 32px',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
  position: 'relative',
  zIndex: 1,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  padding: '3px 8px',
  borderRadius: 6,
  background: 'rgba(232, 66, 10, 0.15)',
  color: 'var(--admin-orange)',
  border: '1px solid rgba(232, 66, 10, 0.3)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--admin-text)',
  margin: '0 0 6px',
};

const copyStyle: React.CSSProperties = {
  color: 'var(--admin-text-muted)',
  fontSize: 13,
  margin: 0,
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '14px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
  color: 'white',
  fontWeight: 600,
  fontSize: 14,
  textAlign: 'center',
  textDecoration: 'none',
  boxShadow: '0 4px 16px rgba(232,66,10,0.3)',
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'block',
  marginTop: 14,
  textAlign: 'center',
  fontSize: 13,
  color: 'var(--admin-text-muted)',
  textDecoration: 'underline',
};

const hintStyle: React.CSSProperties = {
  marginTop: 14,
  textAlign: 'center',
  fontSize: 12,
  color: 'var(--admin-text-muted)',
};

export default function LoginPage() {
  const { isAuthenticated, roleDenied, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next');

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      navigate(safePath(next), { replace: true });
      return;
    }
    // A signed-in non-admin must not be bounced back into the web login — it
    // would return here with the same session, in a loop.
    if (!roleDenied) goToWebLogin(next);
  }, [isLoading, isAuthenticated, roleDenied, next, navigate]);

  return (
    <div style={shellStyle}>
      <div style={glowStyle} />

      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src="/logo-white.png"
              alt="Azeebo+"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
            <span style={badgeStyle}>Console</span>
          </div>

          {roleDenied ? (
            <>
              <h1 style={titleStyle}>This account can&apos;t open the Console</h1>
              <p style={copyStyle}>
                You are signed in to Azeebo+, but admin access needs an account with an admin role.
              </p>
            </>
          ) : (
            <>
              <h1 style={titleStyle}>Administrative Access</h1>
              <p style={copyStyle}>
                The Console signs in through your Azeebo+ account. Authenticating on the main app
                brings you straight back here.
              </p>
            </>
          )}
        </div>

        {roleDenied ? (
          <>
            <a href={webLoginUrl(next)} style={primaryLinkStyle}>
              Sign in with an admin account
            </a>
            <a href={`${WEB_APP_URL}/home`} style={secondaryLinkStyle}>
              Back to Azeebo+
            </a>
          </>
        ) : (
          <>
            <a href={webLoginUrl(next)} style={primaryLinkStyle}>
              Continue to Azeebo+ sign in
            </a>
            <p style={hintStyle}>Redirecting… if nothing happens, use the button above.</p>
          </>
        )}
      </div>
    </div>
  );
}
