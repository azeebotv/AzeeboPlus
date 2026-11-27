import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import {
  FocusableButton,
  FocusableCard,
  FocusableRow,
  type RailItem,
} from '../src/components/Focusable';
import { QRCodeView } from '../src/components/QRCodeView';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

interface Contestant {
  id: string;
  name: string;
  votes: number;
  avatar?: string;
  status?: string;
}

export default function TVRealityScreen() {
  const router = useRouter();
  const [realityShows, setRealityShows] = useState<ContentItem[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  const handleFastVote = async (contestant: Contestant) => {
    try {
      setVoteFeedback(`Casting 50 votes for ${contestant.name}...`);
      await apiClient
        .post('/v1/reality/shows/survivor-nigeria-s1/vote', {
          contestantId: contestant.id,
          votes: 50,
        })
        .catch(() => null);

      setContestants((prev) =>
        prev.map((c) => (c.id === contestant.id ? { ...c, votes: c.votes + 50 } : c))
      );
      setVoteFeedback(`✓ 50 Votes cast for ${contestant.name}!`);
      setTimeout(() => setVoteFeedback(null), 3500);
    } catch {
      setVoteFeedback('Vote failed. Check Coin balance.');
    }
  };

  const loadRealityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [showsRes, contestantsRes] = await Promise.allSettled([
        contentApi.getContentByCategory('reality', 1, 20),
        apiClient.get<Contestant[]>('/v1/reality/shows/survivor-nigeria-s1/contestants'),
      ]);

      if (showsRes.status === 'fulfilled' && showsRes.value.success && showsRes.value.data) {
        setRealityShows(showsRes.value.data.items ?? []);
      }
      if (contestantsRes.status === 'fulfilled' && Array.isArray(contestantsRes.value)) {
        setContestants(contestantsRes.value);
      }
    } catch {
      setError('Failed to load reality shows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRealityData();
  }, [loadRealityData]);

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.universe?.name || 'Reality Universe',
    }));

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}` as Href);
    },
    [router]
  );

  if (isLoading && realityShows.length === 0) {
    return <LoadingState text="Loading Reality Universe..." />;
  }

  if (error && realityShows.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadRealityData()} />;
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
          <Text style={styles.badgeText}>🔴 LIVE VOTING ACTIVE</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Reality Universe</Text>
        <Text style={styles.subtitle}>
          Vote for your favorite contestants, watch 24/7 unedited house cams, and stream live
          elimination nights.
        </Text>
      </View>

      {/* Featured Shows Rail */}
      <View style={styles.section}>
        <FocusableRow
          title="Featured Reality Shows"
          items={toRailItems(realityShows)}
          onSelect={handleSelect}
        />
      </View>

      {/* ── Interactive Live Elimination & Super Vote Card ── */}
      <View style={styles.voteHubCard}>
        <View style={styles.voteHubLeft}>
          <View style={styles.voteCountdownRow}>
            <Text style={styles.countdownBadge}>⏳ ELIMINATION LIVE IN 02:45:10</Text>
            {voteFeedback && <Text style={styles.feedbackBanner}>{voteFeedback}</Text>}
          </View>
          <Text style={styles.voteHubTitle}>Cast Remote Fast Vote (50 Coins)</Text>
          <Text style={styles.voteHubDesc}>
            Select any contestant below with your remote control to cast an instant 50-vote block
            directly from your Azeebo Coin balance.
          </Text>
          <View style={styles.votePromptRow}>
            <Text style={styles.votePromptKey}>[ OK / Select ]</Text>
            <Text style={styles.votePromptText}>on any contestant card below to vote</Text>
          </View>
        </View>

        <View style={styles.voteHubRight}>
          <View style={styles.qrPlate}>
            <QRCodeView
              value={`https://app.azeeboplus.com/reality/voting?room=${encodeURIComponent(realityShows[0]?.id || 'survivor-nigeria-s1')}&source=tv-second-screen`}
              size={110}
            />
          </View>
          <Text style={styles.qrCaption}>Scan to Pair Phone as 100x Super Vote Remote</Text>
        </View>
      </View>

      {/* Contestants Spotlight */}
      {contestants.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contestant Leaderboard (Press OK to Vote)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contestantsList}
          >
            {contestants.map((c, idx) => (
              <FocusableCard
                key={c.id}
                style={[
                  styles.contestantCard,
                  selectedContestant?.id === c.id && styles.contestantCardActive,
                ]}
                onPress={() => {
                  setSelectedContestant(c);
                  void handleFastVote(c);
                }}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <Text style={styles.contestantName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.contestantVotes}>{c.votes.toLocaleString()} votes</Text>
                <View style={styles.voteCtaBadge}>
                  <Text style={styles.voteCtaText}>+50 Votes (OK)</Text>
                </View>
              </FocusableCard>
            ))}
          </ScrollView>
        </View>
      )}
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
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  badgeText: {
    color: '#EF4444',
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
  contestantsList: {
    flexDirection: 'row',
  },
  contestantCard: {
    width: 220,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    padding: tvSpacing.md,
    marginRight: tvSpacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  contestantName: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    fontWeight: '700',
    marginBottom: 4,
  },
  contestantVotes: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    marginBottom: 8,
  },
  contestantCardActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(255, 94, 30, 0.15)',
  },
  voteCtaBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  voteCtaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  voteHubCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: tvSpacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: tvSpacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteHubLeft: {
    flex: 1,
    marginRight: tvSpacing.xl,
  },
  voteCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tvSpacing.md,
    marginBottom: 8,
  },
  countdownBadge: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feedbackBanner: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
  voteHubTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  voteHubDesc: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.base,
    lineHeight: 22,
    marginBottom: 12,
  },
  votePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  votePromptKey: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '800',
  },
  votePromptText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  voteHubRight: {
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qrPlate: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  qrCaption: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '700',
    maxWidth: 130,
    textAlign: 'center',
  },
});
