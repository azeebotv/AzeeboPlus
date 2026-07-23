import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface Highlight {
  id: string;
  title: string;
  match: string;
  duration: string;
  thumbnail: string;
  views: string;
  emoji: string;
}

export default function HighlightsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const highlightsQuery = useQuery({
    queryKey: ['sports', 'highlights'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<Highlight>>('/v1/sports/highlights');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const isLoading = highlightsQuery.isLoading;
  const error = highlightsQuery.error?.message;
  const highlights = highlightsQuery.data ?? [];

  const handlePlay = (item: Highlight) => {
    Alert.alert('Playing', `Now playing: ${item.title}`);
  };

  if (isLoading) return <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}><LoadingState text="Loading highlights..." /></SafeAreaView>;
  if (error) return <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}><ErrorState description={error} onRetry={() => highlightsQuery.refetch()} /></SafeAreaView>;
  if (!highlights.length) return <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}><EmptyState icon="🎬" title="No highlights" description="Highlights will appear after matches" /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>Highlights</Text>
      </View>

      <FlatList
        data={highlights}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.highlightCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            onPress={() => handlePlay(item)}
          >
            <View style={styles.thumbnail}>
              <Text style={styles.thumbEmoji}>{item.emoji}</Text>
              <View style={styles.playOverlay}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>
            <View style={styles.highlightInfo}>
              <Text style={[styles.highlightTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.highlightMatch}>{item.match}</Text>
              <Text style={styles.highlightViews}>👁️ {item.views} views</Text>
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
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  highlightCard: { borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  thumbnail: { height: 200, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  thumbEmoji: { fontSize: 60 },
  playOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#fff', fontSize: 40 },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  highlightInfo: { padding: 14 },
  highlightTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  highlightMatch: { color: '#E74C3C', fontSize: 13, marginBottom: 4 },
  highlightViews: { color: '#888', fontSize: 12 },
});
