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

export default function CelebrityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const celebrityQuery = useQuery({
    queryKey: ['lifestyle', 'celebrity', id],
    queryFn: async () => {
      const res = await lifestyleApi.getCelebrityById(id!);
      return res?.data;
    },
    enabled: !!id,
  });

  const newsQuery = useQuery({
    queryKey: ['lifestyle', 'celebrity', id, 'news'],
    queryFn: async () => {
      const res = await lifestyleApi.getCelebrityNews(id!);
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
    enabled: !!id,
  });

  const celebrity = celebrityQuery.data;
  const news = newsQuery.data ?? [];
  const isLoading = celebrityQuery.isLoading;
  const error = celebrityQuery.error?.message;

  const handleShare = useCallback(async () => {
    if (!celebrity) return;
    try {
      await Share.share({
        message: `Check out ${celebrity.name} - ${celebrity.profession} on Azeebo+`,
        title: celebrity.name,
      });
    } catch { /* User cancelled share */ }
  }, [celebrity]);

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

  if (error || !celebrity) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          description={error || 'Celebrity not found'}
          onRetry={() => celebrityQuery.refetch()}
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
              uri: celebrity.photo || 'https://placehold.co/800x500/1a1a1a/ffffff?text=★',
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
          <Text style={[styles.name, { color: colors.text.primary }]}>{celebrity.name}</Text>
          <Text style={[styles.profession, { color: colors.primary[500] }]}>
            {celebrity.profession}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.bg.tertiary }]}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {formatCount(celebrity.followerCount)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Followers</Text>
            </View>
            {celebrity.newsCount !== undefined && (
              <View style={[styles.statCard, { backgroundColor: colors.bg.tertiary }]}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {celebrity.newsCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>News</Text>
              </View>
            )}
            {celebrity.relatedContentCount !== undefined && (
              <View style={[styles.statCard, { backgroundColor: colors.bg.tertiary }]}>
                <Text style={[styles.statValue, { color: colors.text.primary }]}>
                  {celebrity.relatedContentCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Content</Text>
              </View>
            )}
          </View>

          {celebrity.bio && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>About</Text>
              <Text style={[styles.bio, { color: colors.text.secondary }]}>{celebrity.bio}</Text>
            </>
          )}

          {celebrity.socialLinks && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Social Links
              </Text>
              <View style={styles.socialLinks}>
                {celebrity.socialLinks.instagram && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(celebrity.socialLinks!.instagram!)}
                  >
                    <Text style={styles.socialIcon}>📷</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>
                      Instagram
                    </Text>
                  </TouchableOpacity>
                )}
                {celebrity.socialLinks.twitter && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(celebrity.socialLinks!.twitter!)}
                  >
                    <Text style={styles.socialIcon}>🐦</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>Twitter</Text>
                  </TouchableOpacity>
                )}
                {celebrity.socialLinks.youtube && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(celebrity.socialLinks!.youtube!)}
                  >
                    <Text style={styles.socialIcon}>📺</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>YouTube</Text>
                  </TouchableOpacity>
                )}
                {celebrity.socialLinks.tiktok && (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.bg.tertiary }]}
                    onPress={() => handleOpenSocial(celebrity.socialLinks!.tiktok!)}
                  >
                    <Text style={styles.socialIcon}>🎵</Text>
                    <Text style={[styles.socialText, { color: colors.text.primary }]}>TikTok</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {news.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Latest News</Text>
              <View style={styles.newsList}>
                {news.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.newsCard, { backgroundColor: colors.bg.tertiary }]}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                    <View style={styles.newsInfo}>
                      <Text
                        style={[styles.newsTitle, { color: colors.text.primary }]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.newsSource, { color: colors.text.secondary }]}>
                        {item.source} • {item.publishedAt}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

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
    height: 350,
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
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  profession: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
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
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
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
  newsList: {
    gap: 12,
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsImage: {
    width: 100,
    height: 80,
  },
  newsInfo: {
    flex: 1,
    padding: 12,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  newsSource: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
