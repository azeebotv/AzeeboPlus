import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useWallet } from '@azeebo/react-data';
import { FocusableButton, FocusableCard } from '../../src/components/Focusable';
import { colors, tvTypography, tvSpacing, tvRadius } from '../../src/theme';

export default function TVAccountScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { wallet } = useWallet();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      router.replace('/signin' as Href);
    } catch {
      router.replace('/signin' as Href);
    }
  }, [logout, router]);

  const rawBalance = wallet?.balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <FocusableButton
            title="← Back"
            variant="secondary"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Account & Subscription</Text>
          <View style={{ width: 120 }} />
        </View>

        {isAuthenticated && user ? (
          <View style={styles.grid}>
            {/* User Profile Card */}
            <FocusableCard onPress={() => {}} style={styles.card} hasTVPreferredFocus>
              <Text style={styles.cardLabel}>Signed In As</Text>
              <Text style={styles.cardTitle}>{user.name || 'Azeebo Viewer'}</Text>
              <Text style={styles.cardSubtitle}>{user.email}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active Subscriber</Text>
              </View>
            </FocusableCard>

            {/* Wallet Balance Card */}
            <FocusableCard
              onPress={() => router.push('/wallet/fund' as Href)}
              style={styles.card}
            >
              <Text style={styles.cardLabel}>Wallet Balance</Text>
              <Text style={styles.cardTitle}>
                ₦{((rawBalance) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.cardSubtitle}>Press Select to top up</Text>
            </FocusableCard>

            {/* Actions Row */}
            <View style={styles.actionsRow}>
              {!confirmSignOut ? (
                <FocusableButton
                  title="Sign Out of TV"
                  variant="secondary"
                  onPress={() => setConfirmSignOut(true)}
                />
              ) : (
                <View style={styles.confirmRow}>
                  <FocusableButton
                    title="Confirm Sign Out"
                    variant="primary"
                    onPress={() => void handleSignOut()}
                  />
                  <FocusableButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setConfirmSignOut(false)}
                  />
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Not currently signed in.</Text>
            <FocusableButton
              title="Pair TV / Sign In"
              variant="primary"
              onPress={() => router.replace('/signin' as Href)}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: tvSpacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tvSpacing.xxl,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: tvTypography.fontWeight.extrabold,
  },
  grid: {
    gap: tvSpacing.xl,
    maxWidth: 800,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    padding: tvSpacing.xl,
    borderRadius: tvRadius.lg,
  },
  cardLabel: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: tvSpacing.xs,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: tvTypography.fontWeight.bold,
    marginBottom: tvSpacing.xs,
  },
  cardSubtitle: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: tvSpacing.md,
    paddingVertical: tvSpacing.xs,
    borderRadius: tvRadius.pill,
    marginTop: tvSpacing.md,
  },
  badgeText: {
    color: '#34C759',
    fontSize: tvTypography.fontSize.xs,
    fontWeight: tvTypography.fontWeight.bold,
  },
  actionsRow: {
    marginTop: tvSpacing.lg,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: tvSpacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: tvSpacing.section,
    gap: tvSpacing.lg,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.xl,
  },
});
