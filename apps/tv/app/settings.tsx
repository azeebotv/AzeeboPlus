/**
 * TV settings — account & session management for the 10-foot UI.
 *
 * Since TVs now stay signed in (device-link), this is where a household
 * signs out: it revokes the session server-side and clears local tokens,
 * then returns to the device-link sign-in screen.
 *
 * D-pad layout: a vertical stack of focusable rows; back returns home.
 * Sign-out uses an inline two-step confirmation (→ confirm/cancel row)
 * instead of a modal, because TV modals fight focus.
 *
 * Structure note: the auth check happens in the outer component so the
 * inner (stateful) component can obey the rules of hooks unconditionally.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, BackHandler, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@azeebo/react-data';
import type { User } from '@azeebo/react-data';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES, type SupportedLanguage } from '../src/i18n';
import { logger } from '@azeebo/react-data/utils/logger';
import { FocusableButton, FocusableCard } from '../src/components/Focusable';
import { ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing, tvRadius } from '../src/theme';

type Phase = 'idle' | 'signing-out' | 'confirm';

export default function TVSettingsScreen() {
  // L3: hook-free wrapper. All hooks live in SettingsGate/SettingsContent
  // where every hook runs unconditionally — the signed-out case is a JSX
  // conditional, not an early return, so no hook can end up after a return
  // by accident.
  return <SettingsGate />;
}

function SettingsGate() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const goToSignIn = useCallback(() => router.replace('/signin'), [router]);

  // Guard against a signed-out TV landing here directly (deep link, stale
  // route): show something honest instead of a skeleton with "Guest".
  return <SettingsContent user={user} logout={logout} goToSignIn={goToSignIn} />;
}

function SettingsContent({
  user,
  logout,
  goToSignIn,
}: {
  user: User | null;
  logout: () => Promise<void>;
  goToSignIn: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );

  useEffect(() => {
    setCurrentLanguage((i18n.language as SupportedLanguage) || 'en');
  }, [i18n.language]);

  const handleLanguageChange = useCallback(async (lang: SupportedLanguage) => {
    try {
      await changeLanguage(lang); // persists via the shared i18n module
      setCurrentLanguage(lang);
    } catch (err) {
      logger.error('TV language change failed', err);
    }
  }, []);

  const performSignOut = useCallback(async () => {
    setPhase('signing-out');
    setError(null);
    try {
      await logout(); // revokes server-side + clears local tokens
      // Land on the device-link sign-in screen; the session is gone.
      goToSignIn();
    } catch (err) {
      logger.error('TV sign-out failed', err);
      setError('Could not sign out. Check your connection and try again.');
      setPhase('idle');
    }
  }, [logout, goToSignIn]);

  // Back exits settings (unless mid-signout); Escape hatch from the confirm
  // row without leaving the screen.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'signing-out') return true;
      if (phase === 'confirm') {
        setPhase('idle');
        return true;
      }
      router.back();
      return true;
    });
    return () => subscription.remove();
  }, [phase, router]);

  return (
    <SafeAreaView style={styles.safe}>
      {!user ? (
        <View style={styles.centered}>
          <Text style={styles.outcomeTitle}>Not signed in</Text>
          <Text style={styles.outcomeBody}>
            Sign in to Azeebo to manage this TV. Press back, then select “Sign in”.
          </Text>
          <FocusableButton title="Go to sign-in" onPress={goToSignIn} hasTVPreferredFocus />
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Account</Text>

          {/* ── Account info ─────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {(user.displayName || user.name || user.email || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoName}>{user.displayName || user.name}</Text>
                <Text style={styles.infoEmail}>{user.email}</Text>
                {user.role && user.role !== 'user' ? (
                  <Text style={styles.infoRole}>{user.role}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Language section ──────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => {
                const selected = lang.code === currentLanguage;
                return (
                  <FocusableCard
                    key={lang.code}
                    onPress={() => void handleLanguageChange(lang.code)}
                    accessibilityLabel={`Language ${lang.nativeName}`}
                    style={[styles.languageChip, selected && styles.languageChipSelected]}
                  >
                    <Text
                      style={[styles.languageChipText, selected && styles.languageChipTextSelected]}
                    >
                      {lang.nativeName}
                    </Text>
                  </FocusableCard>
                );
              })}
            </View>
          </View>

          {/* ── Device section ───────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This TV</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoText}>
                <Text style={styles.infoName}>Azeebo TV</Text>
                <Text style={styles.infoEmail}>
                  Signed in{user.email ? ` as ${user.email}` : ''} · linked via code
                </Text>
              </View>
            </View>
            <Text style={styles.hint}>
              To use a different account on this TV, sign out and start again with a new code.
            </Text>
          </View>

          {/* ── Sign-out ─────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session</Text>

            {phase === 'confirm' ? (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmText}>Sign out of Azeebo on this TV?</Text>
                <View style={styles.confirmButtons}>
                  <FocusableButton
                    title="Yes, sign out"
                    variant="primary"
                    onPress={() => void performSignOut()}
                    hasTVPreferredFocus
                    style={styles.confirmButton}
                  />
                  <FocusableButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setPhase('idle')}
                    style={styles.confirmButton}
                  />
                </View>
              </View>
            ) : (
              <FocusableButton
                title={phase === 'signing-out' ? 'Signing out…' : 'Sign out of this TV'}
                variant="secondary"
                onPress={() => setPhase('confirm')}
                style={styles.signOutButton}
              />
            )}

            {error ? <ErrorState description={error} /> : null}
          </View>
        </View>
      )}
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
    paddingHorizontal: tvSpacing.section,
    paddingTop: tvSpacing.xl,
    maxWidth: 980,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: tvTypography.fontSize.sm,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.muted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: tvTypography.fontSize.hero,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: tvSpacing.xl,
  },
  section: {
    marginBottom: tvSpacing.xl,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tvSpacing.md,
  },
  languageChip: {
    paddingHorizontal: tvSpacing.lg,
    paddingVertical: tvSpacing.md,
    borderRadius: tvRadius.md,
  },
  languageChipSelected: {
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  languageChipText: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.md,
    fontWeight: tvTypography.fontWeight.semibold,
  },
  languageChipTextSelected: {
    color: colors.primary[500],
  },
  sectionTitle: {
    fontSize: tvTypography.fontSize.lg,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: tvSpacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: tvRadius.lg,
    padding: tvSpacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    gap: 4,
  },
  infoName: {
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.primary,
  },
  infoEmail: {
    fontSize: tvTypography.fontSize.base,
    color: colors.text.muted,
  },
  infoRole: {
    fontSize: tvTypography.fontSize.sm,
    color: colors.primary[300],
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: tvTypography.fontWeight.semibold,
  },
  hint: {
    fontSize: tvTypography.fontSize.sm,
    color: colors.text.muted,
    marginTop: tvSpacing.md,
    lineHeight: 22,
  },
  confirmRow: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: tvRadius.lg,
    padding: tvSpacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[500],
    gap: tvSpacing.md,
  },
  confirmText: {
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.semibold,
    color: colors.text.primary,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: tvSpacing.md,
  },
  confirmButton: {
    minWidth: 260,
  },
  signOutButton: {
    alignSelf: 'flex-start',
    minWidth: 340,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tvSpacing.md,
    paddingHorizontal: tvSpacing.section,
  },
  outcomeTitle: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
  },
  outcomeBody: {
    fontSize: tvTypography.fontSize.lg,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 640,
  },
});
