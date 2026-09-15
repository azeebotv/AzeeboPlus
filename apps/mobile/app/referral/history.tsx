import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { referralApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  commissionRate: number;
  referralLink: string;
}

interface Referral {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
  status: 'pending' | 'active' | 'rewarded';
  earningsGenerated: number;
}

export default function ReferralHistoryScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      const [statsResponse, referralsResponse] = await Promise.all([
        referralApi.getStats(),
        referralApi.getReferrals(),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (referralsResponse.success && referralsResponse.data) {
        setReferrals(referralsResponse.data);
      }
    } catch (error) {
      logger.error('Failed to load referral history', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadData();
  }, [authLoading, isAuthenticated, loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const shareReferralLink = async () => {
    if (!stats) return;
    try {
      await Share.share({
        message: `Join AZEEBO+ using my referral code ${stats.referralCode} and get started! ${stats.referralLink}`,
        title: 'Join AZEEBO+',
      });
    } catch (error) {
      logger.error('Failed to share', error);
    }
  };

  const copyReferralCode = async () => {
    if (!stats) return;
    Alert.alert('Referral code', `Your referral code: ${stats.referralCode}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E8420A" />
        <Text style={styles.loadingText}>Loading referral history...</Text>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Failed to load referral data</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E8420A" />
        }
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Referral History</Text>
          <Text style={styles.subtitle}>Track your referrals and earnings</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.earningsValue]}>
              ₦{stats.totalEarnings.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pendingReferrals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Share section */}
        <View style={styles.shareSection}>
          <Text style={styles.shareText}>Share your referral code</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={copyReferralCode}>
              <Text style={styles.shareButtonText}>Copy Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButtonSecondary} onPress={shareReferralLink}>
              <Text style={styles.shareButtonSecondaryText}>Share Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Referral list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Referrals</Text>
          {referrals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Share your code to start earning</Text>
            </View>
          ) : (
            referrals.map((referral) => (
              <View key={referral.id} style={styles.referralCard}>
                <View style={styles.referralHeader}>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{referral.displayName}</Text>
                    <Text style={styles.referralDate}>
                      Joined {new Date(referral.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      referral.status === 'rewarded'
                        ? styles.statusBadgeSuccess
                        : referral.status === 'active'
                          ? styles.statusBadgeActive
                          : styles.statusBadgePending,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Text>
                  </View>
                </View>
                {referral.earningsGenerated > 0 && (
                  <Text style={styles.earningsText}>
                    Earned: ₦{referral.earningsGenerated.toLocaleString()}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  content: { flex: 1, padding: 16, paddingBottom: 32 },
  loadingText: { color: colors.light[400], marginTop: 12, textAlign: 'center' },
  errorText: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  backButton: { marginBottom: 16, paddingVertical: 4 },
  backText: { color: '#9A8A7A', fontSize: 14 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.light[400] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#E8420A', marginBottom: 4 },
  earningsValue: { color: '#10B981' },
  statLabel: { fontSize: 11, color: colors.light[400] },
  shareSection: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  shareText: { color: colors.light[400], fontSize: 14, marginBottom: 12 },
  shareButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  shareButton: {
    flex: 1,
    backgroundColor: '#E8420A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  shareButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A1A1A',
  },
  shareButtonSecondaryText: { color: '#9A8A7A', fontWeight: '600', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.light[400], marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#6B7280' },
  referralCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  referralDate: { fontSize: 12, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeSuccess: { backgroundColor: '#10B98120' },
  statusBadgeActive: { backgroundColor: colors.alpha.primary20 },
  statusBadgePending: { backgroundColor: '#F59E0B20' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  earningsText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
});
