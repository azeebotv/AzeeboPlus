/**
 * TV wallet funding — scan-to-pay.
 *
 * Flow:
 *  1. Pick a preset amount (D-pad across the chips).
 *  2. Select "Continue" → walletApi.fundWallet() returns the provider's
 *     authorizationUrl (Paystack/Flutterwave checkout).
 *  3. The URL is rendered as a QR code on screen; the viewer scans it with
 *     their phone and pays there.
 *  4. The screen polls paymentApi.verify(reference) until the payment settles
 *     (success/failed) or the session times out, then refreshes the wallet
 *     balance and returns home.
 *
 * D-pad: Back cancels (polling stops; a pending payment is safe to abandon —
 * it simply never completes).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, BackHandler, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletApi, paymentApi, useAuth, useWallet } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { analytics } from '../../src/utils/analytics';
import { FocusableButton, FocusableCard } from '../../src/components/Focusable';
import { QRCodeView } from '../../src/components/QRCodeView';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';
import { addFundsPresetAmounts, walletLimits } from '../../src/config/prices';

const NGN = '₦';
const VERIFY_INTERVAL_MS = 3000;
const VERIFY_SESSION_MS = 5 * 60 * 1000; // abandon the QR after 5 minutes
const PROVIDER_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  flutterwave: 'Flutterwave',
};

type Phase = 'form' | 'initializing' | 'awaiting' | 'success' | 'failed' | 'timeout' | 'error';

interface Provider {
  provider: string;
  name: string;
}

export default function WalletFundScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getWallet } = useWallet();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [amount, setAmount] = useState<number | null>(null);
  // Provider the user picked (defaults to the first available — parity with
  // the old behavior — but D-pad selectable now).
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  // Shown under the QR and on the failed/timeout screens so support can trace
  // the payment against the provider's dashboard without asking the viewer to
  // dig through transaction history.
  const [paymentReference, setPaymentReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Polling/session refs — mutable so timers and the back handler agree.
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  // Provider chosen for the in-flight payment, for analytics on settle.
  const paidProviderRef = useRef<string>('');

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    pollTimerRef.current = null;
    sessionTimerRef.current = null;
  }, []);

  // Load available providers once.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await paymentApi.getProviders();
        if (cancelled) return;
        if (res.success && res.data && res.data.length > 0) {
          setProviders(res.data);
          setSelectedProviderId((current) => current ?? res.data![0].provider);
        } else {
          setProvidersError(
            'No payment providers are available right now. Please try again later.'
          );
        }
      } catch (error) {
        if (cancelled) return;
        logger.error('Failed to load payment providers', error);
        setProvidersError('Could not load payment providers. Check your connection.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Deadline lives in a ref so verifyOnce can read it without re-creating.
  const sessionDeadlineRef = useRef(0);

  const verifyOnce = useCallback(
    async (runId: number, reference: string) => {
      try {
        const res = await paymentApi.verify(reference);
        if (runId !== runIdRef.current) return;
        if (res.success && res.data) {
          if (res.data.status === 'success') {
            clearTimers();
            void getWallet(); // refresh balance for when we land back home
            analytics.walletFunded(amount ?? 0, paidProviderRef.current);
            setPhase('success');
            return;
          }
          if (res.data.status === 'failed') {
            clearTimers();
            analytics.paymentFailed(
              amount ?? 0,
              paidProviderRef.current,
              'provider_reported_failed'
            );
            setPhase('failed');
            return;
          }
          // 'pending' → keep polling
        }
      } catch (error) {
        // Network blip — keep polling; verify is idempotent.
        logger.warn('Payment verify poll failed, retrying', undefined, error);
      }

      if (runId !== runIdRef.current) return;
      if (Date.now() < sessionDeadlineRef.current) {
        pollTimerRef.current = setTimeout(
          () => void verifyOnce(runId, reference),
          VERIFY_INTERVAL_MS
        );
      } else {
        setPhase('timeout');
      }
    },
    [clearTimers, getWallet]
  );

  const startFunding = useCallback(async () => {
    if (amount == null || !user?.email) return;
    // User-selected provider (falls back to the first available).
    const provider = providers.find((p) => p.provider === selectedProviderId) ?? providers[0];
    if (!provider) return;
    const runId = ++runIdRef.current;
    clearTimers();
    setPhase('initializing');
    setErrorMessage('');

    try {
      const res = await walletApi.fundWallet({
        amount,
        provider: provider.provider as 'paystack' | 'flutterwave',
        email: user.email,
      });
      if (runId !== runIdRef.current) return;
      if (!res.success || !res.data?.authorizationUrl || !res.data.reference) {
        throw new Error(res.message || res.error?.message || 'Could not start the payment');
      }
      const { authorizationUrl: url, reference } = res.data;
      setAuthorizationUrl(url);
      setPaymentReference(reference);
      paidProviderRef.current = provider.provider;
      analytics.paymentInitialized(amount, provider.provider);
      sessionDeadlineRef.current = Date.now() + VERIFY_SESSION_MS;
      setPhase('awaiting');
      // Session timeout is enforced inside verifyOnce via sessionDeadlineRef.
      pollTimerRef.current = setTimeout(
        () => void verifyOnce(runId, reference),
        VERIFY_INTERVAL_MS
      );
    } catch (error) {
      if (runId !== runIdRef.current) return;
      logger.error('Wallet funding initialization failed', error);
      setErrorMessage('Could not start the payment. Please try again.');
      setPhase('error');
    }
  }, [amount, user?.email, providers, selectedProviderId, clearTimers, verifyOnce]);

  const resetToForm = useCallback(() => {
    const runId = ++runIdRef.current; // invalidate in-flight polls
    clearTimers();
    setAuthorizationUrl('');
    setPaymentReference('');
    setErrorMessage('');
    setPhase('form');
    return runId;
  }, [clearTimers]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      runIdRef.current += 1;
      clearTimers();
      router.back();
      return true;
    });
    return () => {
      subscription.remove();
      runIdRef.current += 1; // invalidate in-flight polls on unmount
      clearTimers();
    };
  }, [clearTimers, router]);

  // ── Render ──────────────────────────────────────────────────────────────

  const selectedProvider = providers.find((p) => p.provider === selectedProviderId) ?? providers[0];

  if (phase === 'initializing') {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState text="Starting your payment…" />
      </SafeAreaView>
    );
  }

  if (phase === 'awaiting') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.awaitingContainer}>
          <Text style={styles.awaitingTitle}>
            Scan to pay {NGN}
            {amount?.toLocaleString()}
          </Text>
          <Text style={styles.awaitingSubtitle}>
            Point your phone camera at the code to open the secure {NGN}checkout
          </Text>
          <View style={styles.qrWrap}>
            <QRCodeView value={authorizationUrl} size={440} />
          </View>
          {paymentReference ? (
            <Text
              style={styles.referenceText}
              accessibilityLabel={`Payment reference ${paymentReference}`}
            >
              Payment reference: {paymentReference}
            </Text>
          ) : null}
          <Text style={styles.awaitingHint}>
            Payment updates automatically — keep this screen open
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'success' || phase === 'failed' || phase === 'timeout' || phase === 'error') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.outcomeContainer}>
          <Text
            style={[
              styles.outcomeTitle,
              phase === 'success' && styles.outcomeSuccess,
              (phase === 'failed' || phase === 'error') && styles.outcomeFailure,
            ]}
          >
            {phase === 'success' && 'Payment received!'}
            {phase === 'failed' && 'Payment failed'}
            {phase === 'timeout' && 'Still processing…'}
            {phase === 'error' && 'Something went wrong'}
          </Text>
          <Text style={styles.outcomeBody}>
            {phase === 'success' &&
              `${NGN}${amount?.toLocaleString()} has been added to your wallet.`}
            {phase === 'failed' && 'No money was taken. You can safely try again.'}
            {phase === 'timeout' &&
              'We have not received a confirmation yet. If you completed the payment, check Transactions in a moment.'}
            {phase === 'error' && errorMessage}
          </Text>
          {(phase === 'failed' || phase === 'timeout') && paymentReference ? (
            <Text
              style={styles.referenceText}
              accessibilityLabel={`Payment reference ${paymentReference}`}
            >
              Payment reference: {paymentReference}
            </Text>
          ) : null}
          <FocusableButton
            title={phase === 'success' ? 'Done' : 'Try again'}
            onPress={() => {
              if (phase === 'success') {
                router.back();
              } else {
                resetToForm();
              }
            }}
            hasTVPreferredFocus
            style={styles.outcomeButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Phase 'form' ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add money to your wallet</Text>
        <Text style={styles.formSubtitle}>
          Choose an amount, then scan the code with your phone to pay
        </Text>

        {providersError ? <ErrorState description={providersError} /> : null}

        <View style={styles.chipRow}>
          {addFundsPresetAmounts.map((preset, index) => {
            const selected = amount === preset;
            return (
              <FocusableCard
                key={preset}
                hasTVPreferredFocus={index === 0}
                onPress={() => setAmount(preset)}
                accessibilityLabel={`Select ${NGN}${preset.toLocaleString()}`}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {NGN}
                  {preset.toLocaleString()}
                </Text>
              </FocusableCard>
            );
          })}
        </View>

        {providers.length > 1 ? (
          <View style={styles.chipRow}>
            {providers.map((p) => {
              const selected = p.provider === selectedProviderId;
              return (
                <FocusableCard
                  key={p.provider}
                  hasTVPreferredFocus={false}
                  onPress={() => setSelectedProviderId(p.provider)}
                  accessibilityLabel={`Pay with ${PROVIDER_LABELS[p.provider] ?? p.name}`}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      styles.chipProviderText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {PROVIDER_LABELS[p.provider] ?? p.name}
                  </Text>
                </FocusableCard>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.limitsHint}>
          Min {NGN}
          {walletLimits.minimumDeposit.toLocaleString()} · Max {NGN}
          {walletLimits.maximumDeposit.toLocaleString()}
          {selectedProvider
            ? ` · Paid via ${PROVIDER_LABELS[selectedProvider.provider] ?? selectedProvider.name}`
            : ''}
        </Text>

        <FocusableButton
          title={
            amount == null
              ? 'Select an amount to continue'
              : selectedProvider
                ? `Continue to payment via ${PROVIDER_LABELS[selectedProvider.provider] ?? selectedProvider.name}`
                : 'Continue to payment'
          }
          onPress={() => {
            if (amount != null) void startFunding();
          }}
          variant={amount == null ? 'secondary' : 'primary'}
          style={styles.continueButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  formContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tvSpacing.lg,
    paddingHorizontal: tvSpacing.section,
  },
  formTitle: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
  },
  formSubtitle: {
    fontSize: tvTypography.fontSize.lg,
    color: colors.text.muted,
  },
  chipRow: {
    flexDirection: 'row',
    gap: tvSpacing.lg,
    marginTop: tvSpacing.md,
  },
  chip: {
    paddingHorizontal: tvSpacing.xl,
    paddingVertical: tvSpacing.lg,
    borderRadius: tvRadius.lg,
  },
  chipSelected: {
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  chipText: {
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.primary,
  },
  chipProviderText: {
    fontSize: tvTypography.fontSize.lg,
  },
  chipTextSelected: {
    color: colors.primary[500],
  },
  limitsHint: {
    fontSize: tvTypography.fontSize.sm,
    color: colors.text.muted,
  },
  continueButton: {
    marginTop: tvSpacing.md,
    minWidth: 380,
  },
  awaitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tvSpacing.md,
  },
  awaitingTitle: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
  },
  awaitingSubtitle: {
    fontSize: tvTypography.fontSize.lg,
    color: colors.text.secondary,
  },
  qrWrap: {
    padding: tvSpacing.xl,
    borderRadius: tvRadius.xl,
    backgroundColor: colors.bg.tertiary,
    marginVertical: tvSpacing.md,
  },
  awaitingHint: {
    fontSize: tvTypography.fontSize.base,
    color: colors.text.muted,
  },
  referenceText: {
    // Monospace so the reference reads unambiguously from a screenshot when
    // quoted back to support.
    fontSize: tvTypography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  outcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tvSpacing.lg,
    paddingHorizontal: tvSpacing.section,
  },
  outcomeTitle: {
    fontSize: tvTypography.fontSize.hero,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
  },
  outcomeSuccess: {
    color: colors.success[400],
  },
  outcomeFailure: {
    color: colors.error[400],
  },
  outcomeBody: {
    fontSize: tvTypography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 720,
  },
  outcomeButton: {
    marginTop: tvSpacing.md,
    minWidth: 320,
  },
});
