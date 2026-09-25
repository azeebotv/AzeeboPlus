import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { apiClient } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked?: boolean;
  progress?: number;
  target?: number;
  earnedAt?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BADGE_SIZE = (SCREEN_WIDTH - 16 * 2 - 12 * 3) / 4;

export default function BadgesScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get<Badge[] | { badges: Badge[] }>('/rewards/badges');
      const data = Array.isArray(res) ? res : (res as { badges: Badge[] }).badges || [];
      setBadges(
        data.map((b: Badge) => ({
          id: String(b.id),
          name: String(b.name || ''),
          description: String(b.description || ''),
          icon: String(b.icon || '🏅'),
          points: Number(b.points || 0),
          unlocked: Boolean(b.unlocked ?? true),
          progress: Number(b.progress ?? 0),
          target: Number(b.target ?? b.points ?? 1),
          earnedAt: b.earnedAt,
        }))
      );
    } catch (error) {
      logger.error('Failed to load badges', error);
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

  const earnedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E8420A" />
        <Text style={styles.loadingText}>Loading badges...</Text>
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
          <Text style={styles.title}>Badges</Text>
          <Text style={styles.subtitle}>
            {earnedBadges.length} of {badges.length} earned
          </Text>
        </View>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earned ({earnedBadges.length})</Text>
            <View style={styles.badgeGrid}>
              {earnedBadges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={styles.badgeItem}
                  onPress={() => setSelectedBadge(badge)}
                >
                  <View style={styles.badgeIconEarned}>
                    <Text style={styles.badgeIconText}>{badge.icon}</Text>
                  </View>
                  <Text style={styles.badgeName} numberOfLines={2}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeEarnedLabel}>✓ Earned</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locked ({lockedBadges.length})</Text>
            <View style={styles.badgeGrid}>
              {lockedBadges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={[styles.badgeItem, styles.badgeItemLocked]}
                  onPress={() => setSelectedBadge(badge)}
                >
                  <View style={styles.badgeIconLocked}>
                    <Text style={[styles.badgeIconText, styles.badgeIconTextLocked]}>
                      {badge.icon}
                    </Text>
                  </View>
                  <Text style={[styles.badgeName, styles.badgeNameLocked]} numberOfLines={2}>
                    {badge.name}
                  </Text>
                  <View style={styles.miniProgressTrack}>
                    <View
                      style={[
                        styles.miniProgressFill,
                        {
                          width: `${Math.min(((badge.progress ?? 0) / (badge.target ?? 1)) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.badgeProgressText}>
                    {badge.progress ?? 0}/{badge.target ?? 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {badges.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏅</Text>
            <Text style={styles.emptyText}>No badges available yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Badge detail modal */}
      <Modal visible={!!selectedBadge} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalIcon,
                selectedBadge?.unlocked ? styles.modalIconEarned : styles.modalIconLocked,
              ]}
            >
              <Text style={styles.modalIconText}>{selectedBadge?.icon}</Text>
            </View>
            <Text style={styles.modalTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.modalDescription}>{selectedBadge?.description}</Text>
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatLabel}>Points</Text>
                <Text style={styles.modalStatValue}>{selectedBadge?.points}</Text>
              </View>
              {selectedBadge?.unlocked && selectedBadge?.earnedAt && (
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatLabel}>Earned</Text>
                  <Text style={[styles.modalStatValue, { color: '#10B981' }]}>
                    {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedBadge(null)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    width: BADGE_SIZE,
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 12,
  },
  badgeItemLocked: { opacity: 0.5 },
  badgeIconEarned: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232,66,10,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIconLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIconText: { fontSize: 24 },
  badgeIconTextLocked: { opacity: 0.5 },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: { color: '#6B7280' },
  badgeEarnedLabel: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  miniProgressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 4,
    marginBottom: 2,
    overflow: 'hidden',
  },
  miniProgressFill: { height: '100%', borderRadius: 1.5, backgroundColor: '#E8420A' },
  badgeProgressText: { fontSize: 9, color: '#6B7280' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.light[400] },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalIconEarned: { backgroundColor: 'rgba(232,66,10,0.25)' },
  modalIconLocked: { backgroundColor: 'rgba(255,255,255,0.05)' },
  modalIconText: { fontSize: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  modalDescription: {
    fontSize: 14,
    color: colors.light[400],
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStats: { flexDirection: 'row', gap: 32, marginBottom: 20 },
  modalStat: { alignItems: 'center' },
  modalStatLabel: { fontSize: 12, color: colors.light[400], marginBottom: 4 },
  modalStatValue: { fontSize: 18, fontWeight: '700', color: '#E8420A' },
  modalCloseButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A1A1A',
  },
  modalCloseText: { color: '#9A8A7A', fontWeight: '600', fontSize: 14 },
});
