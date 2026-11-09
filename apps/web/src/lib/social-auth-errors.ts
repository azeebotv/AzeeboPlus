/**
 * Social sign-in failure codes and their user-facing messages.
 *
 * Shared by the OAuth callback route (which decides the code) and the login
 * page (which renders it), so a new failure mode cannot be added on one side
 * and silently render nothing on the other.
 *
 * Provider-supplied error strings are deliberately never shown: they are
 * attacker-influenceable and often meaningless to users.
 */
const SOCIAL_AUTH_ERROR_CODES = [
  'cancelled',
  'state_invalid',
  'exchange_failed',
  'account_conflict',
  'unavailable',
] as const;

export type SocialAuthErrorCode = (typeof SOCIAL_AUTH_ERROR_CODES)[number];

const MESSAGES: Record<SocialAuthErrorCode, string> = {
  cancelled: 'Sign-in was cancelled. You can try again or log in with your password.',
  state_invalid: 'That sign-in link has expired. Please try again.',
  exchange_failed: "We couldn't complete the sign-in. Please try again.",
  account_conflict: 'That account is already linked to another user.',
  unavailable: 'This sign-in method is temporarily unavailable. Please log in with your password.',
};

function isSocialAuthErrorCode(value: string | null | undefined): value is SocialAuthErrorCode {
  return value != null && (SOCIAL_AUTH_ERROR_CODES as readonly string[]).includes(value);
}

/** Maps an unknown `?error=` value to a message, or null when absent/unknown. */
export function socialAuthErrorMessage(value: string | null | undefined): string | null {
  return isSocialAuthErrorCode(value) ? MESSAGES[value] : null;
}
