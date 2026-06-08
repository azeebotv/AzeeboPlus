import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

const { width } = Dimensions.get('window');

export default function TitleDetailPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [titleData, setTitleData] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [pricingOptions, setPricingOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await contentApi.getContent(id || 'default');
      if (response.success && response.data) {
        setTitleData(response.data);
      }
      const episodesRes = await contentApi.getEpisodes(id || 'default');
      if (episodesRes.success && episodesRes.data) {
        setEpisodes(episodesRes.data);
      }
    } catch (err) {
      logger.error('Failed to load content', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (episodeId: string, isFree: boolean) => {
    if (isFree) {
      Alert.alert('Playing', 'Starting episode playback...');
    } else {
      Alert.alert(
        'Unlock Episode',
        'This episode requires purchase. Would you like to unlock it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock for ₦200', onPress: () => Alert.alert('Success', 'Episode unlocked!') },
        ]
      );
    }
  };

  const handlePurchase = (option: any) => {
    Alert.alert(
      'Confirm Purchase',
      `Purchase ${option.type} for ${option.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: () => Alert.alert('Success', `${option.type} purchased successfully!`) },
      ]
    );
  };

  if (isLoading) {
    return <LoadingState text="Loading content..." />;
  }

  if (error) {
    return <ErrorState title="Failed to load" description={error} onRetry={loadContent} />;
  }

  if (!titleData) {
    return <ErrorState title="Content not found" description="This title could not be found." onRetry={loadContent} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <Text style={styles.heroEmoji}>👑</Text>
        </View>
        <View style={styles.heroOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶️</Text>
            <Text style={styles.playText}>Watch Trailer</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.titleHeader}>
          <Text style={[styles.titleText, { color: isDark ? '#ffffff' : '#000000' }]}>
            {titleData.title}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {titleData.rating}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{titleData.year}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{titleData.type}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{titleData.genre}</Text>
        </View>

        <View style={styles.infoChips}>
          <View style={styles.infoChip}>
            <Text style={styles.chipLabel}>Episodes</Text>
            <Text style={styles.chipValue}>{episodes.length}</Text>
          </View>
          <View style={styles.infoChip}>
            <Text style={styles.chipLabel}>Duration</Text>
            <Text style={styles.chipValue}>{titleData.duration}</Text>
          </View>
        </View>

        <View style={styles.synopsisSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Synopsis
          </Text>
          <Text style={[styles.synopsisText, { color: isDark ? '#ccc' : '#666' }]} numberOfLines={showFullSynopsis ? undefined : 3}>
            {titleData.synopsis}
          </Text>
          <TouchableOpacity onPress={() => setShowFullSynopsis(!showFullSynopsis)}>
            <Text style={styles.showMoreText}>
              {showFullSynopsis ? 'Show less' : 'Show more'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pricingSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            How to Watch
          </Text>
          <View style={styles.pricingCards}>
            {pricingOptions.length > 0 ? pricingOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.pricingCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
                onPress={() => handlePurchase(option)}
              >
                <Text style={[styles.pricingType, { color: isDark ? '#fff' : '#000' }]}>
                  {option.type}
                </Text>
                <Text style={styles.pricingPrice}>{option.price}</Text>
                <Text style={styles.pricingDesc}>{option.description}</Text>
              </TouchableOpacity>
            )) : null}
          </View>
        </View>

        <View style={styles.episodesSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Episodes
          </Text>
          {episodes.map((episode) => (
            <TouchableOpacity
              key={episode.id}
              style={[styles.episodeCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              onPress={() => handlePlay(episode.id, episode.free)}
            >
              <View style={styles.episodeLeft}>
                <View style={[styles.episodeNumber, !episode.free && styles.episodeNumberLocked]}>
                  {episode.free ? (
                    <Text style={styles.episodeNumberText}>{episode.number}</Text>
                  ) : (
                    <Text style={styles.lockIcon}>🔒</Text>
                  )}
                </View>
                <View style={styles.episodeInfo}>
                  <Text style={[styles.episodeTitle, { color: isDark ? '#fff' : '#000' }]}>
                    {episode.number}. {episode.title}
                  </Text>
                  <Text style={styles.episodeDuration}>{episode.duration}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.episodePlayButton, episode.free && styles.episodePlayButtonActive]}>
                <Text style={styles.playButtonIcon}>▶️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {titleData.cast && (
          <View style={styles.castSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Cast
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
              {titleData.cast.map((member: any) => (
                <View key={member.id} style={[styles.castCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <View style={styles.castAvatar}>
                    <Text style={styles.castEmoji}>{member.emoji}</Text>
                  </View>
                  <Text style={[styles.castName, { color: isDark ? '#fff' : '#000' }]}>{member.name}</Text>
                  <Text style={styles.castRole}>{member.role}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {titleData.similarContent && (
          <View style={styles.similarSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              More Like This
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
              {titleData.similarContent.map((item: any) => (
                <TouchableOpacity key={item.id} style={[styles.similarCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <View style={styles.similarThumbnail}>
                    <Text style={styles.similarEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.similarTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.similarRating}>⭐ {item.rating}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/watch')}>
          <Text style={styles.navIcon}>📺</Text>
          <Text style={styles.navLabel}>Watch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/create')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rewards')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    height: 280,
    position: 'relative',
  },
  heroBackground: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 100,
    opacity: 0.5,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  playIcon: {
    fontSize: 20,
  },
  playText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    padding: 16,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  titleText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  ratingContainer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFEAA7',
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    color: '#888',
    fontSize: 13,
  },
  metaDot: {
    color: '#888',
    marginHorizontal: 6,
  },
  infoChips: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoChip: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  chipLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 2,
  },
  chipValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  synopsisSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 22,
  },
  showMoreText: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  pricingSection: {
    marginBottom: 24,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: 10,
  },
  pricingCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pricingType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  pricingPrice: {
    color: '#4ECDC4',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  pricingDesc: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  episodesSection: {
    marginBottom: 24,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  episodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  episodeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeNumberLocked: {
    backgroundColor: '#2a2a2a',
  },
  episodeNumberText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 16,
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  episodeDuration: {
    color: '#888',
    fontSize: 12,
  },
  episodePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodePlayButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  playButtonIcon: {
    fontSize: 16,
  },
  castSection: {
    marginBottom: 24,
  },
  castList: {
    gap: 12,
  },
  castCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    width: 90,
  },
  castAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  castEmoji: {
    fontSize: 28,
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  castRole: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  similarSection: {
    marginBottom: 24,
  },
  similarList: {
    gap: 12,
  },
  similarCard: {
    width: 120,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  similarThumbnail: {
    height: 80,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarEmoji: {
    fontSize: 36,
  },
  similarTitle: {
    fontSize: 12,
    fontWeight: '600',
    padding: 8,
    paddingBottom: 4,
  },
  similarRating: {
    color: '#FFEAA7',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#888',
  },
});