import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import {
  FocusableButton,
  FocusableCard,
} from '../src/components/Focusable';
import { LoadingState } from '../src/components/StateContainers';
import { colors, tvTypography, tvSpacing } from '../src/theme';

interface WatchPartyRoom {
  id: string;
  title: string;
  hostName: string;
  contentTitle: string;
  memberCount: number;
  status: string;
}

export default function TVWatchPartyScreen() {
  const router = useRouter();
  const [parties, setParties] = useState<WatchPartyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadParties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<WatchPartyRoom[]>('/v1/watch-parties');
      if (Array.isArray(res)) {
        setParties(res);
      } else {
        const wrapped = (res as unknown as { data?: WatchPartyRoom[] })?.data;
        if (Array.isArray(wrapped)) setParties(wrapped);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParties();
  }, [loadParties]);

  if (isLoading && parties.length === 0) {
    return <LoadingState text="Finding active Watch Parties..." />;
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
          <Text style={styles.badgeText}>👥 SYNCHRONIZED STREAMING</Text>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.title}>Live Watch Parties</Text>
        <Text style={styles.subtitle}>
          Watch live with friends and family across Nigeria. Synchronized playback, shared audio reactions, and community rooms.
        </Text>
      </View>

      {parties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍿</Text>
          <Text style={styles.emptyTitle}>No Public Parties Right Now</Text>
          <Text style={styles.emptyDesc}>
            Start a synchronized watch party from your mobile app or web browser to cast it to your TV screen!
          </Text>
        </View>
      ) : (
        <View style={styles.partiesGrid}>
          {parties.map((p) => (
            <FocusableCard
              key={p.id}
              style={styles.partyCard}
              onPress={() => router.push(`/watch/${p.id}` as Href)}
            >
              <View style={styles.partyBadge}>
                <Text style={styles.partyBadgeText}>LIVE PARTY</Text>
              </View>
              <Text style={styles.partyTitle} numberOfLines={1}>{p.title}</Text>
              <Text style={styles.contentTitle} numberOfLines={1}>Streaming: {p.contentTitle}</Text>
              <View style={styles.partyFooter}>
                <Text style={styles.hostText}>Host: {p.hostName}</Text>
                <Text style={styles.membersText}>👥 {p.memberCount} watching</Text>
              </View>
            </FocusableCard>
          ))}
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
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  badgeText: {
    color: '#6366F1',
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
  partiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tvSpacing.lg,
  },
  partyCard: {
    width: '48%',
    backgroundColor: colors.bg.secondary,
    borderRadius: 14,
    padding: tvSpacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  partyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  partyBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  partyTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  contentTitle: {
    color: colors.primary[500],
    fontSize: tvTypography.fontSize.base,
    fontWeight: '600',
    marginBottom: 12,
  },
  partyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
  },
  hostText: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  membersText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: tvSpacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xxl,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.xl,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
  },
});
