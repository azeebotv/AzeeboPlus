export default function MobileReportLoading(): React.JSX.Element {
  return (
    <div
      className="flex items-center justify-center min-h-[50vh]"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
      role="status"
      aria-label="Loading"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-orange)]" />
    </div>
  );
}
