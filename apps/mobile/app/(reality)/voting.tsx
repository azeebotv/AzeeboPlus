import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, radius } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { analytics } from '../../src/utils/analytics';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  status: string;
}

const VOTE_PACKAGES = [
  { id: 'single', label: '1 Vote', votes: 1, price: 100 },
  { id: 'bronze', label: '5 Votes', votes: 5, price: 450 },
  { id: 'silver', label: '20 Votes', votes: 20, price: 1600, popular: true },
  { id: 'gold', label: '50 Votes', votes: 50, price: 3500 },
];

export default function VotingScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showId } = useLocalSearchParams<{ showId: string }>();
  const isDark = colorScheme === 'dark';
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[2]);

  const contestantsQuery = useQuery({
    queryKey: ['reality', 'contestants', showId],
    queryFn: async () => {
      const res = await apiClient.get<Contestant[]>(`/v1/reality/shows/${showId}/contestants`);
      return Array.isArray(res) ? res : [];
    },
    enabled: !!showId,
  });

  useEffect(() => {
    if (showId) {
      analytics.realityShowViewed(showId);
    }
    const contestants = contestantsQuery.data ?? [];
    if (contestants.length > 0 && !selectedContestant) {
      setSelectedContestant(contestants[0]);
    }
  }, [contestantsQuery.data]);

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContestant || !showId) return;
      return apiClient.post(`/v1/reality/shows/${showId}/vote`, {
        contestantId: selectedContestant.id,
        votes: selectedPackage.votes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reality', 'contestants'] });
      analytics.realityVoteCreated(
        showId || '',
        selectedContestant?.id || '',
        selectedPackage.votes,
        selectedPackage.price
      );
    },
  });

  const contestants = contestantsQuery.data ?? [];
  const maxVotes = Math.max(0, ...contestants.map((c) => c.votes));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Vote</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Contestant Selection */}
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Choose Contestant
          </Text>
          {contestants.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.contestantCard,
                { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                selectedContestant?.id === c.id && styles.contestantSelected,
              ]}
              onPress={() => setSelectedContestant(c)}
            >
              <View
                style={[styles.contestantAvatar, { backgroundColor: colors.primary[500] + '20' }]}
              >
                <Text style={styles.contestantInitial}>{c.name[0]}</Text>
              </View>
              <View style={styles.contestantInfo}>
                <Text style={[styles.contestantName, { color: colors.text.primary }]}>
                  {c.name}
                </Text>
                <View style={styles.voteBar}>
                  <View
                    style={[
                      styles.voteBarFill,
                      {
                        width: `${(c.votes / (maxVotes || 1)) * 100}%`,
                        backgroundColor: colors.primary[500],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.voteCount}>{c.votes.toLocaleString()} votes</Text>
              </View>
              {selectedContestant?.id === c.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}

          {/* Vote Packages */}
          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 24 }]}>
            Vote Package
          </Text>
          <View style={styles.packagesGrid}>
            {VOTE_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  selectedPackage.id === pkg.id && styles.packageSelected,
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <Text style={[styles.packageLabel, { color: colors.text.primary }]}>
                  {pkg.label}
                </Text>
                <Text style={[styles.packagePrice, { color: colors.primary[500] }]}>
                  ₦{pkg.price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Vote Button */}
          <TouchableOpacity
            style={[
              styles.voteButton,
              (!selectedContestant || voteMutation.isPending) && styles.voteButtonDisabled,
            ]}
            onPress={() => voteMutation.mutate()}
            disabled={!selectedContestant || voteMutation.isPending}
          >
            <Text style={styles.voteButtonText}>
              {voteMutation.isPending
                ? 'Voting...'
                : voteMutation.isSuccess
                  ? '✓ Vote Cast!'
                  : `Vote ${selectedPackage.label}`}
            </Text>
          </TouchableOpacity>

          {voteMutation.isError && (
            <Text style={styles.errorText}>Failed to cast vote. Please try again.</Text>
          )}
        </View>

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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  contestantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: 10,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contestantSelected: { borderColor: colors.primary[500] },
  contestantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestantInitial: { fontSize: 18, fontWeight: '700', color: colors.primary[500] },
  contestantInfo: { flex: 1 },
  contestantName: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  voteBar: { height: 4, borderRadius: 2, backgroundColor: colors.bg.tertiary, marginBottom: 4 },
  voteBarFill: { height: 4, borderRadius: 2 },
  voteCount: { fontSize: 12, color: colors.text.tertiary },
  checkmark: { fontSize: 18, color: colors.primary[500], fontWeight: '700' },
  packagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  packageCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageSelected: { borderColor: colors.primary[500] },
  popularBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  popularText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  packageLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  packagePrice: { fontSize: 16, fontWeight: '700' },
  voteButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  voteButtonDisabled: { opacity: 0.5 },
  voteButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginTop: 12 },
});
