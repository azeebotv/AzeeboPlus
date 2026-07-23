import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi, LifestyleEvent } from '../../src/api/lifestyle';

const CATEGORIES = ['All', 'Concerts', 'Festivals', 'Nightlife', 'Food', 'Sports', 'Arts'];

export default function EventsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const eventsQuery = useQuery({
    queryKey: ['lifestyle', 'events', selectedCategory],
    queryFn: async () => {
      const res = await lifestyleApi.getEvents(selectedCategory);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => lifestyleApi.rsvpEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'events'] });
    },
  });

  const unRsvpMutation = useMutation({
    mutationFn: (eventId: string) => lifestyleApi.unRsvpEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'events'] });
    },
  });

  const events = eventsQuery.data ?? [];
  const isLoading = eventsQuery.isLoading;
  const error = eventsQuery.error?.message;

  const handleRefresh = useCallback(() => {
    eventsQuery.refetch();
  }, [eventsQuery]);

  const handleRsvp = useCallback(
    (event: LifestyleEvent) => {
      if (event.isRsvpd) {
        unRsvpMutation.mutate(event.id);
      } else {
        rsvpMutation.mutate(event.id);
      }
    },
    [rsvpMutation, unRsvpMutation]
  );

  const renderEvent = ({ item }: { item: LifestyleEvent }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.bg.tertiary }]}
      onPress={() => router.push(`/lifestyle/event-detail?id=${item.id}`)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image || 'https://placehold.co/400x200/1a1a1a/ffffff?text=Event' }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      <View style={styles.eventOverlay}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{item.date.split(' ')[0]}</Text>
          <Text style={styles.dateMonth}>{item.date.split(' ')[1]}</Text>
        </View>
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.attendeeBadge}>
            <Text style={styles.attendeeIcon}>👥</Text>
            <Text style={styles.attendeeCount}>{item.attendeeCount}</Text>
          </View>
        </View>
        <View style={styles.eventMeta}>
          <Text style={styles.metaText}>📅 {item.date}</Text>
          <Text style={styles.metaText}>📍 {item.venue}</Text>
        </View>
        <View style={styles.eventFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              item.isRsvpd && styles.rsvpButtonActive,
            ]}
            onPress={() => handleRsvp(item)}
            disabled={rsvpMutation.isPending || unRsvpMutation.isPending}
          >
            <Text style={[styles.rsvpButtonText, item.isRsvpd && styles.rsvpButtonTextActive]}>
              {item.isRsvpd ? '✓ Going' : 'RSVP'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Events</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        {isLoading && <LoadingState text="Loading events..." />}
        {error && <ErrorState description={error} onRetry={handleRefresh} />}
        {!isLoading && !error && events.length === 0 && (
          <EmptyState
            icon="📅"
            title="No events found"
            description="Check back later for new events"
          />
        )}

        {!isLoading && !error && events.length > 0 && (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={eventsQuery.isRefetching} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[500],
  },
  categoryChipText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  dateBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateDay: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  eventInfo: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  attendeeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  attendeeIcon: {
    fontSize: 12,
  },
  attendeeCount: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  eventMeta: {
    gap: 4,
    marginBottom: 12,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: colors.primary[500],
    fontSize: 12,
    fontWeight: '600',
  },
  rsvpButton: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rsvpButtonActive: {
    backgroundColor: colors.success[500],
  },
  rsvpButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  rsvpButtonTextActive: {
    color: colors.text.primary,
  },
});
