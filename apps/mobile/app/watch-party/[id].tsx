import { useState, useEffect, useRef } from 'react';
import { logger } from '@azeebo/react-data/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { apiClient } from '@azeebo/react-data';
import { colors, typography, spacing, radius } from '../../src/theme';
import { GlassCard, BrandButton } from '../../src/components/ui';
import { PageTransition } from '../../src/components/motion';

interface PartyParticipant {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: 'host' | 'co-host' | 'member';
  isOnline: boolean;
}

interface PartyChat {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: 'message' | 'system';
  createdAt: string;
}

interface WatchParty {
  id: string;
  contentId: string;
  contentTitle: string;
  hostId: string;
  inviteCode: string;
  status: 'active' | 'paused' | 'ended';
  isPlaying: boolean;
  currentTime: number;
  participants: PartyParticipant[];
  chat: PartyChat[];
}

export default function WatchPartyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [party, setParty] = useState<WatchParty | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef<FlatList>(null);

  useEffect(() => {
    loadParty();
    const interval = setInterval(loadParty, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, [id]);

  const loadParty = async () => {
    try {
      const response = await apiClient.get<{ data?: WatchParty }>(`/v1/watch-parties/${id}`);
      setParty(response.data || null);
    } catch (error) {
      logger.error('Failed to load party:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      setSending(true);
      await apiClient.post(`/v1/watch-parties/${id}/chat`, {
        message: chatMessage.trim(),
      });
      setChatMessage('');
      loadParty();
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTogglePlayback = async () => {
    if (!party) return;

    try {
      await apiClient.post(`/v1/watch-parties/${id}/playback`, {
        isPlaying: !party.isPlaying,
        currentTime: party.currentTime,
      });
      loadParty();
    } catch {
      Alert.alert('Error', 'Failed to update playback');
    }
  };

  const handleSyncAll = async () => {
    try {
      await apiClient.post(`/v1/watch-parties/${id}/sync`);
      Alert.alert('Success', 'All participants synced');
    } catch {
      Alert.alert('Error', 'Failed to sync');
    }
  };

  const handleShareInvite = async () => {
    if (!party) return;

    try {
      await Share.share({
        message: `Join my watch party for ${party.contentTitle}!\n\nInvite code: ${party.inviteCode}\n\nOr click: https://azeebo.com/watch-party/join?code=${party.inviteCode}`,
      });
    } catch (error) {
      logger.error('Failed to share:', error);
    }
  };

  const handleLeaveParty = async () => {
    Alert.alert('Leave Party', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post(`/v1/watch-parties/${id}/leave`);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to leave party');
          }
        },
      },
    ]);
  };

  const handleEndParty = async () => {
    Alert.alert('End Party', 'End the watch party for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/v1/watch-parties/${id}`);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to end party');
          }
        },
      },
    ]);
  };

  const isHost = party?.hostId === user?.id;

  if (loading) {
    return (
      <View accessibilityLabel="Screen Screen" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Watch party not found</Text>
        <BrandButton title="Go Back" onPress={() => router.back()} variant="primary" />
      </View>
    );
  }

  return (
    <PageTransition>
      <View style={styles.container}>
        {/* Party Header */}
        <GlassCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.partyTitle}>{party.contentTitle}</Text>
              <Text style={styles.partyStatus}>
                {party.status === 'active'
                  ? '🔴 Live'
                  : party.status === 'paused'
                    ? '⏸ Paused'
                    : ' Ended'}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.inviteCode} onPress={handleShareInvite}>
              <Text style={styles.inviteCodeLabel}>Invite Code</Text>
              <Text style={styles.inviteCodeValue}>{party.inviteCode}</Text>
            </TouchableOpacity>
          </View>

          {/* Playback Controls (Host Only) */}
          {isHost && (
            <View style={styles.controlsRow}>
              <BrandButton
                title={party.isPlaying ? '⏸ Pause' : '▶ Play'}
                onPress={handleTogglePlayback}
                variant="primary"
              />
              <BrandButton title="🔄 Sync All" onPress={handleSyncAll} variant="secondary" />
              <BrandButton title="End Party" onPress={handleEndParty} variant="secondary" />
            </View>
          )}
        </GlassCard>

        {/* Participants */}
        <GlassCard style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>Participants ({party.participants.length})</Text>
          <FlatList
            data={party.participants}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <View style={[styles.participantAvatar, !item.isOnline && styles.offline]}>
                  <Text style={styles.participantInitial}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.participantName} numberOfLines={1}>
                  {item.username}
                </Text>
                {item.role === 'host' && <Text style={styles.hostBadge}>👑</Text>}
              </View>
            )}
          />
        </GlassCard>

        {/* Chat */}
        <View style={styles.chatContainer}>
          <Text style={styles.sectionTitle}>Party Chat</Text>
          <FlatList
            ref={chatRef}
            style={styles.chatList}
            data={party.chat}
            keyExtractor={(item) => item.id}
            onContentSizeChange={() => chatRef.current?.scrollToEnd()}
            renderItem={({ item }) => (
              <View style={[styles.chatMessage, item.type === 'system' && styles.systemMessage]}>
                {item.type === 'system' ? (
                  <Text style={styles.systemMessageText}>{item.message}</Text>
                ) : (
                  <>
                    <Text style={styles.chatUsername}>{item.username}</Text>
                    <Text style={styles.chatText}>{item.message}</Text>
                  </>
                )}
              </View>
            )}
          />

          {/* Chat Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholderTextColor={colors.text.tertiary}
            />
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={sending || !chatMessage.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Leave Button */}
        <View style={styles.footer}>
          <BrandButton title="Leave Party" onPress={handleLeaveParty} variant="ghost" />
        </View>
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
  headerCard: {
    margin: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  partyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  partyStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  inviteCode: {
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  inviteCodeValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary[500],
    letterSpacing: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  participantsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  participantItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 60,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offline: {
    opacity: 0.5,
  },
  participantInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  participantName: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hostBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  chatList: {
    flex: 1,
    marginBottom: spacing.md,
  },
  chatMessage: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
  },
  systemMessage: {
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  systemMessageText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  chatUsername: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary[500],
    marginBottom: 2,
  },
  chatText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  footer: {
    padding: spacing.lg,
  },
});
