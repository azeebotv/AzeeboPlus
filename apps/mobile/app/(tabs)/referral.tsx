import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { referralApi } from '../../src/api';
import { logger } from '../../src/utils/logger';

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

export default function ReferralScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
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
      logger.error('Failed to load referral data', error);
    } finally {
      setIsLoading(false);
    }
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

    try {
      await Share.share({
        message: `My AZEEBO+ referral code: ${stats.referralCode}`,
      });
    } catch (error) {
      Alert.alert('Code copied!', `Your referral code ${stats.referralCode} has been copied`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading referral data...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load referral data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Referral Program</Text>
        <Text style={styles.subtitle}>Invite friends and earn rewards</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{stats.referralCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={shareReferralLink}>
          <Text style={styles.shareButtonText}>Share Referral Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalReferrals}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.successfulReferrals}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.commissionRate}%</Text>
          <Text style={styles.statLabel}>Commission</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.earningsValue]}>
            ₦{stats.totalEarnings.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Referrals</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  codeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  codeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
    letterSpacing: 4,
  },
  copyButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  earningsValue: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  referralCard: {
    backgroundColor: '#1F2937',
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
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  referralDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: '#10B98120',
  },
  statusBadgeActive: {
    backgroundColor: '#8B5CF620',
  },
  statusBadgePending: {
    backgroundColor: '#F59E0B20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  earningsText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});
