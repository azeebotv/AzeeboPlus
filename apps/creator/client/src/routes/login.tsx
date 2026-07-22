import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5F0EB' }}>
      <div style={{ width: 400, maxWidth: '90%', padding: 32, borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: '#140808' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#E8420A' }}>Creator Portal</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 24, fontSize: 14 }}>Sign in to manage your content</p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(204,28,28,0.15)', color: '#CC1C1C', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2A1A1A', backgroundColor: '#0D0505', color: '#F5F0EB', fontSize: 14, outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
