'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { apiFetch } from '../../../lib/api';

export default function ShareRedirectPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = params?.code as string;
    if (!code) {
      setError(true);
      return;
    }

    const resolve = async () => {
      try {
        const result = await apiFetch<{ contentId: string; redirectUrl: string }>(
          `/content/sharing/resolve/${code}`
        );
        if (result.success && result.data) {
          router.replace(result.data.redirectUrl);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    resolve();
  }, [params, router]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="az-glass p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Link not found</h1>
          <p className="text-white/50">This share link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <Loader
          className="w-8 h-8 mx-auto mb-4 animate-spin"
          style={{ color: 'var(--brand-orange)' }}
        />
        <p className="text-white/60">Redirecting...</p>
      </div>
    </div>
  );
}
