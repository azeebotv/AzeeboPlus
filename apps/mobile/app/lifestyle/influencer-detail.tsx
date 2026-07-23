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
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/theme';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { lifestyleApi } from '../../src/api/lifestyle';

export default function InfluencerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const influencerQuery = useQuery({
    queryKey: ['lifestyle', 'influencer', id],
    queryFn: async () => {
      const res = await lifestyleApi.getInfluencerById(id!);
      return res?.data;
    },
    enabled: !!id,
  });

  const influencer = influencerQuery.data;
  const isLoading = influencerQuery.isLoading;
  const error = influencerQuery.error?.message;

  const handleShare = useCallback(async () => {
    if (!influencer) return;
    try {
      await Share.share({
        message: `Check out ${influencer.name} on Azeebo+`,
        title: influencer.name,
      });
    } catch {}
  }, [influencer]);

  const handleOpenSocial = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState text="Loading profile..." />
      </SafeAreaView>
    );
  }

  if (error || !influencer) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          description={error || 'Influencer not found'}
          onRetry={() => influencerQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: influencer.photo || 'https://placehold.co/800x400/1a1a1a/ffffff?text=★',
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
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: influencer.photo || 'https://placehold.co/120x120/1a1a1a/ffffff?text=★',
              }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>

          <Text style={[styles.name, { color: colors.text.primary }]}>{influencer.name}</Text>
          <Text style={[styles.profession, { color: colors.primary[500] }]}>
            {influencer.profession}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.bg.tertiary }]}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {formatCount(influencer.followerCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Followers</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.bg.tertiary }]}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {influencer.collaborationCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Collaborations</Text>
            </View>
          </View>

          {influencer.bio && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
              <Text style={[styles.bio, { color: colors.text.secondary }]}>{influencer.bio}</Text>
            </>
          )}

          {influencer.socialLinks && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Social Links</Text>
              <View style={styles.socialLinks}>
                {influencer.socialLinks.instagram && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(influencer.socialLinks!.instagram!)}
                  >
                    <Text style={styles.socialIcon}>📷</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>Instagram</Text>
                  </TouchableOpacity>
                )}
                {influencer.socialLinks.twitter && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(influencer.socialLinks!.twitter!)}
                  >
                    <Text style={styles.socialIcon}>🐦</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>Twitter</Text>
                  </TouchableOpacity>
                )}
                {influencer.socialLinks.youtube && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(influencer.socialLinks!.youtube!)}
                  >
                    <Text style={styles.socialIcon}>📺</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>YouTube</Text>
                  </TouchableOpacity>
                )}
                {influencer.socialLinks.tiktok && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(influencer.socialLinks!.tiktok!)}
                  >
                    <Text style={styles.socialIcon}>🎵</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>TikTok</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Collaborations
          </Text>
          <Text style={[styles.collabDescription, { color: colors.text.secondary }]}>
            {influencer.name} has collaborated with {influencer.collaborationCount} brands and creators.
          </Text>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
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
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.bg.primary,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  profession: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  socialIcon: {
    fontSize: 16,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '500',
  },
  collabDescription: {
    fontSize: 15,
    lineHeight: 24,
    alignSelf: 'flex-start',
  },
  bottomSpacer: {
    height: 40,
  },
});
