import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { creatorApi, CreatorProfile } from '@azeebo/react-data/api/creator';
import { colors, spacing, typography, radius } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

const TIP_PRESETS = [200, 500, 1000, 2000, 5000];
const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export default function CreatorProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const id = typeof creatorId === 'string' ? creatorId : '';

  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [tipAmount, setTipAmount] = useState(500);
  const [tipMessage, setTipMessage] = useState('');
  const [sendingTip, setSendingTip] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['creator-profile', id],
    queryFn: () => creatorApi.getCreatorProfile(id),
    enabled: id.length > 0,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['creator-tip-stats', id],
    queryFn: () => creatorApi.getTipStats(id),
    enabled: id.length > 0,
    staleTime: 60_000,
  });

  const profile: CreatorProfile | undefined = profileQuery.data?.data;
  const stats = statsQuery.data?.data;

  const handleSendTip = async () => {
    if (!id || tipAmount < 100) {
      Alert.alert('Invalid amount', 'Minimum tip is ₦100.');
      return;
    }
    setSendingTip(true);
    try {
      const res = await creatorApi.sendTip(id, tipAmount, tipMessage.trim() || undefined);
      if (res.success) {
        setTipModalVisible(false);
        setTipMessage('');
        queryClient.invalidateQueries({ queryKey: ['creator-tip-stats', id] });
        Alert.alert('Thank you! 🎉', `Your ₦${tipAmount.toLocaleString()} tip was sent.`);
      } else {
        Alert.alert(
          'Tip failed',
          (res as { message?: string }).message ?? 'Please try again.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Tip failed',
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSendingTip(false);
    }
  };

  if (!id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <EmptyState icon="🎤" title="Creator not found" description="Invalid creator link" />
      </SafeAreaView>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <LoadingState text="Loading creator..." />
      </SafeAreaView>
    );
  }

  if (profileQuery.error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <ErrorState
          description={profileQuery.error?.message ?? 'Creator not found'}
          onRetry={() => profileQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.hero}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
            <Text style={styles.avatarText}>
              {profile.displayName?.charAt(0).toUpperCase() ?? 'C'}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text.primary }]}>{profile.displayName}</Text>
        <Text style={styles.category}>
          {profile.category}
          {profile.contentType ? ` · ${profile.contentType}` : ''}
        </Text>
        {profile.bio ? (
          <Text style={[styles.bio, { color: colors.text.secondary }]}>{profile.bio}</Text>
        ) : null}
        {profile.status !== 'approved' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>
              {profile.status === 'pending' ? 'Pending approval' : 'Not available'}
            </Text>
          </View>
        )}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {stats.totalTips}
              </Text>
              <Text style={styles.statLabel}>tips</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                ₦{(stats.totalAmount ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>received</Text>
            </View>
            <View style={styles.stat}>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      TIER_COLORS[stats.topTier ?? ''] ?? colors.text.secondary,
                  },
                ]}
              >
                {stats.topTier ? stats.topTier.toUpperCase() : '—'}
              </Text>
              <Text style={styles.statLabel}>top tier</Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.tipButton}
          onPress={() => setTipModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Send a tip to ${profile.displayName}`}
        >
          <Text style={styles.tipButtonText}>💛 Send a Tip</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={tipModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTipModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.bg.secondary }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Send a Tip to {profile.displayName}
            </Text>
            <View style={styles.presetRow}>
              {TIP_PRESETS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.presetChip, tipAmount === amount && styles.presetChipActive]}
                  onPress={() => setTipAmount(amount)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      tipAmount === amount && styles.presetChipTextActive,
                    ]}
                  >
                    ₦{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                styles.customAmount,
                { backgroundColor: colors.bg.tertiary, color: colors.text.primary },
              ]}
              value={tipAmount ? `₦${tipAmount.toLocaleString()}` : ''}
              onChangeText={(text) => setTipAmount(Number(text.replace(/[^0-9]/g, '')) || 0)}
              keyboardType="number-pad"
              placeholder="Custom amount"
              placeholderTextColor={colors.text.tertiary}
              accessibilityLabel="Custom tip amount"
            />
            <TextInput
              style={[
                styles.messageInput,
                { backgroundColor: colors.bg.tertiary, color: colors.text.primary },
              ]}
              value={tipMessage}
              onChangeText={setTipMessage}
              placeholder="Add a message (optional)"
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={200}
              accessibilityLabel="Tip message"
            />
            <TouchableOpacity
              style={[styles.sendButton, sendingTip && styles.disabledButton]}
              onPress={handleSendTip}
              disabled={sendingTip}
            >
              {sendingTip ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.sendButtonText}>Send ₦{tipAmount.toLocaleString()} tip</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTipModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.primary[500] },
  avatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: spacing.md },
  name: { fontSize: 22, fontWeight: '800', marginBottom: 2, color: colors.text.primary },
  category: { fontSize: 13, color: colors.primary[500], fontWeight: '600', marginBottom: 8 },
  bio: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  pendingBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 8,
  },
  pendingText: { fontSize: 11, color: colors.text.tertiary },
  statsRow: { flexDirection: 'row', gap: 32, marginVertical: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.text.tertiary },
  tipButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  tipButtonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.tertiary,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.tertiary,
  },
  presetChipActive: { backgroundColor: colors.primary[500] },
  presetChipText: { color: colors.text.secondary, fontWeight: '600' },
  presetChipTextActive: { color: '#000', fontWeight: '700' },
  customAmount: {
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  messageInput: {
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  cancelText: { textAlign: 'center', color: colors.text.tertiary, padding: 8 },
});
