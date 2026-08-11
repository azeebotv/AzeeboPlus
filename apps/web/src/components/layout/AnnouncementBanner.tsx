'use client';

import { useState } from 'react';
import { useFlags } from '@/context/FlagsContext';

/**
 * Ops announcement banner, gated by the `web_announcement_banner` server flag.
 *
 * When the flag is enabled, the banner renders at the top of every page with
 * the flag's value payload used as the message text (falling back to a default
 * line when the value is empty). A dismiss button hides it for the session.
 */
export default function AnnouncementBanner(): React.JSX.Element | null {
  const { isEnabled, getValue } = useFlags();
  const [dismissed, setDismissed] = useState(false);

  const show = isEnabled('web_announcement_banner') && !dismissed;
  if (!show) return null;

  const raw = getValue('web_announcement_banner');
  const message =
    typeof raw === 'string' && raw.trim().length > 0
      ? raw
      : 'We are making some improvements — expect brief downtime this week.';

  return (
    <div
      role="status"
      data-testid="announcement-banner"
      className="relative z-50 w-full bg-amber-500/10 border-b border-amber-500/30"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-amber-200">{message}</p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-full p-1 text-amber-200/70 transition hover:text-amber-200"
          onClick={() => setDismissed(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
