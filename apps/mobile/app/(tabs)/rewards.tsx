import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { apiClient } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import {
  PageTransition,
  ScrollReveal,
  StaggerGrid,
  GlowCard,
  AnimatedProgress,
  FadeIn,
} from '../../src/components/motion';
import { radius, colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

interface RewardItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  icon: string;
  color: string;
}

interface RewardHistoryItem {
  id: string;
  title: string;
  points: number;
  date: string;
  icon: string;
}

interface RedeemOption {
  id: string;
  name: string;
  description?: string | null;
  cost: number;
  type: string;
}

export default function RewardsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);
  const [redeemOptions, setRedeemOptions] = useState<RedeemOption[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // History sheet + redeem confirmation sheet (previously the history button
  // and the redeem cards were no-ops).
  const [historyVisible, setHistoryVisible] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<RedeemOption | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchRewards = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // reward-service endpoints: account overview (auto-creates the account),
      // missions, points ledger history, and the redeem catalog. Wallet-side
      // point→cash redemption rides POST /v1/wallet/redeem-reward.
      const [accountRes, missionsRes, historyRes, catalogRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { rewardAccount: { points: number } } }>(
          '/v1/rewards'
        ),
        apiClient
          .get<{
            success: boolean;
            data: { missions: MissionWithCompletion[] };
          }>('/v1/rewards/missions')
          .catch(() => null),
        apiClient
          .get<{
            success: boolean;
            data: { history: LedgerEntry[] };
          }>('/v1/rewards/history?limit=10')
          .catch(() => null),
        apiClient
          .get<{
            success: boolean;
            data: { options: RedeemOption[] };
          }>('/v1/rewards/redeem-options')
          .catch(() => null),
      ]);

      const account = accountRes?.data?.rewardAccount;
      setCurrentPoints(typeof account?.points === 'number' ? account.points : 0);

      const missions: MissionWithCompletion[] = missionsRes?.data?.missions ?? [];
      setRewards(
        missions.slice(0, 6).map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description || 'Complete this mission to earn points',
          // Missions report completion, not fractional progress — show done or
          // started rather than inventing a percentage.
          progress: m.isCompleted ? m.points : 0,
          total: m.points,
          icon: MISSION_ICONS[m.type] || '🎯',
          color: m.isCompleted ? colors.success[500] : colors.primary[500],
        }))
      );

      const ledger: LedgerEntry[] = historyRes?.data?.history ?? [];
      setHistory(
        ledger.map((entry) => ({
          id: entry.id,
          title: entry.reason || (entry.type === 'credit' ? 'Points earned' : 'Points redeemed'),
          points: entry.points,
          date: new Date(entry.createdAt).toLocaleDateString(),
          icon: entry.type === 'credit' ? '➕' : '🎁',
        }))
      );

      setRedeemOptions(catalogRes?.data?.options ?? []);
    } catch (err: unknown) {
      logger.error('Failed to load rewards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRewards();
    setIsRefreshing(false);
  };

  const confirmRedeem = async () => {
    if (!redeemTarget) return;
    setIsRedeeming(true);
    try {
      // reward-service redemption debits the points account.
      const res = await apiClient.post<{ success: boolean; message?: string }>(
        '/v1/rewards/redeem',
        { rewardId: redeemTarget.id }
      );
      if (res.success) {
        Alert.alert(
          'Redeemed!',
          `"${redeemTarget.name}" has been redeemed. Check your rewards activity for details.`
        );
        setRedeemTarget(null);
        await fetchRewards();
      } else {
        Alert.alert('Redemption failed', res.message || 'Please try again later.');
      }
    } catch (err: unknown) {
      Alert.alert(
        'Redemption failed',
        err instanceof Error ? err.message : 'Please try again later.'
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Rewards Screen" style={[styles.safeArea, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ScrollView style={styles.container}>
          <LoadingState text="Loading rewards..." />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ScrollView style={styles.container}>
          <ErrorState description={error} onRetry={fetchRewards} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <ScrollView
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: isDark ? '#1A0A0A' : '#ffffff' },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={brand.flame} />
        }
        keyboardDismissMode="on-drag"
      >
        <PageTransition>
          <ScrollReveal direction="up">
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                Rewards
              </Text>
              <TouchableOpacity
                style={[styles.historyButton, { backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }]}
                onPress={() => setHistoryVisible(true)}
                accessibilityLabel="View rewards history"
                accessibilityRole="button"
              >
                <Text style={styles.historyIcon}>📜</Text>
              </TouchableOpacity>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={60}>
            <FadeIn>
              <View style={styles.pointsCard}>
                <View style={styles.pointsContent}>
                  <Text style={styles.pointsLabel}>Total Points</Text>
                  <View style={styles.pointsAmount}>
                    <Text style={styles.pointsValue}>{currentPoints.toLocaleString()}</Text>
                    <Text style={styles.pointsSuffix}>pts</Text>
                  </View>
                  <Text style={styles.pointsEquivalent}>
                    ≈ {Math.floor(currentPoints / 10)} NGN
                  </Text>
                </View>
                <View style={styles.pointsDecoration}>
                  <Text style={styles.decorationIcon}>🎁</Text>
                </View>
              </View>
            </FadeIn>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={120}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                Earn Points
              </Text>
              <StaggerGrid staggerDelay={60}>
                {rewards.length === 0 ? (
                  <View
                    style={[
                      styles.rewardItem,
                      {
                        backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
                        alignItems: 'center',
                        paddingVertical: 24,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
                    <Text
                      style={[
                        styles.rewardTitle,
                        { color: isDark ? '#ffffff' : '#1A0A0A', textAlign: 'center' },
                      ]}
                    >
                      No missions available yet
                    </Text>
                    <Text style={[styles.rewardDescription, { textAlign: 'center' }]}>
                      Earn points by watching content and engaging with the platform
                    </Text>
                  </View>
                ) : (
                  rewards.map((reward) => (
                    <View
                      key={reward.id}
                      style={[
                        styles.rewardItem,
                        { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' },
                      ]}
                    >
                      <View style={[styles.rewardIcon, { backgroundColor: `${reward.color}20` }]}>
                        <Text style={styles.rewardIconText}>{reward.icon}</Text>
                      </View>
                      <View style={styles.rewardInfo}>
                        <Text
                          style={[styles.rewardTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}
                        >
                          {reward.title}
                        </Text>
                        <Text style={styles.rewardDescription}>{reward.description}</Text>
                        <AnimatedProgress
                          progress={reward.total > 0 ? (reward.progress / reward.total) * 100 : 0}
                          color={reward.color}
                        />
                        <Text style={styles.rewardProgressText}>
                          {reward.progress >= reward.total && reward.total > 0
                            ? 'Completed 🎉'
                            : `${reward.progress}/${reward.total} pts`}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </StaggerGrid>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={180}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                Redeem Rewards
              </Text>
              <View style={styles.redeemGrid}>
                {redeemOptions.length === 0 ? (
                  <View
                    style={[
                      styles.redeemCard,
                      {
                        alignItems: 'center',
                        paddingVertical: 24,
                        backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🎁</Text>
                    <Text
                      style={[
                        styles.redeemName,
                        { color: isDark ? '#ffffff' : '#1A0A0A', textAlign: 'center' },
                      ]}
                    >
                      No redeem options available
                    </Text>
                    <Text style={[styles.rewardDescription, { textAlign: 'center' }]}>
                      Check back later for new rewards
                    </Text>
                  </View>
                ) : (
                  redeemOptions.map((option) => (
                    <GlowCard
                      key={option.id}
                      variant="subtle"
                      padding={16}
                      onPress={() => setRedeemTarget(option)}
                      style={[styles.redeemCard, currentPoints < option.cost && { opacity: 0.5 }]}
                    >
                      <Text style={styles.redeemIcon}>
                        {REWARD_TYPE_ICONS[option.type] || '🎁'}
                      </Text>
                      <Text style={[styles.redeemName, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                        {option.name}
                      </Text>
                      <View
                        style={[
                          styles.redeemPoints,
                          currentPoints < option.cost && {
                            backgroundColor: colors.neutral[300],
                          },
                        ]}
                      >
                        <Text style={styles.redeemPointsText}>{option.cost} pts</Text>
                      </View>
                    </GlowCard>
                  ))
                )}
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={240}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                Recent Activity
              </Text>
              <View style={styles.historyList}>
                {history.length === 0 ? (
                  <Text style={{ color: colors.text.secondary, textAlign: 'center', padding: 20 }}>
                    No recent activity
                  </Text>
                ) : (
                  history.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.historyItem,
                        { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' },
                      ]}
                    >
                      <View style={styles.historyIconView}>
                        <Text style={styles.historyIconText}>{item.icon}</Text>
                      </View>
                      <View style={styles.historyInfo}>
                        <Text
                          style={[styles.historyTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.historyDate}>{item.date}</Text>
                      </View>
                      <Text
                        style={[
                          styles.historyPoints,
                          item.points < 0 && { color: colors.error[500] },
                        ]}
                      >
                        {item.points > 0 ? '+' : ''}
                        {item.points}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <GlowCard variant="subtle" padding={16} style={styles.bonusSection}>
              <Text style={styles.bonusIcon}>🎉</Text>
              <View style={styles.bonusContent}>
                <Text style={[styles.bonusTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                  Bonus Points Weekend!
                </Text>
                <Text style={styles.bonusDescription}>
                  Earn 2x points on all activities this weekend
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bonusButton}
                onPress={() =>
                  Alert.alert(
                    'Bonus Points Weekend',
                    'Earn 2x points on every activity from Friday midnight to Sunday midnight. Watch more, vote more, and complete missions to stack up bonus points!',
                    [{ text: 'Got it' }]
                  )
                }
                accessibilityRole="button"
              >
                <Text style={styles.bonusButtonText}>Learn More</Text>
              </TouchableOpacity>
            </GlowCard>
          </ScrollReveal>
        </PageTransition>
      </ScrollView>

      {/* Rewards history sheet — opened from the 📜 header button. */}
      <Modal
        visible={historyVisible}
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <SafeAreaView
          style={[styles.sheetSafe, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
              Rewards History
            </Text>
            <TouchableOpacity
              onPress={() => setHistoryVisible(false)}
              accessibilityLabel="Close rewards history"
            >
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {history.length === 0 ? (
              <Text style={[styles.sheetEmpty, { color: colors.text.secondary }]}>
                No rewards activity yet. Complete missions to start earning!
              </Text>
            ) : (
              history.map((item) => (
                <View
                  key={item.id}
                  style={[styles.historyItem, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
                >
                  <View style={styles.historyIconView}>
                    <Text style={styles.historyIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text
                    style={[styles.historyPoints, item.points < 0 && { color: colors.error[500] }]}
                  >
                    {item.points > 0 ? '+' : ''}
                    {item.points}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Redeem confirmation sheet — confirms before debiting points. */}
      <Modal
        visible={redeemTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !isRedeeming && setRedeemTarget(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
            {redeemTarget && (
              <>
                <Text style={[styles.confirmTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
                  Redeem "{redeemTarget.name}"?
                </Text>
                {redeemTarget.description ? (
                  <Text style={styles.confirmDescription}>{redeemTarget.description}</Text>
                ) : null}
                <Text style={styles.confirmCost}>
                  {redeemTarget.cost.toLocaleString()} pts · you have{' '}
                  {currentPoints.toLocaleString()} pts
                </Text>
                {currentPoints < redeemTarget.cost ? (
                  <Text style={styles.confirmWarning}>
                    You don&apos;t have enough points yet — keep earning!
                  </Text>
                ) : null}
                <View style={styles.confirmActions}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.confirmCancel]}
                    onPress={() => setRedeemTarget(null)}
                    disabled={isRedeeming}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      styles.confirmGo,
                      (currentPoints < redeemTarget.cost || isRedeeming) &&
                        styles.confirmGoDisabled,
                    ]}
                    onPress={confirmRedeem}
                    disabled={currentPoints < redeemTarget.cost || isRedeeming}
                  >
                    {isRedeeming ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.confirmGoText}>Redeem</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

interface MissionWithCompletion {
  id: string;
  title: string;
  description: string | null;
  points: number;
  type: string;
  isCompleted: boolean;
}

interface LedgerEntry {
  id: string;
  points: number;
  type: string;
  reason: string;
  createdAt: string;
}

const MISSION_ICONS: Record<string, string> = {
  watch: '📺',
  vote: '🗳️',
  referral: '👥',
  streak: '🔥',
  social: '💬',
  quiz: '🧠',
};

const REWARD_TYPE_ICONS: Record<string, string> = {
  points: '💰',
  bonus: '🎁',
  promo: '🎟️',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIcon: {
    fontSize: 18,
  },
  pointsCard: {
    backgroundColor: brand.flame,
    borderRadius: radius.xl,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: brand.flame,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsContent: {
    flex: 1,
  },
  pointsLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 4,
  },
  pointsAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  pointsValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  pointsSuffix: {
    color: '#ffffff',
    fontSize: 14,
  },
  pointsEquivalent: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  pointsDecoration: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorationIcon: {
    fontSize: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconText: {
    fontSize: 22,
  },
  rewardInfo: {
    flex: 1,
    gap: 4,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rewardDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  rewardProgressText: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  redeemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  redeemCard: {
    width: '47%',
    alignItems: 'center',
  },
  redeemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  redeemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  redeemPoints: {
    backgroundColor: brand.flame,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.xl,
  },
  redeemPointsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
  },
  historyIconView: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  bonusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  bonusIcon: {
    fontSize: 32,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bonusDescription: {
    fontSize: 13,
    color: colors.warning[700],
  },
  bonusButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F59E0B',
    borderRadius: radius.xl,
  },
  bonusButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetSafe: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sheetClose: {
    fontSize: 22,
    color: colors.text.secondary,
    padding: 8,
  },
  sheetBody: {
    padding: 16,
    gap: 12,
  },
  sheetEmpty: {
    textAlign: 'center',
    paddingVertical: 40,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    padding: 24,
    gap: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  confirmCost: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[500],
  },
  confirmWarning: {
    fontSize: 13,
    color: colors.error[500],
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  confirmCancel: {
    backgroundColor: colors.neutral[100],
  },
  confirmCancelText: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
  confirmGo: {
    backgroundColor: brand.flame,
  },
  confirmGoDisabled: {
    opacity: 0.5,
  },
  confirmGoText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
