import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface FanContest {
  id: string;
  title: string;
  description: string;
  prizePool: string;
  entryFee: string;
  participants: number;
  deadline: string;
  status: 'upcoming' | 'active' | 'completed';
  emoji: string;
}

export default function FanContestsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedContest, setSelectedContest] = useState<FanContest | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const contestsQuery = useQuery({
    queryKey: ['sports', 'fan-contests'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<FanContest>>('/v1/sports/fan-contests');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 30_000,
  });

  const isLoading = contestsQuery.isLoading;
  const error = contestsQuery.error?.message;
  const contests = contestsQuery.data ?? [];

  const handleEntry = (contest: FanContest) => {
    setSelectedContest(contest);
    setShowConfirmModal(true);
  };

  const confirmEntry = () => {
    setShowConfirmModal(false);
    Alert.alert('Success', `You've entered ${selectedContest?.title}!`);
    setSelectedContest(null);
  };

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading contests..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => contestsQuery.refetch()} />
      </SafeAreaView>
    );
  if (!contests.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🏆" title="No contests" description="Check back later for fan contests" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Fan Contests
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {contests.map((contest) => (
          <View
            key={contest.id}
            style={[styles.contestCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <View style={styles.contestEmoji}>
              <Text style={styles.emojiLarge}>{contest.emoji}</Text>
            </View>
            <View style={styles.contestInfo}>
              <Text style={[styles.contestTitle, { color: isDark ? '#fff' : '#000' }]}>
                {contest.title}
              </Text>
              <Text style={styles.contestDesc} numberOfLines={2}>
                {contest.description}
              </Text>
              <View style={styles.contestMeta}>
                <Text style={styles.metaText}>🏆 {contest.prizePool}</Text>
                <Text style={styles.metaText}>👥 {contest.participants}</Text>
              </View>
              <View style={styles.contestFooter}>
                <Text style={styles.entryFee}>Entry: {contest.entryFee}</Text>
                <Text style={styles.deadline}>Ends: {contest.deadline}</Text>
              </View>
            </View>
            {contest.status === 'active' && (
              <TouchableOpacity style={styles.entryButton} onPress={() => handleEntry(contest)}>
                <Text style={styles.entryButtonText}>Enter</Text>
              </TouchableOpacity>
            )}
            {contest.status === 'completed' && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Done</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              Confirm Entry
            </Text>
            <Text style={styles.modalText}>Enter "{selectedContest?.title}"?</Text>
            <Text style={styles.modalFee}>Entry Fee: {selectedContest?.entryFee}</Text>
            <Text style={styles.modalPrize}>Prize Pool: {selectedContest?.prizePool}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmEntry}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  contestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contestEmoji: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emojiLarge: { fontSize: 30 },
  contestInfo: { flex: 1 },
  contestTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  contestDesc: { color: '#888', fontSize: 12, marginBottom: 8 },
  contestMeta: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  metaText: { color: '#888', fontSize: 12 },
  contestFooter: { flexDirection: 'row', gap: 12 },
  entryFee: { color: '#E74C3C', fontSize: 12, fontWeight: '600' },
  deadline: { color: '#888', fontSize: 12 },
  entryButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  entryButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
  },
  completedText: { color: '#888', fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '85%', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  modalText: { color: '#ccc', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  modalFee: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalPrize: { color: '#10B981', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  cancelText: { color: '#888', fontSize: 14, fontWeight: '600' },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
