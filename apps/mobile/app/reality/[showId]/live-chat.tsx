import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { realityApi, chatApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../../src/theme';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  message: string;
  timestamp: string;
  isModerator: boolean;
  isVIP: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
}

export default function LiveChatScreen() {
  const params = useLocalSearchParams();
  const showId = params.showId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [showId]);

  const loadMessages = async () => {
    try {
      const [messagesResponse, viewersResponse] = await Promise.all([
        chatApi.getLiveChatMessages(showId),
        realityApi.getLiveViewerCount(showId),
      ]);

      if (messagesResponse.success && messagesResponse.data) {
        setMessages(messagesResponse.data);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }

      if (viewersResponse.success && viewersResponse.data) {
        setViewerCount(viewersResponse.data.count);
      }
    } catch (error) {
      logger.error('Failed to load chat messages', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await chatApi.sendLiveChatMessage(showId, newMessage.trim());
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      logger.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      <View style={styles.messageHeader}>
        <Text style={styles.username}>{item.displayName}</Text>
        {item.isModerator && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>MOD</Text>
          </View>
        )}
        {item.isVIP && (
          <View style={[styles.badge, styles.badgeVIP]}>
            <Text style={styles.badgeText}>VIP</Text>
          </View>
        )}
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.messageText}>{item.message}</Text>
      {item.reactions && item.reactions.length > 0 && (
        <View style={styles.reactionsContainer}>
          {item.reactions.map((reaction, index) => (
            <View key={index} style={styles.reaction}>
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8420A" />
        <Text style={styles.loadingText}>Loading live chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Chat</Text>
        <View style={styles.viewersBadge}>
          <Text style={styles.viewersText}>👁 {viewerCount.toLocaleString()}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.light[400],
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewersBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewersText: {
    fontSize: 14,
    color: colors.light[400],
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8420A',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeVIP: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 14,
    color: colors.light[200],
    lineHeight: 20,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: colors.light[400],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    backgroundColor: colors.bg.tertiary,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E8420A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
