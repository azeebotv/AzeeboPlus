import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { creatorApi } from '@azeebo/react-data/api/creator';
import { colors } from '../theme';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

const TIER_COLORS: Record<string, string> = {
  bronze: colors.accent.bronze,
  silver: colors.accent.silver,
  gold: colors.accent.gold,
  platinum: '#E5E4E2',
};

interface TippingModalProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
}

export default function TippingModal({
  visible,
  onClose,
  creatorId,
  creatorName,
}: TippingModalProps) {
  const [amount, setAmount] = useState(500);
  const [useCustom, setUseCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');

  const statsQuery = useQuery({
    queryKey: ['tip-stats', creatorId],
    queryFn: () => creatorApi.getTipStats(creatorId),
    enabled: visible,
  });

  const tipMutation = useMutation({
    mutationFn: async () => {
      const finalAmount = useCustom ? Number(customAmount) : amount;
      if (finalAmount < 50) throw new Error('Minimum tip is ₦50');
      return creatorApi.sendTip(creatorId, finalAmount, message || undefined);
    },
    onSuccess: (data) => {
      if (data.data?.tier) {
        Alert.alert('Tip Sent!', `You unlocked the ${data.data.tier} tier!`, [
          { text: 'Awesome!' },
        ]);
      } else {
        Alert.alert('Tip Sent!', 'Your support means a lot.', [{ text: 'OK' }]);
      }
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Tip Failed', error.message || 'Could not send tip');
    },
  });

  const selectedAmount = useCustom ? Number(customAmount) : amount;
  const topTier = statsQuery.data?.data?.topTier;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Support {creatorName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {topTier && (
            <View style={styles.tierRow}>
              {Object.entries(TIER_COLORS).map(([key, color]) => {
                const keys = Object.keys(TIER_COLORS);
                const tierIndex = keys.indexOf(key);
                const topIndex = keys.indexOf(topTier);
                const unlocked = tierIndex <= topIndex;
                return (
                  <View
                    key={key}
                    style={[
                      styles.tierBadge,
                      {
                        backgroundColor: unlocked ? `${color}20` : colors.bg.secondary,
                        opacity: unlocked ? 1 : 0.4,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.tierText, { color: unlocked ? color : colors.text.tertiary }]}
                    >
                      {unlocked ? '✓ ' : ''}
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Select Amount</Text>
          <View style={styles.amountRow}>
            {PRESET_AMOUNTS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.amountButton,
                  !useCustom && amount === preset && styles.amountButtonActive,
                ]}
                onPress={() => {
                  setAmount(preset);
                  setUseCustom(false);
                }}
              >
                <Text
                  style={[
                    styles.amountText,
                    !useCustom && amount === preset && styles.amountTextActive,
                  ]}
                >
                  ₦{preset.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.amountButton, useCustom && styles.amountButtonActive]}
              onPress={() => setUseCustom(true)}
            >
              <Text style={[styles.amountText, useCustom && styles.amountTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {useCustom && (
            <TextInput
              style={styles.input}
              placeholder="Enter amount (min ₦50)"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Add a message (optional)"
            placeholderTextColor="#666"
            value={message}
            onChangeText={setMessage}
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (tipMutation.isPending || selectedAmount < 50) && styles.sendButtonDisabled,
            ]}
            onPress={() => tipMutation.mutate()}
            disabled={tipMutation.isPending || selectedAmount < 50}
          >
            {tipMutation.isPending ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.sendButtonText}>Send ₦{selectedAmount.toLocaleString()}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.tierLegend}>
            <Text style={styles.legendTitle}>Tier Badges</Text>
            <View style={styles.legendItem}>
              <Text style={[styles.legendBullet, { color: colors.accent.bronze }]}>●</Text>
              <Text style={styles.legendText}>Bronze — ₦1,000+</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendBullet, { color: colors.accent.silver }]}>●</Text>
              <Text style={styles.legendText}>Silver — ₦10,000+</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendBullet, { color: colors.accent.gold }]}>●</Text>
              <Text style={styles.legendText}>Gold — ₦50,000+</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={[styles.legendBullet, { color: colors.accent.gold }]}>●</Text>
              <Text style={styles.legendText}>Platinum — ₦100,000+</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700' },
  closeButton: { color: colors.text.secondary, fontSize: 20, padding: 4 },
  tierRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  amountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.bg.surface,
  },
  amountButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(232,66,10,0.15)',
  },
  amountText: { color: '#F5F0EB', fontSize: 13, fontWeight: '600' },
  amountTextActive: { color: '#E8420A' },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#E8420A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonDisabled: { backgroundColor: colors.bg.surface },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tierLegend: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
  },
  legendTitle: { color: '#9A8A7A', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  legendBullet: { fontSize: 10 },
  legendText: { color: colors.text.tertiary, fontSize: 12 },
});
