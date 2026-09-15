import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '@azeebo/react-data/api/client';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { colors } from '../../src/theme';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Premiere {
  id: string;
  title: string;
  genre: string;
  releaseDate: string;
  description: string;
  emoji: string;
  notified: boolean;
}

export default function PremieresScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const premieresQuery = useQuery({
    queryKey: ['movies', 'premieres'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Premiere>>('/v1/movies/premieres');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = premieresQuery.isLoading;
  const error = premieresQuery.error?.message;
  const premieres = premieresQuery.data ?? [];

  const handleNotify = (premiere: Premiere) => {
    setNotifiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(premiere.id)) {
        next.delete(premiere.id);
        Alert.alert('Reminder Removed', `No longer reminded for "${premiere.title}"`);
      } else {
        next.add(premiere.id);
        Alert.alert('Reminder Set', `You'll be notified when "${premiere.title}" releases`);
      }
      return next;
    });
  };

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading premieres..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => premieresQuery.refetch()} />
      </SafeAreaView>
    );
  if (!premieres.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState
          icon="🎬"
          title="No premieres"
          description="Check back for upcoming movie premieres"
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Premieres
        </Text>
      </View>

      <FlatList
        data={premieres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.premiereCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => router.push(`/movies/${item.id}`)}
          >
            <View style={styles.premiereThumb}>
              <Text style={styles.premiereEmoji}>{item.emoji}</Text>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{item.releaseDate}</Text>
              </View>
            </View>
            <View style={styles.premiereInfo}>
              <Text
                style={[styles.premiereTitle, { color: isDark ? '#fff' : '#000' }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.premiereGenre}>{item.genre}</Text>
              <Text style={styles.premiereDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <TouchableOpacity
                style={[styles.notifyButton, notifiedIds.has(item.id) && styles.notifyButtonActive]}
                onPress={() => handleNotify(item)}
              >
                <Text
                  style={[styles.notifyText, notifiedIds.has(item.id) && styles.notifyTextActive]}
                >
                  {notifiedIds.has(item.id) ? '🔔 Notified' : '🔔 Notify Me'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
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
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  premiereCard: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 12 },
  premiereThumb: {
    width: 100,
    height: 140,
    borderRadius: 10,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  premiereEmoji: { fontSize: 40 },
  dateBadge: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: colors.category.highlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dateText: { color: '#000', fontSize: 10, fontWeight: '700' },
  premiereInfo: { flex: 1 },
  premiereTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  premiereGenre: { color: colors.category.highlight, fontSize: 12, marginBottom: 6 },
  premiereDesc: { color: colors.text.secondary, fontSize: 12, marginBottom: 10, lineHeight: 18 },
  notifyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
  },
  notifyButtonActive: { backgroundColor: colors.category.highlight },
  notifyText: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  notifyTextActive: { color: '#000' },
});
