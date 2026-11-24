import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-az-scarlet/30 bg-az-scarlet/10">
          <Compass className="size-10 text-az-flame" aria-hidden="true" />
        </div>
        <h1 className="az-headline mb-4 text-2xl text-az-ink">Page Not Found</h1>
        <p className="az-body mb-8 leading-relaxed text-az-ink-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="az-btn-primary az-btn-primary--inline">
          Go Home
        </Link>
      </div>
    </div>
  );
}
