import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi } from '@azeebo/react-data/api/lifestyle';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ['lifestyle', 'event', id],
    queryFn: async () => {
      const res = await lifestyleApi.getEventById(id!);
      return res?.data;
    },
    enabled: !!id,
  });

  const rsvpMutation = useMutation({
    mutationFn: (eventId: string) => lifestyleApi.rsvpEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'event', id] });
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'events'] });
    },
  });

  const unRsvpMutation = useMutation({
    mutationFn: (eventId: string) => lifestyleApi.unRsvpEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'event', id] });
      queryClient.invalidateQueries({ queryKey: ['lifestyle', 'events'] });
    },
  });

  const event = eventQuery.data;
  const isLoading = eventQuery.isLoading;
  const error = eventQuery.error?.message;

  const handleShare = useCallback(async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `Check out ${event.title} at ${event.venue} on ${event.date}!`,
        title: event.title,
      });
    } catch {
      /* User cancelled share */
    }
  }, [event]);

  const handleOpenMap = useCallback(() => {
    if (event?.mapUrl) {
      Linking.openURL(event.mapUrl);
    } else if (event?.location) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(event.location)}`);
    }
  }, [event]);

  const handleRsvpToggle = useCallback(() => {
    if (!event) return;
    if (event.isRsvpd) {
      unRsvpMutation.mutate(event.id);
    } else {
      rsvpMutation.mutate(event.id);
    }
  }, [event, rsvpMutation, unRsvpMutation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading event..." />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState description={error || 'Event not found'} onRetry={() => eventQuery.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: event.image || 'https://placehold.co/800x400/1a1a1a/ffffff?text=Event',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>{event.title}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={[styles.metaLabel, { color: colors.text.secondary }]}>Date</Text>
              <Text style={[styles.metaValue, { color: colors.text.primary }]}>{event.date}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={[styles.metaLabel, { color: colors.text.secondary }]}>Time</Text>
              <Text style={[styles.metaValue, { color: colors.text.primary }]}>{event.time}</Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.bg.tertiary }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Venue</Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {event.venue}
                </Text>
                <Text style={[styles.infoSubtext, { color: colors.text.secondary }]}>
                  {event.location}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
              <Text style={styles.mapButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.bg.tertiary }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👥</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Attendees</Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {event.attendeeCount} going
                </Text>
              </View>
            </View>
          </View>

          {event.price && (
            <View style={[styles.infoCard, { backgroundColor: colors.bg.tertiary }]}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🎟️</Text>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Price</Text>
                  <Text style={[styles.infoValue, { color: colors.primary[500] }]}>
                    {event.price}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
          <Text style={[styles.description, { color: colors.text.secondary }]}>
            {event.description}
          </Text>

          <TouchableOpacity
            style={[styles.rsvpButton, event.isRsvpd && styles.rsvpButtonActive]}
            onPress={handleRsvpToggle}
            disabled={rsvpMutation.isPending || unRsvpMutation.isPending}
          >
            <Text style={[styles.rsvpButtonText, event.isRsvpd && styles.rsvpButtonTextActive]}>
              {event.isRsvpd ? '✓ Going' : 'RSVP Now'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  shareButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaCard: {
    flex: 1,
    backgroundColor: colors.bg.tertiary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 14,
  },
  mapButton: {
    marginTop: 12,
    backgroundColor: colors.bg.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  rsvpButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: colors.success[500],
  },
  rsvpButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  rsvpButtonTextActive: {
    color: colors.text.primary,
  },
  bottomSpacer: {
    height: 40,
  },
});
