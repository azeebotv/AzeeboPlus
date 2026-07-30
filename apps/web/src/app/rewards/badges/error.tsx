'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-gray-400">Something went wrong</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
      >
        Try again
      </button>
    </div>
  );
}
