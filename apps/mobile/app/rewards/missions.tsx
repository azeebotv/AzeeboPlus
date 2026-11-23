import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { apiClient } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  image?: string;
  isActive: boolean;
  type: string;
  progress?: number;
  total?: number;
  isCompleted?: boolean;
}

export default function MissionsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const claimMission = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      await apiClient.post(`/rewards/missions/${missionId}/claim`);
      Alert.alert('Bounty Claimed! 🎉', 'Your mission points have been added to your balance.');
      await loadData();
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to claim reward');
    } finally {
      setClaimingId(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get<Mission[] | { missions: Mission[] }>('/rewards/missions');
      const data = Array.isArray(res) ? res : (res as { missions: Mission[] }).missions || [];
      setMissions(
        data.map((m: Mission) => ({
          id: String(m.id),
          title: String(m.title || ''),
          description: String(m.description || ''),
          points: Number(m.points || 0),
          image: m.image,
          isActive: Boolean(m.isActive),
          type: String(m.type || 'mission'),
          progress: Number(m.progress ?? 0),
          total: Number(m.total ?? 100),
          isCompleted: Boolean(m.isCompleted),
        }))
      );
    } catch (error) {
      logger.error('Failed to load missions', error);
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

  const activeMissions = missions.filter((m) => !m.isCompleted);
  const completedMissions = missions.filter((m) => m.isCompleted);

  if (isLoading) {
    return (
      <SafeAreaView accessibilityLabel="Missions Screen" style={styles.container}>
        <ActivityIndicator size="large" color={brand.flame} />
        <Text style={styles.loadingText}>Loading missions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={brand.flame} />
        }
      >
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Missions</Text>
          <Text style={styles.subtitle}>Complete missions to earn points</Text>
        </View>

        {/* Active missions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Missions ({activeMissions.length})</Text>
          {activeMissions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No active missions right now</Text>
            </View>
          ) : (
            activeMissions.map((mission) => (
              <View key={mission.id} style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <View style={[styles.missionTypeBadge]}>
                    <Text style={styles.missionTypeText}>{mission.type}</Text>
                  </View>
                  <Text style={styles.missionPoints}>{mission.points} pts</Text>
                </View>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription}>{mission.description}</Text>

                {/* Progress bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>
                      {mission.progress}/{mission.total}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(((mission.progress ?? 0) / (mission.total ?? 100)) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {(mission.progress ?? 0) >= (mission.total ?? 100) && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={claimingId === mission.id}
                    onPress={() => claimMission(mission.id)}
                    style={styles.claimButton}
                  >
                    <Text style={styles.claimButtonText}>
                      {claimingId === mission.id ? 'Claiming...' : `Claim +${mission.points} pts`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Completed missions */}
        {completedMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed ({completedMissions.length})</Text>
            {completedMissions.map((mission) => (
              <View key={mission.id} style={[styles.missionCard, styles.missionCardCompleted]}>
                <View style={styles.missionHeader}>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✓ Done</Text>
                  </View>
                  <Text style={styles.missionPointsCompleted}>+{mission.points} pts</Text>
                </View>
                <Text style={styles.missionTitleCompleted}>{mission.title}</Text>
                <Text style={styles.missionDescriptionCompleted}>{mission.description}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A0A0A' },
  content: { flex: 1, padding: 16, paddingBottom: 32 },
  loadingText: { color: colors.light[400], marginTop: 12, textAlign: 'center' },
  backButton: { marginBottom: 16, paddingVertical: 4 },
  backText: { color: '#9A8A7A', fontSize: 14 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.light[400] },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.light[400] },
  missionCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  missionCardCompleted: { opacity: 0.6 },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTypeBadge: {
    backgroundColor: 'rgba(232,66,10,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  missionTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: brand.flame,
    textTransform: 'capitalize',
  },
  missionPoints: { fontSize: 16, fontWeight: '700', color: brand.flame },
  missionPointsCompleted: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  missionTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  missionTitleCompleted: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.light[400],
    marginBottom: 4,
  },
  missionDescription: { fontSize: 13, color: colors.light[400], marginBottom: 16 },
  missionDescriptionCompleted: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  progressSection: { marginTop: 4 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: colors.light[400] },
  progressValue: { fontSize: 12, color: colors.light[400] },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: brand.flame,
  },
  completedBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  claimButton: {
    marginTop: 12,
    backgroundColor: brand.flame,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
