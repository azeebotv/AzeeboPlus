/**
 * TV device-link sign-in screen (RFC 8628-style, adapted to the 10-foot UI).
 *
 *  1. On mount, initiate a link (`deviceAuthApi.initiate`) and show the
 *     userCode big on screen alongside the activation URL.
 *  2. While pending, poll `deviceAuthApi.poll(deviceCode)` at the
 *     server-provided interval, backing off on errors.
 *  3. The first poll after the user confirms at azeebo.tv/link returns the
 *     session tokens exactly once — feed them to `completeDeviceLink` and
 *     navigate home.
 *
 * D-pad: Back exits (invalidating the in-flight code); Select on
 * "Get a new code" regenerates after expiry/denial/error.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, BackHandler, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { deviceAuthApi, classifyPollFailure, useAuth } from '@azeebo/react-data';
import type { DeviceLinkStatus } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { analytics } from '../src/utils/analytics';
import { FocusableButton } from '../src/components/Focusable';
import { QRCodeView } from '../src/components/QRCodeView';
import { colors, tvTypography, tvSpacing, tvRadius } from '../src/theme';

// Activation page shown on the TV for the user to visit on a phone/browser.
// Env-overridable so staging TVs don't send users to the production link page
// (falls back to prod when EXPO_PUBLIC_ACTIVATION_URL is unset).
const ACTIVATION_URL = process.env.EXPO_PUBLIC_ACTIVATION_URL || 'https://app.azeeboplus.com/link';
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

/**
 * Human-readable name for the approval card on the /link page — the user
 * verifies "Living Room TV" before granting access. Uses the OS-reported
 * device name when available (e.g. "Living Room's Chromecast"); in Expo Go
 * it's unavailable, so we fall back to a plain label.
 */
function getTvDeviceName(): string {
  const nativeDeviceName = Constants.deviceName;
  if (
    Constants.executionEnvironment === ExecutionEnvironment.Standalone &&
    typeof nativeDeviceName === 'string' &&
    nativeDeviceName.trim()
  ) {
    return nativeDeviceName.trim().slice(0, 64);
  }
  return 'TV device';
}

type Phase = 'initiating' | 'waiting' | 'authenticated' | 'denied' | 'expired' | 'error';

interface ActiveLink {
  deviceCode: string;
  intervalSec: number;
  expiresAtMs: number;
}

