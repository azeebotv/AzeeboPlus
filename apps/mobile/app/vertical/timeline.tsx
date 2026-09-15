import { useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { ApiResponse } from '@azeebo/react-data/types/api';
import { analytics } from '../../src/utils/analytics';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  titleSlug: string;
  titleName: string;
  isUpcoming: boolean;
}

type ListResponse<T> = T[] | ApiResponse<T[]>;

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const timelineQuery = useQuery({
    queryKey: ['vertical', 'timeline'],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<TimelineEvent>>('/v1/vertical/timeline');
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (timelineQuery.isSuccess && !timelineQuery.isFetching) {
      analytics.verticalUniverseViewed('timeline');
    }
  }, [timelineQuery.isSuccess, timelineQuery.isFetching]);

  const events = timelineQuery.data ?? [];
  const upcomingEvents = events.filter((e) => e.isUpcoming);
  const pastEvents = events.filter((e) => !e.isUpcoming);

  const sections = [
    ...(upcomingEvents.length > 0 ? [{ title: 'Upcoming', data: upcomingEvents }] : []),
    ...(pastEvents.length > 0 ? [{ title: 'Past Events', data: pastEvents }] : []),
  ];

  if (timelineQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading timeline..." />
      </SafeAreaView>
    );
  }

  if (timelineQuery.error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState
          description={timelineQuery.error.message}
          onRetry={() => timelineQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  if (!events.length) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <EmptyState icon="📅" title="No events" description="Timeline events will appear here" />
      </SafeAreaView>
    );
  }

  const renderEvent = ({
    item,
    index,
    section,
  }: {
    item: TimelineEvent;
    index: number;
    section: { title: string; data: TimelineEvent[] };
  }) => {
    const isLast = index === section.data.length - 1;
    const isUpcoming = section.title === 'Upcoming';

    return (
      <View style={styles.eventRow}>
        <View style={styles.eventMarker}>
          <View style={[styles.eventDot, isUpcoming && styles.eventDotUpcoming]} />
          {!isLast && <View style={styles.eventLine} />}
        </View>
        <TouchableOpacity
          style={[styles.eventCard, isUpcoming && styles.eventCardUpcoming]}
          onPress={() => router.push(`/vertical-title?id=${item.titleSlug}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.eventDate}>{item.date}</Text>
          <Text style={[styles.eventTitle, { color: colors.text.primary }]}>{item.title}</Text>
          <Text
            style={[styles.eventDesc, { color: isDark ? colors.text.secondary : '#666' }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <View style={styles.eventFooter}>
            <Text style={styles.eventSource}>{item.titleName}</Text>
            {isUpcoming && <Text style={styles.upcomingBadge}>Upcoming</Text>}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Timeline</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {section.title}
            </Text>
            {section.title === 'Upcoming' && (
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{section.data.length}</Text>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  list: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: {
    backgroundColor: colors.primary[500],
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  eventRow: { flexDirection: 'row', gap: 16 },
  eventMarker: { alignItems: 'center' },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg.surface,
  },
  eventDotUpcoming: {
    backgroundColor: colors.primary[500],
  },
  eventLine: { width: 2, flex: 1, backgroundColor: colors.bg.surface, marginVertical: 8 },
  eventCard: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  eventCardUpcoming: {
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
  },
  eventDate: { fontSize: 12, color: colors.text.tertiary, marginBottom: 4 },
  eventTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  eventDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventSource: { fontSize: 12, color: colors.text.tertiary },
  upcomingBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary[500],
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
