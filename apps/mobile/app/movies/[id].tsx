import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../src/api';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StateContainers';

const PRICING_OPTIONS = [
  { id: '1', type: 'Rent (48h)', price: '₦500', features: ['48 hour access', 'HD quality'] },
  {
    id: '2',
    type: 'Buy',
    price: '₦1,500',
    features: ['Permanent access', 'HD quality', 'Download'],
  },
  {
    id: '3',
    type: 'Pass',
    price: '₦4,500/mo',
    features: ['All movies', '4K quality', 'Unlimited'],
  },
];

export default function MovieDetailPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isDark = colorScheme === 'dark';
  const [selectedOption, setSelectedOption] = useState<(typeof PRICING_OPTIONS)[0]>(
    PRICING_OPTIONS[0]
  );
  const [showPricing, setShowPricing] = useState(false);
  const [movie, setMovie] = useState<any>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [similarMovies, setSimilarMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovieData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [movieRes, castRes, similarRes] = await Promise.all([
        apiClient.get<any>(`/movies/${id}`),
        apiClient.get<any[]>(`/movies/${id}/cast`),
        apiClient.get<any[]>(`/movies/${id}/similar`),
      ]);
      setMovie(movieRes);
      setCast(castRes || []);
      setSimilarMovies(similarRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load movie data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [id]);

  const handlePlay = () => {
    setShowPricing(true);
  };

  const handlePurchase = () => {
    alert(`Purchased ${selectedOption.type} for ${selectedOption.price}`);
    setShowPricing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.heroSection}>
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterEmoji}>🎬</Text>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>2024</Text>
            </View>
          </View>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{MOVIE.title}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaItem}>⭐ {MOVIE.rating}</Text>
              <Text style={styles.heroMetaItem}>•</Text>
              <Text style={styles.heroMetaItem}>{MOVIE.genre}</Text>
              <Text style={styles.heroMetaItem}>•</Text>
              <Text style={styles.heroMetaItem}>{MOVIE.duration}</Text>
            </View>
            <Text style={styles.heroDirector}>Directed by {MOVIE.director}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playText}>Watch Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadIcon}>⬇</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButtonAlt}>
              <Text style={styles.shareIconAlt}>↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pricingPreview} onTouchEnd={() => setShowPricing(true)}>
            <Text style={styles.pricingLabel}>From</Text>
            <Text style={styles.pricingValue}>{selectedOption.price}</Text>
            <Text style={styles.pricingType}>{selectedOption.type}</Text>
            <Text style={styles.pricingChevron}>›</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Synopsis
            </Text>
            <Text style={styles.synopsisText}>{MOVIE.synopsis}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Cast & Crew
            </Text>
            <FlatList
              data={CAST}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.castCard}>
                  <View style={styles.castAvatar}>
                    <Text style={styles.castEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.castName, { color: isDark ? '#fff' : '#000' }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.castRole}>{item.role}</Text>
                </View>
              )}
              contentContainerStyle={styles.castList}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Similar Movies
            </Text>
            <FlatList
              data={SIMILAR_MOVIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.similarCard}>
                  <View style={styles.similarThumbnail}>
                    <Text style={styles.similarEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={[styles.similarTitle, { color: isDark ? '#fff' : '#000' }]}>
                    {item.title}
                  </Text>
                  <Text style={styles.similarGenre}>{item.genre}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.similarList}
            />
          </View>
        </View>
      </ScrollView>

      {showPricing && (
        <View style={styles.pricingModal}>
          <View
            style={[styles.pricingContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}
          >
            <View style={styles.pricingHeader}>
              <Text style={[styles.pricingTitle, { color: isDark ? '#fff' : '#000' }]}>
                Choose how to watch
              </Text>
              <TouchableOpacity onPress={() => setShowPricing(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pricingOptions}>
              {PRICING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.pricingOption,
                    selectedOption.id === option.id && styles.pricingOptionSelected,
                  ]}
                  onPress={() => setSelectedOption(option)}
                >
                  <View style={styles.pricingOptionHeader}>
                    <Text style={[styles.pricingOptionType, { color: isDark ? '#fff' : '#000' }]}>
                      {option.type}
                    </Text>
                    <Text style={styles.pricingOptionPrice}>{option.price}</Text>
                  </View>
                  <View style={styles.pricingOptionFeatures}>
                    {option.features.map((feature, index) => (
                      <Text key={index} style={styles.pricingOptionFeature}>
                        ✓ {feature}
                      </Text>
                    ))}
                  </View>
                  {selectedOption.id === option.id && (
                    <View style={styles.selectedCheck}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
              <Text style={styles.purchaseButtonText}>Pay {selectedOption.price}</Text>
            </TouchableOpacity>

            {selectedOption.id === '3' && (
              <Text style={styles.passNote}>
                Cancel anytime. Includes access to all movies in the Cinema Plus library.
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: '#fff',
    fontSize: 18,
  },
  heroSection: {
    height: 350,
    position: 'relative',
  },
  posterPlaceholder: {
    height: 350,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterEmoji: {
    fontSize: 80,
  },
  heroBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFEAA7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  heroBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroMetaItem: {
    color: '#ccc',
    fontSize: 14,
  },
  heroDirector: {
    color: '#888',
    fontSize: 13,
  },
  content: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEAA7',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  playIcon: {
    fontSize: 16,
    color: '#000',
  },
  playText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    color: '#fff',
    fontSize: 20,
  },
  shareButtonAlt: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIconAlt: {
    color: '#fff',
    fontSize: 20,
  },
  pricingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  pricingLabel: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  pricingValue: {
    color: '#FFEAA7',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  pricingType: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  pricingChevron: {
    color: '#888',
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  synopsisText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  castList: {
    gap: 16,
  },
  castCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  castAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  castEmoji: {
    fontSize: 28,
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  castRole: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
  },
  similarList: {
    gap: 12,
  },
  similarCard: {
    width: 130,
    marginRight: 12,
  },
  similarThumbnail: {
    height: 150,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  similarEmoji: {
    fontSize: 40,
  },
  similarTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  similarGenre: {
    fontSize: 12,
    color: '#888',
  },
  pricingModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  pricingContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    color: '#888',
    fontSize: 20,
  },
  pricingOptions: {
    gap: 12,
    marginBottom: 20,
  },
  pricingOption: {
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pricingOptionSelected: {
    borderColor: '#FFEAA7',
  },
  pricingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingOptionType: {
    fontSize: 16,
    fontWeight: '600',
  },
  pricingOptionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFEAA7',
  },
  pricingOptionFeatures: {
    gap: 4,
  },
  pricingOptionFeature: {
    color: '#ccc',
    fontSize: 13,
  },
  selectedCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEAA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000',
    fontWeight: '700',
  },
  purchaseButton: {
    backgroundColor: '#FFEAA7',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  passNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
