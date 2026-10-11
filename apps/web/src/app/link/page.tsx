'use client';

/**
 * Device-link activation page (/link) — azeebo.tv/link.
 *
 * Shown to a signed-in user on phone/desktop:
 *  1. Enter the code displayed on the TV (formatted XXXX-XXXX).
 *  2. Confirm to sign that TV in as this account, or deny to reject it.
 * Signed-out users are redirected to login with a return path.
 *
 * The TV learns the result by polling; nothing is returned to this page
 * beyond success/failure of the confirm call itself.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api/base';
import { Alert, Spinner } from '@/components/auth/FormBits';
import AuthShell from '@/components/auth/AuthShell';

type Phase =
  | 'checking-auth'
  | 'redirecting'
  | 'input'
  | 'submitting'
  | 'confirmed'
  | 'denied'
  | 'error';

function normalizeCode(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  return cleaned;
}

function formatCode(cleaned: string): string {
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

/** What POST /auth/device/link/info returns for a pending code. */
interface DeviceLinkInfo {
  deviceType: string;
  deviceName: string | null;
  expiresAt: string;
}

export default function DeviceLinkPage(): React.JSX.Element {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [phase, setPhase] = useState<Phase>('checking-auth');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Which device is asking to be approved. `infoCode` records which code the
  // loaded info belongs to, so a half-typed edit never mixes two devices.
  const [deviceInfo, setDeviceInfo] = useState<DeviceLinkInfo | null>(null);
  const [infoCode, setInfoCode] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  // Auth gate: mirror the login page's return-path convention.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setPhase('redirecting');
      router.replace('/auth/login?redirect=%2Flink');
    } else {
      setPhase('input');
    }
  }, [authLoading, isAuthenticated, router]);

  const normalizedCode = normalizeCode(code);
  const codeIsValid = normalizedCode.length === 8;

  const loadDeviceInfo = useCallback(async (normalized: string): Promise<DeviceLinkInfo | null> => {
    setInfoLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch<DeviceLinkInfo>('/auth/device/link/info', {
        method: 'POST',
        body: JSON.stringify({ code: normalized }),
      });
      if (res.success && res.data) {
        setDeviceInfo(res.data);
        setInfoCode(normalized);
        return res.data;
      }
      setDeviceInfo(null);
      setInfoCode(normalized);
      setErrorMessage(
        res.message ||
          res.error ||
          'That code isn\u2019t valid or has expired. Check it against your TV screen.'
      );
      return null;
    } catch {
      setDeviceInfo(null);
      setInfoCode(normalized);
      setErrorMessage('Could not reach the sign-in service. Check your connection and try again.');
      return null;
    } finally {
      setInfoLoading(false);
    }
  }, []);

  // Auto-fetch the device description once the full code is entered, so the
  // approval button sits next to the device it applies to.
  useEffect(() => {
    if (normalizedCode.length !== 8 || infoCode === normalizedCode) return;
    const timer = setTimeout(() => {
      void loadDeviceInfo(normalizedCode);
    }, 300);
    return () => clearTimeout(timer);
  }, [normalizedCode, infoCode, loadDeviceInfo]);

  const submit = async (action: 'confirm' | 'deny'): Promise<void> => {
    const normalized = normalizeCode(code);
    if (normalized.length !== 8) {
      setErrorMessage('Enter the full 8-character code shown on your TV.');
      return;
    }
    setErrorMessage(null);

    // Never approve blind: the confirm path requires the device description
    // to be on screen first. (Deny is safe without it.)
    if (action === 'confirm') {
      let info = deviceInfo && infoCode === normalized ? deviceInfo : null;
      if (!info) info = await loadDeviceInfo(normalized);
      if (!info) {
        setPhase('input'); // error already surfaced by the loader
        return;
      }
    }

    setPhase('submitting');
    try {
      const res = await apiFetch<{ confirmed?: boolean; denied?: boolean }>(
        `/auth/device/link/${action}`,
        {
          method: 'POST',
          body: JSON.stringify({ code: normalized }),
        }
      );
      if (!res.success) {
        setErrorMessage(
          res.message || res.error || 'That code could not be activated. Check it and try again.'
        );
        setPhase('input');
        return;
      }
      setPhase(action === 'confirm' ? 'confirmed' : 'denied');
    } catch {
      setErrorMessage('Could not reach the sign-in service. Check your connection and try again.');
      setPhase('input');
    }
  };

  if (phase === 'checking-auth' || phase === 'redirecting') {
    return (
      <AuthShell headlineLines={['Connect', 'Your TV']} tagline="Sign in once on the big screen.">
        <div className="flex items-center justify-center p-8">
          <Spinner className="h-6 w-6" />
        </div>
      </AuthShell>
    );
  }

  if (phase === 'confirmed' || phase === 'denied') {
    return (
      <AuthShell headlineLines={['Connect', 'Your TV']} tagline="Sign in once on the big screen.">
        <div className="grid gap-4 p-2 text-center">
          <div
            role="status"
            className={`az-heading ${phase === 'confirmed' ? 'text-az-success-400' : 'text-az-error-400'}`}
          >
            {phase === 'confirmed' ? '✓ TV connected' : 'Sign-in declined'}
          </div>
          <p className="az-lead text-az-ink-muted">
            {phase === 'confirmed'
              ? 'Your TV is now signed in. Switch back to the TV — it will finish on its own.'
              : 'The TV was not signed in. If this wasn\u2019t you, no action is needed — the code is now dead.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setCode('');
              setDeviceInfo(null);
              setInfoCode('');
              setPhase('input');
            }}
            className="az-body-strong justify-self-center rounded-az-pill border border-az-glass-border-hover bg-transparent px-7 py-3 text-az-ink transition-colors hover:bg-az-glass-fill"
          >
            Connect another TV
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell headlineLines={['Connect', 'Your TV']} tagline="Sign in once on the big screen.">
      <div className="grid gap-4">
        <p className="az-lead m-0 text-az-ink-muted">
          On your TV, open <strong className="text-az-ink">Sign in</strong> and enter the code shown
          here. We’ll show you which device is asking before you approve it.
        </p>

        {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit('confirm');
          }}
          className="grid gap-3"
        >
          <input
            value={formatCode(normalizeCode(code))}
            onChange={(e) => setCode(e.target.value)}
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            placeholder="XXXX-XXXX"
            aria-label="TV sign-in code"
            disabled={phase === 'submitting'}
            className="w-full rounded-az-card border border-az-glass-border bg-az-glass-fill px-[18px] py-4 text-center font-mono text-[28px] tracking-[10px] text-az-ink outline-none"
          />

          {infoLoading ? (
            <div className="az-caption text-az-ink-dim" role="status">
              Checking which device this is…
            </div>
          ) : null}

          {deviceInfo && infoCode === normalizedCode ? (
            <div className="flex items-center gap-3.5 rounded-az-card border border-az-glass-border-hover bg-az-glass-fill px-[18px] py-3.5">
              <div
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-az-control bg-[image:var(--gradient-az-cta)] text-[22px]"
              >
                📺
              </div>
              <div className="min-w-0 flex-1">
                <div className="az-lead font-semibold text-az-ink">
                  {deviceInfo.deviceName && deviceInfo.deviceName.trim()
                    ? deviceInfo.deviceName
                    : 'Unnamed TV'}
                </div>
                <div className="az-caption mt-0.5 text-az-ink-muted">
                  Code expires at{' '}
                  {new Date(deviceInfo.expiresAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  — make sure this is your device before connecting.
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={phase === 'submitting' || !codeIsValid}
            className="az-btn-primary flex items-center justify-center gap-2"
          >
            {phase === 'submitting' ? <Spinner /> : null}
            {phase === 'submitting' ? 'Connecting…' : 'Connect this TV'}
          </button>

          <button
            type="button"
            disabled={phase === 'submitting' || !codeIsValid}
            onClick={() => void submit('deny')}
            className="az-body-strong cursor-pointer rounded-az-card border border-az-glass-border bg-transparent px-6 py-3 text-az-ink transition-colors hover:bg-az-glass-fill disabled:cursor-not-allowed"
          >
            This wasn&apos;t me — decline
          </button>
        </form>

        <p className="az-caption m-0 text-az-ink-dim">
          Codes expire after 15 minutes and work once. Only confirm a code that matches the one on
          your TV screen.
        </p>
      </div>
    </AuthShell>
  );
}
