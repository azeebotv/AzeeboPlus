import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableButton, FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

interface FixtureMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  date: string;
  venue: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}

export default function TVSportsScreen() {
  const router = useRouter();
  const [sportsVideos, setSportsVideos] = useState<ContentItem[]>([]);
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSportsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [videosRes, fixturesRes] = await Promise.allSettled([
        contentApi.getContentByCategory('sports', 1, 20),
        apiClient.get<FixtureMatch[]>('/api/sports/fixtures'),
      ]);

      if (videosRes.status === 'fulfilled' && videosRes.value.success && videosRes.value.data) {
        setSportsVideos(videosRes.value.data.items ?? []);
      }
      if (fixturesRes.status === 'fulfilled' && Array.isArray(fixturesRes.value)) {
        setFixtures(fixturesRes.value);
      }
    } catch {
      setError('Failed to load Sports content');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSportsData();
  }, [loadSportsData]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || 'Sports Pulse',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && sportsVideos.length === 0) {
    return <LoadingState text="Loading Sports Pulse..." />;
  }

  if (error && sportsVideos.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadSportsData()} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <FocusableButton
          title="← Back to Home"
          variant="secondary"
          onPress={() => router.push('/' as Href)}
          hasTVPreferredFocus
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚽ MATCHDAY CENTRAL</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Sports Universe</Text>
        <Text style={styles.subtitle}>
          Live football matches, NPFL showdowns, highlights, tactical analyses, and locker room
          access.
        </Text>
      </View>

      {/* Live / Upcoming Match Fixtures */}
      {fixtures.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Fixtures</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fixturesList}>
            {fixtures.slice(0, 6).map((match) => (
              <View key={match.id} style={styles.fixtureCard}>
                <View style={styles.fixtureHeader}>
                  <Text style={styles.fixtureLeague}>{match.league}</Text>
                  <Text style={styles.fixtureTime}>{match.time}</Text>
                </View>
                <View style={styles.teamsRow}>
                  <Text style={styles.teamText} numberOfLines={1}>
                    {match.homeTeam}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamText} numberOfLines={1}>
                    {match.awayTeam}
                  </Text>
                </View>
                <Text style={styles.fixtureVenue} numberOfLines={1}>
                  📍 {match.venue}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <FocusableRow
          title="Match Highlights & Analysis"
          items={toRailItems(sportsVideos)}
          onSelect={handleSelect}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    padding: tvSpacing.xxl,
    paddingBottom: tvSpacing.section,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tvSpacing.xl,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgeText: {
    color: '#10B981',
    fontSize: tvTypography.fontSize.base,
    fontWeight: '800',
  },
  heroSection: {
    marginBottom: tvSpacing.xl,
  },
  title: {
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: tvSpacing.sm,
  },
  subtitle: {
    fontSize: tvTypography.fontSize.xl,
    color: colors.text.secondary,
    maxWidth: 900,
  },
  section: {
    marginBottom: tvSpacing.xl,
  },
  sectionTitle: {
    fontSize: tvTypography.fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: tvSpacing.md,
  },
  fixturesList: {
    flexDirection: 'row',
  },
  fixtureCard: {
    width: 260,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    padding: tvSpacing.md,
    marginRight: tvSpacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fixtureLeague: {
    color: colors.primary[500],
    fontSize: 12,
    fontWeight: '700',
  },
  fixtureTime: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  teamsRow: {
    marginVertical: 8,
  },
  teamText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  vsText: {
    color: colors.text.secondary,
    fontSize: 11,
    marginVertical: 2,
  },
  fixtureVenue: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 4,
  },
});
