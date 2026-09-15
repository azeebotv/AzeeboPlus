import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

interface LiveEventDetail {
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
  streamUrl: string;
  replayUrl: string;
  chatEnabled: boolean;
  _count: { tickets: number };
}

export default function LiveEventDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';

  const eventQuery = useQuery({
    queryKey: ['live-event', id],
    queryFn: async () => {
      const res = await apiClient.get<LiveEventDetail>(`/api/v1/live-events/${id}`);
      const data = res as unknown as { data?: LiveEventDetail; success?: boolean };
      if (data.data) return data.data;
      return res as LiveEventDetail;
    },
    staleTime: 15000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ id: string }>(`/api/v1/live-events/${id}/purchase`, {});
      const data = res as unknown as { data?: { id: string }; success?: boolean };
      if (data.data) return data.data;
      return res as { id: string };
    },
    onSuccess: () => {
      eventQuery.refetch();
      Alert.alert('Success', 'Ticket purchased! Check your tickets for streaming access.');
    },
    onError: (error: Error) => {
      Alert.alert('Purchase Failed', error.message || 'Could not purchase ticket');
    },
  });

  const event = eventQuery.data;
  const isLoading = eventQuery.isLoading;
  const error = eventQuery.error?.message;

  const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatPrice = (price: number, currency: string): string => {
    if (price === 0) return 'Free';
    const symbols: Record<string, string> = {
      NGN: '\u20A6',
      USD: '$',
      EUR: '\u20AC',
      GBP: '\u00A3',
    };
    return `${symbols[currency] || currency} ${price.toLocaleString()}`;
  };

  const getTimeStatus = (scheduledAt: string, status: string): string => {
    if (status === 'live') return '\uD83D\uDD34 Live Now';
    if (status === 'ended') return 'Ended';
    if (status === 'cancelled') return 'Cancelled';
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return '\uD83D\uDD34 Live Now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `Starts in ${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#fff' }]}>
        <LoadingState text="Loading event..." />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#fff' }]}>
        <ErrorState description={error || 'Event not found'} onRetry={() => eventQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const bgColor = isDark ? '#1A0A0A' : '#fff';
  const textColor = isDark ? '#fff' : '#1A0A0A';
  const cardBg = isDark ? '#1a1a1a' : '#f5f5f5';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>{'\u2190'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageEmoji}>{'\uD83C\uDFAC'}</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={[styles.title, { color: textColor }]}>{event.title}</Text>
          <Text style={styles.statusText}>{getTimeStatus(event.scheduledAt, event.status)}</Text>

          <View style={[styles.priceCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.price, { color: '#E8420A' }]}>
              {formatPrice(event.ticketPrice, event.currency)}
            </Text>
            <Text style={styles.priceLabel}>
              {event.ticketPrice === 0 ? 'Free entry' : 'Per person'}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {formatDate(event.scheduledAt)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{event.duration} min</Text>
            </View>
            {event.maxViewers && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {event._count.tickets}/{event.maxViewers}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: textColor }]}>About</Text>
          <Text style={styles.description}>{event.description}</Text>

          {event.status === 'cancelled' ? (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>This event has been cancelled</Text>
            </View>
          ) : event.status === 'ended' ? (
            <View style={styles.endedBanner}>
              <Text style={styles.endedText}>This event has ended</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.purchaseButton,
                purchaseMutation.isPending && { backgroundColor: colors.neutral[600] },
              ]}
              onPress={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              <Text style={styles.purchaseButtonText}>
                {purchaseMutation.isPending
                  ? 'Processing...'
                  : event.status === 'live'
                    ? 'Purchase & Watch'
                    : 'Get Ticket'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.terms}>
            <Text style={styles.termText}>{'\u2022'} Ticket grants access to live stream</Text>
            <Text style={styles.termText}>
              {'\u2022'} Post-event replay available for ticket holders
            </Text>
            <Text style={styles.termText}>{'\u2022'} Payment debited from wallet balance</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: { padding: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  imagePlaceholder: {
    width: '90%',
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  imageEmoji: { fontSize: 60 },
  contentSection: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statusText: { fontSize: 14, color: '#E8420A', fontWeight: '600', marginBottom: 16 },
  priceCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  price: { fontSize: 28, fontWeight: '700' },
  priceLabel: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  infoGrid: { marginBottom: 20, gap: 12 },
  infoItem: {},
  infoLabel: { fontSize: 12, color: colors.text.secondary, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, color: colors.text.secondary, lineHeight: 22, marginBottom: 24 },
  cancelledBanner: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelledText: { color: '#ef4444', fontWeight: '600' },
  endedBanner: {
    backgroundColor: 'rgba(107,114,128,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  endedText: { color: '#6b7280', fontWeight: '600' },
  purchaseButton: {
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  terms: { gap: 6 },
  termText: { fontSize: 12, color: colors.text.tertiary },
});
