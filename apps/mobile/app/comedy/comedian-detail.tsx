import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../src/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

interface ComedianProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: string;
  specialCount: number;
  rating: string;
  socialLinks: { platform: string; url: string }[];
}

interface Clip {
  id: string;
  title: string;
  duration: string;
  views: string;
  emoji: string;
}

interface Special {
  id: string;
  title: string;
  year: string;
  emoji: string;
}

export default function ComedianDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [profile, setProfile] = useState<ComedianProfile | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, clipsRes, specialsRes] = await Promise.all([
          apiClient.get<ComedianProfile>(`/comedy/comedians/${id}`),
          apiClient.get<Clip[]>(`/comedy/comedians/${id}/clips`).catch(() => []),
          apiClient.get<Special[]>(`/comedy/comedians/${id}/specials`).catch(() => []),
        ]);
        setProfile(profileRes);
        setClips(Array.isArray(clipsRes) ? clipsRes : []);
        setSpecials(Array.isArray(specialsRes) ? specialsRes : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comedian');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading comedian..." />
      </SafeAreaView>
    );
  if (error)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={error} onRetry={() => {}} />
      </SafeAreaView>
    );
  if (!profile)
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <EmptyState icon="🎤" title="Comedian not found" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>{profile.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>{profile.name}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {profile.followers}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {profile.specialCount}
              </Text>
              <Text style={styles.statLabel}>Specials</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                ⭐ {profile.rating}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Clips</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clipsList}
          >
            {clips.map((clip) => (
              <TouchableOpacity
                key={clip.id}
                style={[styles.clipCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
              >
                <View style={styles.clipThumb}>
                  <Text style={styles.clipEmoji}>{clip.emoji}</Text>
                  <View style={styles.clipDuration}>
                    <Text style={styles.clipDurationText}>{clip.duration}</Text>
                  </View>
                </View>
                <Text
                  style={[styles.clipTitle, { color: isDark ? '#fff' : '#000' }]}
                  numberOfLines={1}
                >
                  {clip.title}
                </Text>
                <Text style={styles.clipViews}>👁️ {clip.views}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Specials</Text>
          {specials.map((special) => (
            <TouchableOpacity
              key={special.id}
              style={[styles.specialRow, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
            >
              <Text style={styles.specialEmoji}>{special.emoji}</Text>
              <View style={styles.specialInfo}>
                <Text style={[styles.specialTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {special.title}
                </Text>
                <Text style={styles.specialYear}>{special.year}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 50 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  content: { paddingBottom: 30 },
  profileSection: { alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 50 },
  name: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  bio: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 32, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  statLabel: { color: '#888', fontSize: 12 },
  followButton: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#888' },
  followButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  followingButtonText: { color: '#888' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  clipsList: { gap: 12 },
  clipCard: { width: 160, borderRadius: 10, overflow: 'hidden' },
  clipThumb: {
    height: 100,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clipEmoji: { fontSize: 40 },
  clipDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clipDurationText: { color: '#fff', fontSize: 11 },
  clipTitle: { fontSize: 13, fontWeight: '600', padding: 8, paddingBottom: 2 },
  clipViews: { color: '#888', fontSize: 11, paddingHorizontal: 8, paddingBottom: 8 },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  specialEmoji: { fontSize: 30 },
  specialInfo: { flex: 1 },
  specialTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  specialYear: { color: '#888', fontSize: 12 },
});
