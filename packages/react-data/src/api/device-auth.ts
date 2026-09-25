import { apiClient } from './client';
import type { ApiResponse, User } from './auth';

/**
 * Device-link (RFC 8628-style) sign-in for TV (10-foot) devices.
 *
 * 1. `initiate()` on the TV returns a `userCode` (show on screen) and a secret
 *    `deviceCode` (store; never display).
 * 2. The user confirms the code at azeebo.tv/link on a phone/browser.
 * 3. `poll(deviceCode)` returns `pending` until confirmation, then returns the
 *    session tokens exactly once.
 *
 * ## Poll error contract (RFC 8628 §3.5 "authorization error" semantics)
 *
 * The poll endpoint is public (no session auth), so its auth failures are
 * about the *device code*, not a session:
 *  - `401` → the deviceCode is unknown, already consumed, or revoked.
 *    TERMINAL: stop polling, request a fresh code. Retrying can never
 *    succeed (the code is gone server-side) and 8628 clients "MUST"
 *    treat invalid_grant analogues as flow-ending.
 *  - `403` → the endpoint itself is denied (e.g. `auth_device_link`
 *    feature flag off). TERMINAL: same reason.
 *  - `410` → code expired. TERMINAL, but rendered as the friendlier
 *    "code expired" state rather than an error.
 *  - `5xx` / network errors → TRANSIENT: back off and retry.
 *
 * `classifyPollFailure` encodes this so the TV client and tests share one
 * definition. Server-side: keep 401 for invalid/consumed codes and use 5xx
 * (never 401) for capacity/outage responses, or clients will end flows early.
 */
export interface DeviceLinkInitResponse {
  deviceCode: string;
  userCode: string; // display form XXXX-XXXX
  expiresAt: string;
  intervalSec: number;
}

export type DeviceLinkStatus = 'pending' | 'confirmed' | 'denied' | 'expired';

export interface DeviceLinkPollResponse {
  status: DeviceLinkStatus;
  intervalSec?: number;
  access_token?: string;
  refresh_token?: string;
  user?: Pick<User, 'id' | 'email' | 'displayName' | 'avatar' | 'role'>;
}

export interface DeviceLinkConfirmResponse {
  confirmed: boolean;
}

/** What the approval screen shows before the user confirms or denies. */
export interface DeviceLinkInfoResponse {
  deviceType: string;
  /** Human-readable name the TV reported at initiate time (may be null). */
  deviceName: string | null;
  /** ISO timestamp after which the code can no longer be confirmed. */
  expiresAt: string;
}

export interface DeviceLinkDenyResponse {
  denied: boolean;
}

export type PollFailureClass = 'terminal' | 'expired' | 'transient';

/**
 * Classify a poll request failure per the contract above. `undefined` status
 * means a network-level error (no HTTP response) → transient.
 */
export function classifyPollFailure(status?: number): PollFailureClass {
  if (status === 410) return 'expired';
  if (status === 401 || status === 403) return 'terminal';
  return 'transient';
}

export const deviceAuthApi = {
  /** TV: create a pending link. Store `deviceCode`; display `userCode`. */
  async initiate(deviceInfo?: {
    deviceName?: string;
    deviceType?: string;
  }): Promise<ApiResponse<DeviceLinkInitResponse>> {
    return apiClient.post<ApiResponse<DeviceLinkInitResponse>>(
      '/auth/device/link',
      deviceInfo ?? {}
    );
  },

  /** TV: poll with the secret deviceCode until tokens arrive (once). */
  async poll(deviceCode: string): Promise<ApiResponse<DeviceLinkPollResponse>> {
    return apiClient.post<ApiResponse<DeviceLinkPollResponse>>('/auth/device/link/poll', {
      deviceCode,
    });
  },

  /** Phone/web (authed): ask which device is asking to be approved. */
  async info(code: string): Promise<ApiResponse<DeviceLinkInfoResponse>> {
    return apiClient.post<ApiResponse<DeviceLinkInfoResponse>>('/auth/device/link/info', {
      code,
    });
  },

  /** Phone/web (authed): confirm the code shown on the TV. */
  async confirm(code: string): Promise<ApiResponse<DeviceLinkConfirmResponse>> {
    return apiClient.post<ApiResponse<DeviceLinkConfirmResponse>>('/auth/device/link/confirm', {
      code,
    });
  },

  /** Phone/web (authed): reject the code shown on the TV. */
  async deny(code: string): Promise<ApiResponse<DeviceLinkDenyResponse>> {
    return apiClient.post<ApiResponse<DeviceLinkDenyResponse>>('/auth/device/link/deny', { code });
  },
};
