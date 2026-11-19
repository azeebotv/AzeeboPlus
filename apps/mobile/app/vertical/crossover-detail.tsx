import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface CrossoverDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  episodes: number;
  involvedTitles: { id: string; title: string; emoji: string; synopsis: string }[];
  timeline: { id: string; episode: string; title: string; year: string; description: string }[];
  recapSummary: string;
}

export default function CrossoverDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState<CrossoverDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No crossover ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<CrossoverDetail>(`/v1/vertical/crossovers/${id}`);
      setData(res);
      analytics.verticalTitleViewed(res.id);
    } catch {
      setError('Failed to load crossover');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading crossover..." />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState description={error || 'Crossover not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {data.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🎬</Text>
          <View style={styles.heroBadges}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{data.status}</Text>
            </View>
            <View style={styles.episodeBadge}>
              <Text style={styles.episodeText}>{data.episodes} Episodes</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
          <Text style={[styles.bodyText, { color: isDark ? colors.text.secondary : '#666' }]}>
            {data.description}
          </Text>
        </View>

        {data.recapSummary && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recap</Text>
            <View
              style={[
                styles.recapCard,
                { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
              ]}
            >
              <Text style={[styles.recapText, { color: isDark ? colors.text.secondary : '#666' }]}>
                {data.recapSummary}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Involved Titles</Text>
          {data.involvedTitles.map((title) => (
            <TouchableOpacity
              key={title.id}
              style={[
                styles.titleCard,
                { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
              ]}
              onPress={() => router.push(`/vertical-title?id=${title.id}`)}
            >
              <View style={styles.titleCardHeader}>
                <Text style={styles.titleEmoji}>{title.emoji}</Text>
                <Text style={[styles.titleCardTitle, { color: colors.text.primary }]}>
                  {title.title}
                </Text>
              </View>
              <Text
                style={[styles.titleSynopsis, { color: isDark ? colors.text.secondary : '#666' }]}
                numberOfLines={2}
              >
                {title.synopsis}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {data.timeline.length > 0 && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Timeline</Text>
            {data.timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineMarker}>
                  <View style={styles.timelineDot} />
                  {index < data.timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineEpisode}>{event.episode}</Text>
                    <Text style={styles.timelineYear}>{event.year}</Text>
                  </View>
                  <Text style={[styles.timelineTitle, { color: colors.text.primary }]}>
                    {event.title}
                  </Text>
                  <Text
                    style={[
                      styles.timelineDesc,
                      { color: isDark ? colors.text.secondary : '#666' },
                    ]}
                  >
                    {event.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.bg.tertiary,
  },
  heroEmoji: { fontSize: 80, marginBottom: 16 },
  heroBadges: { flexDirection: 'row', gap: 10 },
  statusBadge: {
    backgroundColor: colors.primary[500] + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.primary[500] },
  episodeBadge: {
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  episodeText: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  bodyText: { fontSize: 15, lineHeight: 24 },
  recapCard: { borderRadius: 12, padding: 16 },
  recapText: { fontSize: 14, lineHeight: 22 },
  titleCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  titleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  titleEmoji: { fontSize: 24 },
  titleCardTitle: { fontSize: 16, fontWeight: '700' },
  titleSynopsis: { fontSize: 13, lineHeight: 20 },
  timelineItem: { flexDirection: 'row', gap: 16 },
  timelineMarker: { alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary[500] },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.bg.surface, marginVertical: 8 },
  timelineContent: { flex: 1, paddingBottom: 24 },
  timelineHeader: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  timelineEpisode: { fontSize: 12, color: colors.primary[500], fontWeight: '600' },
  timelineYear: { fontSize: 12, color: colors.text.tertiary },
  timelineTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  timelineDesc: { fontSize: 13 },
});
