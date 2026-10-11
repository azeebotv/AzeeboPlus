'use client';

import { CONSENT_COOKIE } from '@/lib/consent';

/**
 * Clears the stored consent choice and reloads so the cookie banner
 * re-appears — the self-serve path promised on the /cookies page.
 */
export default function ConsentResetButton(): React.JSX.Element {
  const handleClick = (): void => {
    // The cookie jar enforces the __Host- prefix rules on every write,
    // including expiries — Secure must ride along even for deletion.
    document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; Secure`;
    window.location.reload();
  };

  return (
    <button type="button" onClick={handleClick} className="az-btn-primary az-btn-primary--inline">
      Review your cookie choices
    </button>
  );
}
