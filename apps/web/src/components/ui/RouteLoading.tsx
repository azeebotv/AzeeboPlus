/**
 * The one pending-state treatment every `app/**\/loading.tsx` boundary renders.
 *
 * Each boundary used to draw its own spinner, which is how the retired
 * `border-[var(--brand-orange)]` alias reached ~200 files and why the same route
 * spun three different ways depending on who generated the folder.
 */
export default function RouteLoading({
  label = 'Loading',
  hint,
}: {
  /** Announced to assistive tech. */
  label?: string;
  /** Visible caption under the spinner; omit for a bare, silent spinner. */
  hint?: string;
}): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <div
        className="size-8 animate-spin rounded-full border-4 border-az-flame border-t-transparent"
        aria-hidden="true"
      />
      {hint ? (
        <p className="az-body text-az-ink-muted">{hint}</p>
      ) : (
        <span className="sr-only">{label}…</span>
      )}
    </div>
  );
}
