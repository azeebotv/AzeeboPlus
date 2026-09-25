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
      className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent"
    >
      <div className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="az-headline text-lg font-bold text-amber-200">{headline}</p>
          <p className="mt-1 text-sm text-amber-100/60">
            Ad-free viewing, early access, and exclusive perks for members.
          </p>
        </div>
        <Link
          href="/premium"
          className="shrink-0 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-300"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
