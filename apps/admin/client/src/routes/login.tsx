import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--admin-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle ambient luxury glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,66,10,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: 420,
          maxWidth: '100%',
          backgroundColor: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img
              src="/logo-white.png"
              alt="Azeebo+"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(232, 66, 10, 0.15)',
                color: 'var(--admin-orange)',
                border: '1px solid rgba(232, 66, 10, 0.3)',
              }}
            >
              Console
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-text)', margin: '0 0 6px' }}>
            Administrative Access
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: 0 }}>
            Enter your credentials to manage the Azeebo+ network
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(204,28,28,0.4)',
              backgroundColor: 'rgba(204,28,28,0.12)',
              marginBottom: 20,
              color: '#ff6b6b',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
                letterSpacing: 0.3,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@azeebo.tv"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--admin-text)',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-orange)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-border)';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--admin-text-muted)',
                marginBottom: 6,
                letterSpacing: 0.3,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--admin-text)',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-orange)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--admin-border)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: 6,
              boxShadow: '0 4px 16px rgba(232,66,10,0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>
      </div>
    </div>
  );
}
