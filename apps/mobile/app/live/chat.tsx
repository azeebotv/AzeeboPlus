import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { useAuth } from '@azeebo/react-data/contexts/AuthContext';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { pollingIntervals } from '@azeebo/design-tokens';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export default function LiveChatScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['live', eventId, 'chat'],
    queryFn: async () => {
      const res = await apiClient.get<ChatMessage[]>(`/v1/messaging/watch-parties/${eventId}/chat`);
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: pollingIntervals.mobileChat,
    enabled: !!eventId,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/v1/messaging/watch-parties/${eventId}/chat`, { content });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['live', eventId, 'chat'] });
    },
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Live Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {messagesQuery.isLoading ? (
        <LoadingState text="Loading chat..." />
      ) : messagesQuery.error ? (
        <ErrorState
          description={messagesQuery.error.message}
          onRetry={() => messagesQuery.refetch()}
        />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) =>
              item.isSystem ? (
                <View style={styles.systemMessage}>
                  <Text style={styles.systemText}>{item.content}</Text>
                </View>
              ) : (
                <View style={[styles.messageBubble, item.userId === user?.id && styles.ownMessage]}>
                  {item.userId !== user?.id && <Text style={styles.userName}>{item.userName}</Text>}
                  <Text
                    style={[styles.messageText, item.userId === user?.id && styles.ownMessageText]}
                  >
                    {item.content}
                  </Text>
                  <Text style={styles.timestamp}>
                    {new Date(item.timestamp).toLocaleTimeString('en-NG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )
            }
          />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.inputBar, { borderTopColor: '#2A1A1A' }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? colors.bg.tertiary : '#f0f0f0',
                    color: colors.text.primary,
                  },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={colors.text.tertiary}
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={() => {
                  if (message.trim()) sendMutation.mutate(message.trim());
                }}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendButton, { opacity: message.trim() ? 1 : 0.5 }]}
                onPress={() => {
                  if (message.trim()) sendMutation.mutate(message.trim());
                }}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Text style={styles.sendText}>↑</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  messageList: { padding: 16, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.bg.tertiary,
    alignSelf: 'flex-start',
  },
  ownMessage: { backgroundColor: colors.primary[500], alignSelf: 'flex-end' },
  userName: { fontSize: 11, fontWeight: '600', color: colors.primary[500], marginBottom: 2 },
  messageText: { fontSize: 14, color: colors.text.primary },
  ownMessageText: { color: '#fff' },
  timestamp: { fontSize: 10, color: colors.text.tertiary, marginTop: 4, textAlign: 'right' },
  systemMessage: { alignItems: 'center', paddingVertical: 8 },
  systemText: { fontSize: 12, color: colors.text.tertiary, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, padding: 12, borderRadius: 20, fontSize: 14 },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
