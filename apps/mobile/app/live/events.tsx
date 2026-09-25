import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  universe: string;
  status: 'upcoming' | 'live' | 'ended';
  viewerCount: number;
  scheduledAt: string;
  thumbnail?: string;
}

export default function LiveEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const eventsQuery = useQuery({
    queryKey: ['live', 'events', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await apiClient.get<LiveEvent[]>(`/v1/live/events${params}`);
      return Array.isArray(res) ? res : [];
    },
    staleTime: 30_000,
  });

  const events = eventsQuery.data ?? [];
  const liveEvents = events.filter((e) => e.status === 'live');
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.status === filter);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Live Events</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        {(['all', 'live', 'upcoming'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.tab, filter === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab === 'all'
                ? 'All'
                : tab === 'live'
                  ? `🔴 Live (${liveEvents.length})`
                  : `Upcoming (${upcomingEvents.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {eventsQuery.isLoading ? (
        <LoadingState text="Loading events..." />
      ) : eventsQuery.error ? (
        <ErrorState description={eventsQuery.error.message} onRetry={() => eventsQuery.refetch()} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon="📺"
          title="No events"
          description="No live events right now. Check back soon!"
        />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              onPress={() => router.push(`/live/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                {item.status === 'live' && <View style={styles.liveDot} />}
                <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text
                style={[styles.cardDesc, { color: isDark ? colors.text.secondary : '#666' }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>{item.universe}</Text>
                {item.status === 'live' && (
                  <Text style={styles.metaText}>👁 {item.viewerCount.toLocaleString()}</Text>
                )}
                <Text style={styles.metaText}>
                  {new Date(item.scheduledAt).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
  },
  tabActive: { backgroundColor: colors.primary[500] },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.text.tertiary },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, gap: 12 },
  card: { padding: 16, borderRadius: radius.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 11, color: colors.text.tertiary },
});
