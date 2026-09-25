export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[400px] items-center justify-center"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-orange)] border-t-transparent" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
