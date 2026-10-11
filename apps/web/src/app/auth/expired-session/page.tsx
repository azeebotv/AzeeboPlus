import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auth Expired-session  - Azeebo+',
  description: 'Auth Expired-session  on Azeebo+',
};

import Link from 'next/link';
import { Hourglass } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';

export default function ExpiredSessionPage(): React.JSX.Element {
  return (
    <PageShell maxWidth="sm">
      <div className="az-glass mx-auto my-16 w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-az-scarlet/30 bg-az-scarlet/10 animate-pulse">
          <Hourglass className="size-9 text-az-flame" aria-hidden="true" />
        </div>

        <h1 className="az-headline mb-3 text-2xl text-az-ink sm:text-3xl">Session Expired</h1>

        <p className="az-body mb-8 leading-relaxed text-az-ink-muted">
          Your login session has timed out due to inactivity or security policy. Please sign in
          again to continue.
        </p>

        <div className="space-y-3">
          <Link href="/auth/login" className="az-btn-primary block">
            Sign In Again
          </Link>

          <Link
            href="/"
            className="az-body block w-full rounded-az-pill bg-az-glass-fill py-3.5 font-semibold text-az-ink-muted transition-colors hover:bg-az-glass-card hover:text-az-ink"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
