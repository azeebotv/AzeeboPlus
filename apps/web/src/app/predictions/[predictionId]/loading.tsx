export default function PredictionDetailLoading(): React.JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
      role="status"
      aria-label="Loading prediction details"
    >
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-orange)]" />
      <p className="text-sm text-white/50">Loading prediction market...</p>
    </div>
  );
}
