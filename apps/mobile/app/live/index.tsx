import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface LiveEventItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledAt: string;
  duration: number;
  status: string;
  ticketPrice: number;
  currency: string;
  maxViewers: number;
  currentViewers: number;
  _count: { tickets: number };
}

export default function LiveEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [filter, setFilter] = useState('upcoming');

  const eventsQuery = useQuery({
    queryKey: ['live-events', filter],
    queryFn: async () => {
      const statusParam = filter === 'all' ? '' : `?status=${filter}`;
      const res = await apiClient.get<{
        items: LiveEventItem[];
        total: number;
      }>(`/api/v1/live-events${statusParam}`);
      const data = res as unknown as {
        items?: LiveEventItem[];
        success?: boolean;
        data?: { items: LiveEventItem[] };
      };
      if (data.items) return data.items;
      if (data.data?.items) return data.data.items;
      return [];
    },
    staleTime: 15000,
  });

  const events = eventsQuery.data ?? [];
  const isLoading = eventsQuery.isLoading;
  const error = eventsQuery.error?.message;

  const getTimeRemaining = (scheduledAt: string): string => {
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return 'Now Live';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Free';
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  const filters = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'live', label: 'Live' },
    { key: 'ended', label: 'Ended' },
    { key: 'all', label: 'All' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#fff' }]}>
        <LoadingState text="Loading events..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#fff' }]}>
        <ErrorState description={error} onRetry={() => eventsQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const bgColor = isDark ? '#1A0A0A' : '#fff';
  const textColor = isDark ? '#fff' : '#1A0A0A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Live Events</Text>
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {events.length === 0 ? (
        <EmptyState icon="🎥" title="No events" description="Check back for upcoming live events" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.eventCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              onPress={() => router.push(`/live/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.thumbnailPlaceholder}>
                  <Text style={styles.thumbEmoji}>🎬</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.eventTitle, { color: textColor }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.eventStatus}>
                    {item.status === 'live'
                      ? '🔴 LIVE'
                      : item.status === 'scheduled'
                        ? `📅 ${getTimeRemaining(item.scheduledAt)}`
                        : item.status}
                  </Text>
                </View>
                <Text style={[styles.eventPrice, { color: '#E8420A' }]}>
                  {formatPrice(item.ticketPrice, item.currency)}
                </Text>
              </View>
              <Text style={styles.eventDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>{item.duration} min</Text>
                {item.maxViewers && (
                  <Text style={styles.footerText}>
                    {item._count.tickets}/{item.maxViewers} sold
                  </Text>
                )}
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
  header: { padding: 16, paddingTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  filterChipActive: { backgroundColor: '#E8420A' },
  filterText: { color: colors.text.secondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  eventCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  thumbEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  eventStatus: { fontSize: 11, color: '#E8420A', fontWeight: '600' },
  eventPrice: { fontSize: 15, fontWeight: '700' },
  eventDesc: { fontSize: 12, color: colors.text.secondary, marginBottom: 8, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 16 },
  footerText: { fontSize: 11, color: colors.text.tertiary },
});
