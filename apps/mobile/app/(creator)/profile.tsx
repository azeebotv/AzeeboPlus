import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contentApi } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';

interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  totalContent: number;
  totalViews: number;
  isFollowing: boolean;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  recentContent: Array<{
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    type: 'video' | 'image' | 'audio';
  }>;
}

export default function CreatorProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const creatorId = params.creatorId as string;

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [creatorId]);

  const loadProfile = async () => {
    try {
      const response = await contentApi.getCreatorProfile(creatorId);
      if (response.success && response.data) {
        // Map API CreatorProfile to UI CreatorProfile interface
        setProfile({
          id: response.data.id,
          username: response.data.displayName?.toLowerCase().replace(/\s+/g, '') ?? '',
          displayName: response.data.displayName,
          avatar: response.data.avatar ?? '',
          bio: response.data.bio ?? '',
          followers: response.data.followers,
          following: response.data.following,
          totalContent: response.data.totalContent,
          totalViews: 0,
          isFollowing: false,
          socialLinks: (response.data.socialLinks as unknown as Record<string, string>) ?? {},
          recentContent: [],
        });
      }
    } catch (error) {
      logger.error('Failed to load creator profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setProfile({
      ...profile,
      isFollowing: !profile.isFollowing,
      followers: profile.isFollowing ? profile.followers - 1 : profile.followers + 1,
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'image':
        return '📷';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8420A" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Creator Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(profile.followers)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(profile.following)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalContent}</Text>
              <Text style={styles.statLabel}>Content</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(profile.totalViews)}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followButton, profile.isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text
                style={[styles.followButtonText, profile.isFollowing && styles.followingButtonText]}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {profile.socialLinks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            <View style={styles.socialCard}>
              {profile.socialLinks.instagram && (
                <TouchableOpacity style={styles.socialLink}>
                  <Text style={styles.socialIcon}>📷</Text>
                  <Text style={styles.socialText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {profile.socialLinks.twitter && (
                <TouchableOpacity style={styles.socialLink}>
                  <Text style={styles.socialIcon}>🐦</Text>
                  <Text style={styles.socialText}>Twitter</Text>
                </TouchableOpacity>
              )}
              {profile.socialLinks.youtube && (
                <TouchableOpacity style={styles.socialLink}>
                  <Text style={styles.socialIcon}>📺</Text>
                  <Text style={styles.socialText}>YouTube</Text>
                </TouchableOpacity>
              )}
              {profile.socialLinks.tiktok && (
                <TouchableOpacity style={styles.socialLink}>
                  <Text style={styles.socialIcon}>🎵</Text>
                  <Text style={styles.socialText}>TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Content</Text>
          {profile.recentContent.map((content) => (
            <TouchableOpacity
              key={content.id}
              style={styles.contentCard}
              onPress={() => router.push(`/(creator)/upload?id=${content.id}` as Href)}
            >
              <Image source={{ uri: content.thumbnail }} style={styles.contentThumbnail} />
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle} numberOfLines={1}>
                  {content.title}
                </Text>
                <View style={styles.contentMeta}>
                  <Text style={styles.contentType}>{getTypeIcon(content.type)}</Text>
                  <Text style={styles.contentViews}>{formatNumber(content.views)} views</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.light[400],
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.light[100],
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E8420A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.light[100],
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: colors.light[400],
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: colors.light[100],
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.light[400],
  },
  actionRow: {
    width: '100%',
  },
  followButton: {
    backgroundColor: '#E8420A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.light[100],
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light[100],
    marginBottom: 16,
  },
  socialCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    padding: 16,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialText: {
    fontSize: 16,
    color: colors.light[100],
  },
  contentCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.tertiary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  contentThumbnail: {
    width: 100,
    height: 100,
  },
  contentInfo: {
    flex: 1,
    padding: 12,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light[100],
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentType: {
    fontSize: 14,
    marginRight: 8,
  },
  contentViews: {
    fontSize: 12,
    color: colors.light[400],
  },
});
