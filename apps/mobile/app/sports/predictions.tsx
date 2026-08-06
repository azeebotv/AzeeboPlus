import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';
import { apiClient } from '../../src/api/client';
import { ApiResponse } from '../../src/types/api';

type ListResponse<T> = T[] | ApiResponse<T[]>;

interface PredictionMarket {
  id: string;
  question: string;
  options: { id: string; label: string; odds: number }[];
  category: string;
  endsAt: string;
  volume: string;
  status: 'active' | 'closed';
}

const CATEGORIES = ['All', 'Football', 'Basketball', 'Tennis', 'MMA'];

export default function PredictionsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('All');

  const marketsQuery = useQuery({
    queryKey: ['sports', 'predictions', selectedCategory],
    queryFn: async () => {
      const res = await apiClient.get<ListResponse<PredictionMarket>>(
        '/v1/sports/prediction-markets'
      );
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    staleTime: 15_000,
  });

  const isLoading = marketsQuery.isLoading;
  const error = marketsQuery.error?.message;
  const allMarkets = marketsQuery.data ?? [];
  const markets =
    selectedCategory === 'All'
      ? allMarkets
      : allMarkets.filter((m) => m.category === selectedCategory);

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading markets..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => marketsQuery.refetch()} />
      </SafeAreaView>
    );
  if (!markets.length)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="📊" title="No markets" description="No prediction markets available" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Predictions
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContent}>
        {markets.map((market) => (
          <View
            key={market.id}
            style={[styles.marketCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
          >
            <View style={styles.marketHeader}>
              <Text style={styles.marketCategory}>{market.category}</Text>
              <Text
                style={[styles.marketStatus, market.status === 'closed' && styles.statusClosed]}
              >
                {market.status === 'active' ? '🟢 Active' : 'Closed'}
              </Text>
            </View>
            <Text style={[styles.marketQuestion, { color: isDark ? '#fff' : '#000' }]}>
              {market.question}
            </Text>
            <Text style={styles.marketVolume}>Volume: {market.volume}</Text>
            <View style={styles.optionsRow}>
              {market.options.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, { backgroundColor: isDark ? '#2a2a2a' : '#e5e5e5' }]}
                  onPress={() =>
                    Alert.alert('Place Bet', `Bet on "${opt.label}" at ${opt.odds.toFixed(2)}?`)
                  }
                >
                  <Text style={[styles.optionLabel, { color: isDark ? '#fff' : '#000' }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.optionOdds}>{opt.odds.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.endsAt}>Ends: {market.endsAt}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  categoryBar: { paddingHorizontal: 16, marginBottom: 16, maxHeight: 50 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  categoryChipActive: { backgroundColor: '#E74C3C' },
  categoryText: { color: '#888', fontSize: 13, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  marketCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketCategory: { color: '#E74C3C', fontSize: 12, fontWeight: '600' },
  marketStatus: { color: '#888', fontSize: 12 },
  statusClosed: { color: '#666' },
  marketQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  marketVolume: { color: '#888', fontSize: 12, marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  optionCard: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  optionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  optionOdds: { color: '#E74C3C', fontSize: 16, fontWeight: '700' },
  endsAt: { color: '#888', fontSize: 11 },
});
