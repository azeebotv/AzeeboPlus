'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { webLogger } from '@/lib/logger';
import { apiFetch } from '@/lib/api';
import BrandLogo from '@/components/auth/BrandLogo';
import { Alert, Spinner } from '@/components/auth/FormBits';

type Role = 'user' | 'creator' | 'both';

const ROLES: {
  id: Role;
  title: string;
  emoji: string;
  description: string;
  sub: string;
}[] = [
  {
    id: 'user',
    title: 'Regular User',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Enjoy premium Nigerian contents',
    sub: 'Discover music, movie, creator and entertainment',
  },
  {
    id: 'creator',
    title: 'Creator',
    emoji: '🎬',
    description: 'Build your audience and brand',
    sub: 'Showcase your talent, reach millions and connect',
  },
  {
    id: 'both',
    title: 'Creator & User',
    emoji: '💻',
    description: 'Experience the best of both worlds',
    sub: 'Consume content and create your journey',
  },
];

export default function RoleSelectionPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Role | null>(null);
  const router = useRouter();

  const handleRoleSelection = async (role: Role): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setActive(role);
    try {
      const result = await apiFetch('/v1/auth/select-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (!result.success) {
        throw new Error(result.message || 'Failed to select role');
      }
      router.push('/auth/profile-setup');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select role';
      setError(message);
      webLogger.error('Role selection failed', { error: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden p-6 sm:p-10"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
    >
      {/* Lagos-at-night blurred ambient background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(232,66,10,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(13,59,46,0.5), transparent 50%), linear-gradient(180deg, #0a0a0a, #1A0A0A)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="mb-10">
          <BrandLogo variant="light" />
        </div>

        <header className="text-center mb-10">
          <h1 className="az-headline text-white text-4xl mb-3">Select Your Azeebo+ Role</h1>
          <p className="text-white/55 text-base max-w-xl mx-auto">
            Your curated home for Nigerian contents, community and creation.
          </p>
        </header>

        {error && (
          <div className="max-w-xl mx-auto mb-6">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role) => {
            const isActive = active === role.id;
            return (
              <div
                key={role.id}
                className="az-glass az-glass--glow relative flex flex-col items-center text-center p-7 transition-all"
                style={{
                  boxShadow: isActive
                    ? '0 0 30px rgba(204,28,28,0.45), 0 0 60px rgba(204,28,28,0.2)'
                    : undefined,
                }}
              >
                {/* Illustration tile */}
                <div
                  className="w-full rounded-xl mb-5 flex items-center justify-center"
                  style={{
                    height: 160,
                    background:
                      'linear-gradient(160deg, rgba(204,28,28,0.18), rgba(13,59,46,0.25))',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: 64 }}>{role.emoji}</span>
                </div>

                <h2 className="az-headline text-white text-xl mb-2">{role.title}</h2>
                <p className="text-white font-semibold text-sm mb-1">{role.description}</p>
                <p className="text-white/50 text-xs leading-relaxed mb-6">{role.sub}</p>

                {isActive && (
                  <div
                    className="az-ambient-red"
                    style={{
                      width: 240,
                      height: 120,
                      bottom: -40,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRoleSelection(role.id)}
                  className="az-btn-primary relative z-10 mt-auto"
                  disabled={isLoading && isActive}
                >
                  {isLoading && isActive ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner /> Selecting...
                    </span>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
