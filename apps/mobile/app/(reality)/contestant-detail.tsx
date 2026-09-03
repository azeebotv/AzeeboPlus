import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

interface ContestantDetail {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  votes: number;
  rank: number;
  status: string;
  showId: string;
  showName: string;
}

export default function ContestantDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [data, setData] = useState<ContestantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) { setError('No contestant ID'); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const res = await apiClient.get<ContestantDetail>(`/v1/reality/contestants/${id}`);
      setData(res);
    } catch { setError('Failed to load contestant'); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}><LoadingState text="Loading..." /></SafeAreaView>;
  if (error || !data) return <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}><ErrorState description={error || 'Not found'} onRetry={fetchData} /></SafeAreaView>;

  const getStatusColor = () => {
    if (data.status === 'safe') return '#22C55E';
    if (data.status === 'danger') return '#EF4444';
    return colors.text.tertiary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>{data.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.primary[500] + '20' }]}>
            <Text style={styles.avatarText}>{data.avatar || data.name[0]}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text.primary }]}>{data.name}</Text>
          <Text style={[styles.showName, { color: colors.primary[500] }]}>{data.showName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '25' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{data.status}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: colors.primary[500] }]}>{data.votes.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Votes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}>
            <Text style={[styles.statValue, { color: colors.primary[500] }]}>#{data.rank}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>Rank</Text>
          </View>
        </View>

        {data.bio && (
          <View style={styles.bioSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
            <Text style={[styles.bioText, { color: isDark ? colors.text.secondary : '#666' }]}>{data.bio}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => router.push(`/reality/voting?showId=${data.showId}`)}
        >
          <Text style={styles.voteButtonText}>🗳️ Vote for {data.name}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg.tertiary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  hero: { alignItems: 'center', padding: 16, paddingBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 40, fontWeight: '700', color: colors.primary[500] },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  showName: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, padding: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  bioSection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  bioText: { fontSize: 14, lineHeight: 22 },
  voteButton: { margin: 16, backgroundColor: colors.primary[500], paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  voteButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
