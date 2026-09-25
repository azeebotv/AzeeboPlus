export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
