'use client';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
        <p className="text-white/60 mb-8">An unexpected error occurred. Please try again.</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#E8420A] text-white rounded-lg font-semibold hover:bg-[#D03A08] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
