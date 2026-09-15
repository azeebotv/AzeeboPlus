import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState, EmptyState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';

export default function MovieDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [movie, setMovie] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(0);

  const fetchMovie = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const featured = await contentApi.getFeaturedContent(1);
      if (featured.success && featured.data?.[0]) {
        const movieData = featured.data[0];
        setMovie(movieData);
        const relatedRes = await contentApi.getTrendingContent(5);
        if (relatedRes.success && relatedRes.data) {
          setRelated(relatedRes.data.filter((item) => item.id !== movieData.id));
        }
      } else {
        setError('No movie content available');
      }
    } catch (err: unknown) {
      logger.error('Failed to load movie:', err);
      const message = err instanceof Error ? err.message : 'Failed to load movie';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, []);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <LoadingState text="Loading movie..." />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ErrorState description={error} onRetry={fetchMovie} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <EmptyState
          icon="🎬"
          title="No Movie"
          description="No movie content available right now."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Movie
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Image source={{ uri: movie.thumbnail }} style={styles.heroImage} />
        {isPlaying ? (
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Text style={styles.controlIcon}>⏸</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.timeText}>01:23:45 / 02:34:00</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={() => setIsPlaying(true)}>
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text
          style={[styles.movieTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          {movie.title}
        </Text>
        <View style={styles.movieMeta}>
          <Text style={styles.metaItem}>{new Date(movie.createdAt).getFullYear()}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaItem}>{movie.contentType || 'Movie'}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaItem}>
            {movie.duration ? `${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m` : 'N/A'}
          </Text>
        </View>
        <Text style={styles.movieDescription}>{movie.description}</Text>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🎬</Text>
          <Text
            style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Play
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📖</Text>
          <Text
            style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Watchlist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⭐</Text>
          <Text
            style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Rate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text
            style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.castSection}>
        <Text
          style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
        >
          Cast
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.castScroll}
        >
          {[
            { name: 'John Doe', role: 'Lead Actor', avatar: '👨' },
            { name: 'Jane Smith', role: 'Lead Actress', avatar: '👩' },
            { name: 'Mike Johnson', role: 'Supporting', avatar: '👨' },
            { name: 'Sarah Williams', role: 'Supporting', avatar: '👩' },
          ].map((actor) => (
            <View key={actor.name} style={styles.castItem}>
              <View style={styles.castAvatar}>
                <Text style={styles.castAvatarText}>{actor.avatar}</Text>
              </View>
              <Text
                style={[styles.castName, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
              >
                {actor.name}
              </Text>
              <Text style={styles.castRole}>{actor.role}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {related.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text
            style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Similar Movies
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moviesScroll}
          >
            {related.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.movieCard}
                onPress={() => router.push(`/watch/${item.id}`)}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.movieThumbnail} />
                <Text
                  style={[
                    styles.movieCardTitle,
                    { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: '#fff',
    fontSize: 18,
  },
  heroSection: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 225,
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 32,
    marginLeft: 4,
  },
  playerControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  controlIcon: {
    color: '#fff',
    fontSize: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.tertiary,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#E8420A',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  infoSection: {
    padding: 16,
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  metaDivider: {
    color: colors.text.secondary,
  },
  movieDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    lineHeight: 1.5,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  castSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  castScroll: {
    flexDirection: 'row',
    gap: 16,
  },
  castItem: {
    alignItems: 'center',
    width: 80,
  },
  castAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8420A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  castAvatarText: {
    fontSize: 28,
  },
  castName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  castRole: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  recommendationsSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  moviesScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  movieCard: {
    width: 100,
  },
  movieThumbnail: {
    width: 100,
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  movieCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});
