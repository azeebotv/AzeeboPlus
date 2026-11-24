'use client';

import Link from 'next/link';
import { useFlags } from '@/context/FlagsContext';

/**
 * Premium upsell placement, gated by the `web_premium_upsell` server flag.
 *
 * Renders a compact "go premium" card with the value payload used as the
 * headline (falling back to a default line). When the flag is off, renders
 * nothing — ops controls every placement from the admin flag UI.
 */
export default function PremiumUpsell(): React.JSX.Element | null {
  const { isEnabled, getValue } = useFlags();
  if (!isEnabled('web_premium_upsell')) return null;

  const raw = getValue('web_premium_upsell');
  const headline =
    typeof raw === 'string' && raw.trim().length > 0
      ? raw
      : 'Go Premium — unlock exclusive content and perks';

  return (
    <div
      data-testid="premium-upsell"
      className="relative overflow-hidden rounded-az-panel border border-az-warning-400/30 bg-gradient-to-br from-az-warning-500/10 to-transparent"
    >
      <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="az-headline text-lg text-az-warning-400">{headline}</p>
          <p className="az-caption mt-1 text-az-warning-400/60">
            Ad-free viewing, early access, and exclusive perks for members.
          </p>
        </div>
        <Link
          href="/premium"
          className="az-body-strong shrink-0 rounded-az-pill bg-az-warning-400 px-5 py-2.5 text-az-surface-root transition hover:bg-az-warning-300"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
