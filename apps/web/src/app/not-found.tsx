import Link from 'next/link';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
        <p className="text-white/60 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="az-btn-primary inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
