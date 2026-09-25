export default function LiveDetailLoading(): React.JSX.Element {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
      role="status"
      aria-label="Connecting to live stream"
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-orange)]" />
      <p className="text-sm text-white/50">Connecting to stream...</p>
    </div>
  );
}
