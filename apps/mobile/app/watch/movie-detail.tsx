import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';

export default function MovieDetailScreen() {
  const colorScheme = useColorScheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Movie
        </Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Image source={{ uri: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=epic%20fantasy%20movie%20poster%20with%20ancient%20warriors%20and%20kingdoms%20cinematic&image_size=landscape_16_9' }} style={styles.heroImage} />
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
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={() => setIsPlaying(true)}
          >
            <Text style={styles.playIcon}>▶</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.movieTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          The Last Kingdom
        </Text>
        <View style={styles.movieMeta}>
          <Text style={styles.metaItem}>2024</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaItem}>Action</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaItem}>2h 34m</Text>
        </View>
        <Text style={styles.movieDescription}>
          A thrilling adventure set in ancient times, following the journey of a young warrior 
          who must unite warring kingdoms to defeat a common enemy.
        </Text>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🎬</Text>
          <Text style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📖</Text>
          <Text style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⭐</Text>
          <Text style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Rate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={[styles.actionText, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.castSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Cast
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castScroll}>
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
              <Text style={[styles.castName, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {actor.name}
              </Text>
              <Text style={styles.castRole}>{actor.role}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.recommendationsSection}>
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Similar Movies
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moviesScroll}>
          {[
            { title: 'Kingdoms Rising', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=ancient%20kingdom%20battle%20scene%20fantasy%20movie&image_size=portrait_4_3' },
            { title: 'Warrior\'s Quest', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=medieval%20warrior%20knight%20armor%20epic%20fantasy&image_size=portrait_4_3' },
            { title: 'Dragon Realm', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=epic%20dragon%20battle%20fantasy%20cinematic%20scene&image_size=portrait_4_3' },
            { title: 'The Crown', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=royal%20castle%20crown%20medieval%20fantasy%20movie&image_size=portrait_4_3' },
            { title: 'Sword Master', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=sword%20fighting%20ancient%20warrior%20action%20movie&image_size=portrait_4_3' },
          ].map((movie) => (
            <TouchableOpacity key={movie.title} style={styles.movieCard}>
              <Image source={{ uri: movie.image }} style={styles.movieThumbnail} />
              <Text style={[styles.movieCardTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
                {movie.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
    backgroundColor: '#333',
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
    backgroundColor: '#333',
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
    backgroundColor: '#333',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
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
    color: '#888',
  },
  metaDivider: {
    color: '#888',
  },
  movieDescription: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#8B5CF6',
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
    color: '#888',
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