export default function SignInScreen() {
  const router = useRouter();
  const { completeDeviceLink } = useAuth();

  const [phase, setPhase] = useState<Phase>('initiating');
  const [userCode, setUserCode] = useState('');
  const [expiresAtMs, setExpiresAtMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Mutable state for the in-flight link, so timer callbacks and the back
  // handler always see current values without resubscribing effects.
  const linkRef = useRef<ActiveLink | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0); // bumped to invalidate timers/requests from older runs
  const consecutiveErrorsRef = useRef(0);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const schedulePoll = (runId: number, delayMs: number) => {
    clearPollTimer();
    pollTimerRef.current = setTimeout(() => {
      void pollOnce(runId);
    }, delayMs);
  };

  const pollOnce = async (runId: number) => {
    const link = linkRef.current;
    if (!link || runId !== runIdRef.current) return;

    try {
      const response = await deviceAuthApi.poll(link.deviceCode);
      if (runId !== runIdRef.current) return;
      consecutiveErrorsRef.current = 0;

      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || 'Poll failed');
      }

      const result = response.data;
      const status: DeviceLinkStatus = result.status;

      if (status === 'confirmed' && result.access_token && result.user) {
        setPhase('authenticated');
        const completion = await completeDeviceLink(response);
        if (completion.success) {
          analytics.userLoggedIn('device_link');
          router.replace('/');
        } else {
          setErrorMessage(completion.message || 'Sign-in failed. Please try again.');
          setPhase('error');
        }
        return;
      }

      if (status === 'denied' || status === 'expired') {
        setPhase(status);
        return;
      }

      // Still pending — enforce expiry locally so the screen stops polling
      // even if the server-side transition lags one poll behind.
      if (Date.now() > linkRef.current!.expiresAtMs) {
        setPhase('expired');
        return;
      }
      schedulePoll(runId, (result.intervalSec ?? link.intervalSec) * 1000);
    } catch (error) {
      if (runId !== runIdRef.current) return;
      // C3 contract: auth failures on the *public* poll endpoint are about the
      // device code itself — 401 (unknown/consumed/revoked code) and 403
      // (auth_device_link flag off) are terminal per RFC 8628 §3.5; 410 means
      // expiry. Everything else (5xx, timeouts, network errors) backs off and
      // retries. Retrying a dead code just burns minutes before the same
      // inevitable failure.
      const failureClass = classifyPollFailure((error as { status?: number }).status);
      if (failureClass === 'terminal') {
        setErrorMessage(
          (error as { status?: number }).status === 403
            ? 'TV code sign-in was turned off. Please try again later.'
            : 'This sign-in code is no longer valid. Please get a new one.'
        );
        setPhase('error');
        return;
      }
      consecutiveErrorsRef.current += 1;
      logger.error('Device link poll failed', error);
      // Backoff: 2x, 4x, 8x… capped at 30s. After MAX_CONSECUTIVE_POLL_ERRORS
      // consecutive failures, stop and surface an error — the TV must never
      // poll a dead endpoint forever.
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_POLL_ERRORS) {
        setErrorMessage('Lost connection while waiting for confirmation. Please try again.');
        setPhase('error');
        return;
      }
      const base = (linkRef.current?.intervalSec ?? 5) * 1000;
      schedulePoll(runId, Math.min(base * 2 ** consecutiveErrorsRef.current, 30000));
    }
  };

  const startLink = async () => {
    const runId = ++runIdRef.current;
    clearPollTimer();
    consecutiveErrorsRef.current = 0;
    linkRef.current = null;
    setPhase('initiating');
    setErrorMessage('');
    setUserCode('');

    try {
      const response = await deviceAuthApi.initiate({
        deviceType: 'tv',
        deviceName: getTvDeviceName(),
      });
      if (runId !== runIdRef.current) return; // superseded by a newer run
      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || 'Could not start sign-in');
      }

      const { deviceCode, userCode: code, expiresAt, intervalSec } = response.data;
      const expiresAtMs = Date.parse(expiresAt);
      linkRef.current = { deviceCode, intervalSec, expiresAtMs };
      setUserCode(code);
      setExpiresAtMs(expiresAtMs);
      setPhase('waiting');
      schedulePoll(runId, intervalSec * 1000);
    } catch (error) {
      if (runId !== runIdRef.current) return;
      logger.error('Device link initiation failed', error);
      // Flag-off (auth_device_link) denies the public endpoints with 403 —
      // show "not available yet" rather than blaming the connection.
      if ((error as { status?: number }).status === 403) {
        setErrorMessage('TV code sign-in is not available yet on this device — check back soon.');
      } else {
        setErrorMessage(
          'Could not reach the sign-in service. Check your connection and try again.'
        );
      }
      setPhase('error');
    }
  };

  useEffect(() => {
    void startLink();
    return () => {
      runIdRef.current += 1; // invalidate in-flight timers/requests
      clearPollTimer();
    };
  }, []);

  // Back on the remote exits sign-in (invalidating the code).
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      runIdRef.current += 1;
      clearPollTimer();
      router.back();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const minutesLeft = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 60000)) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Sign in to Azeebo</Text>

        {phase === 'initiating' && <Text style={styles.body}>Generating your sign-in code…</Text>}

        {phase === 'waiting' && (
          <View style={styles.activationCard}>
            {/* ── Left Column: QR Code ── */}
            <View style={styles.qrColumn}>
              <View style={styles.qrPlate}>
                <QRCodeView value={`${ACTIVATION_URL}?code=${userCode}`} size={200} />
              </View>
              <Text style={styles.qrInstruction}>📱 Scan with your phone camera</Text>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Right Column: Manual Code ── */}
            <View style={styles.codeColumn}>
              <Text style={styles.instruction}>On any phone or computer, visit</Text>
              <Text style={styles.url}>{ACTIVATION_URL}</Text>
              <Text style={styles.instruction}>and enter this code</Text>
              <Text style={styles.code}>{userCode}</Text>
              <Text style={styles.hint}>
                {minutesLeft > 0
                  ? `Expires in about ${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'} — keep this screen open`
                  : 'Keep this screen open'}
              </Text>
            </View>
          </View>
        )}

        {phase === 'authenticated' && (
          <Text style={styles.body}>Signed in! Taking you to Azeebo…</Text>
        )}

        {(phase === 'denied' || phase === 'expired' || phase === 'error') && (
          <>
            <Text style={styles.errorTitle}>
              {phase === 'denied'
                ? 'Sign-in was declined'
                : phase === 'expired'
                  ? 'This code has expired'
                  : 'Something went wrong'}
            </Text>
            {errorMessage ? <Text style={styles.body}>{errorMessage}</Text> : null}
            <FocusableButton
              title="Get a new code"
              onPress={() => void startLink()}
              hasTVPreferredFocus
              style={styles.retryButton}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tvSpacing.lg,
    paddingHorizontal: tvSpacing.section,
  },
  activationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: tvRadius.xl,
    padding: tvSpacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: tvSpacing.xxl,
  },
  qrColumn: {
    alignItems: 'center',
  },
  qrPlate: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: tvRadius.lg,
    marginBottom: tvSpacing.md,
  },
  qrInstruction: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.sm,
    fontWeight: '700',
  },
  divider: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  dividerLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 8,
  },
  codeColumn: {
    alignItems: 'flex-start',
    maxWidth: 420,
  },
  eyebrow: {
    fontSize: tvTypography.fontSize.sm,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.muted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  instruction: {
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.regular,
    color: colors.text.primary,
  },
  url: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.primary[500],
  },
  code: {
    fontSize: 56,
    fontWeight: tvTypography.fontWeight.bold,
    letterSpacing: 8,
    color: colors.text.primary,
    backgroundColor: colors.bg.tertiary,
    borderRadius: tvRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    paddingHorizontal: tvSpacing.lg,
    paddingVertical: tvSpacing.sm,
    overflow: 'hidden',
    marginVertical: tvSpacing.md,
  },
  hint: {
    fontSize: tvTypography.fontSize.base,
    color: colors.text.muted,
  },
  body: {
    fontSize: tvTypography.fontSize.lg,
    color: colors.text.muted,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.error[400],
  },
  retryButton: {
    marginTop: tvSpacing.lg,
    minWidth: 360,
  },
});
