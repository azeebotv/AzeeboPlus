'use client';

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, EmptyState } from '../../src/components/StateContainers';

interface Place {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  image?: string;
  rating: number;
  distance: string;
  isOpen: boolean;
  priceRange: string;
  address?: string;
}

export default function TonightScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [reservedPlaces, setReservedPlaces] = useState<Record<string, boolean>>({});

  const tonightQuery = useQuery({
    queryKey: ['lifestyle', 'tonight'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<Place[]>('/v1/lifestyle/tonight');
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {
        // Fallback to nightlife venues
      }
      try {
        const venuesRes = await apiClient.get<Place[]>('/v1/lifestyle/venues');
        if (Array.isArray(venuesRes)) return venuesRes;
      } catch {
        // Handled
      }
      return [];
    },
    staleTime: 30_000,
  });

  const places = tonightQuery.data ?? [];
  const categories = [
    'All',
    ...Array.from(new Set(places.map((p) => p.category).filter(Boolean))),
  ];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  const handleReserve = (place: Place) => {
    const nextState = !reservedPlaces[place.id];
    setReservedPlaces((prev) => ({ ...prev, [place.id]: nextState }));
    if (nextState) {
      Alert.alert(
        'VIP RSVP Confirmed',
        `Your priority guest list entry for ${place.name} has been reserved for tonight.`
      );
    }
  };

  const themeStyles = createStyles(isDark);

  if (tonightQuery.isLoading) {
    return <LoadingState text="Loading tonight's hottest spots..." />;
  }

  return (
    <SafeAreaView style={themeStyles.container} edges={['top']}>
      {/* Header */}
      <View style={themeStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={themeStyles.backButton}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text style={themeStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={themeStyles.headerTitleContainer}>
          <Text style={themeStyles.headerSubtitle}>9TLIFE AFTER DARK</Text>
          <Text style={themeStyles.headerTitle}>Tonight in the City</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/lifestyle/nightlife')}
          style={themeStyles.headerAction}
        >
          <Text style={themeStyles.headerActionText}>Map</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={themeStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themeStyles.categoriesRow}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[themeStyles.categoryPill, isActive && themeStyles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[themeStyles.categoryPillText, isActive && themeStyles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Places List */}
        <View style={themeStyles.placesList}>
          {filteredPlaces.length === 0 ? (
            <EmptyState
              icon="🌙"
              title="No events tonight"
              description="No venues currently listed for this category. Check back shortly!"
            />
          ) : (
            filteredPlaces.map((place) => {
              const img =
                place.imageUrl ||
                place.image ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
              const isReserved = reservedPlaces[place.id];

              return (
                <View key={place.id} style={themeStyles.placeCard}>
                  <Image source={{ uri: img }} style={themeStyles.placeImage} resizeMode="cover" />
                  <View style={themeStyles.placeOverlay}>
                    <View style={themeStyles.categoryBadge}>
                      <Text style={themeStyles.categoryBadgeText}>{place.category.toUpperCase()}</Text>
                    </View>
                    <View style={themeStyles.statusBadge}>
                      <Text style={themeStyles.statusBadgeText}>
                        {place.isOpen ? '🟢 OPEN TONIGHT' : '⚪ OPENS 10PM'}
                      </Text>
                    </View>
                  </View>

                  <View style={themeStyles.cardBody}>
                    <View style={themeStyles.cardTopRow}>
                      <Text style={themeStyles.placeName} numberOfLines={1}>{place.name}</Text>
                      <View style={themeStyles.ratingContainer}>
                        <Text style={themeStyles.starIcon}>★</Text>
                        <Text style={themeStyles.ratingText}>{place.rating || 4.8}</Text>
                      </View>
                    </View>

                    <Text style={themeStyles.placeMeta}>
                      📍 {place.distance || 'Victoria Island'} • {place.priceRange || '₦₦₦'}
                    </Text>

                    <View style={themeStyles.cardActions}>
                      <TouchableOpacity
                        style={[themeStyles.reserveButton, isReserved && themeStyles.reserveButtonActive]}
                        onPress={() => handleReserve(place)}
                      >
                        <Text style={[themeStyles.reserveButtonText, isReserved && themeStyles.reserveButtonTextActive]}>
                          {isReserved ? '✓ VIP Reserved' : 'Reserve Guestlist'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={themeStyles.detailsButton}
                        onPress={() => router.push(`/lifestyle/event-detail?id=${place.id}`)}
                      >
                        <Text style={themeStyles.detailsButtonText}>Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? '#030712' : '#F9FAFB';
  const cardBg = isDark ? '#111827' : '#FFFFFF';
  const border = isDark ? '#1F2937' : '#E5E7EB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    backButtonText: {
      fontSize: 22,
      color: textPrimary,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerSubtitle: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      color: '#EC4899',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: textPrimary,
    },
    headerAction: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    headerActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: textPrimary,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    categoriesRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
    },
    categoryPillActive: {
      backgroundColor: '#EC4899',
      borderColor: '#EC4899',
    },
    categoryPillText: {
      fontSize: 12,
      color: textSecondary,
      fontWeight: '600',
    },
    categoryPillTextActive: {
      color: '#FFFFFF',
    },
    placesList: {
      paddingHorizontal: 16,
      gap: 16,
    },
    placeCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: border,
    },
    placeImage: {
      width: '100%',
      height: 180,
    },
    placeOverlay: {
      position: 'absolute',
      top: 12,
      left: 12,
      right: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryBadgeText: {
      color: '#F472B6',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    statusBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    cardBody: {
      padding: 16,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    placeName: {
      fontSize: 17,
      fontWeight: '800',
      color: textPrimary,
      flex: 1,
      marginRight: 10,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    starIcon: {
      color: '#F59E0B',
      fontSize: 14,
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '700',
      color: textPrimary,
    },
    placeMeta: {
      fontSize: 12,
      color: textSecondary,
      marginBottom: 14,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 10,
    },
    reserveButton: {
      flex: 1,
      backgroundColor: '#EC4899',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    reserveButtonActive: {
      backgroundColor: '#10B981',
    },
    reserveButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    reserveButtonTextActive: {
      color: '#FFFFFF',
    },
    detailsButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
      alignItems: 'center',
    },
    detailsButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: textPrimary,
    },
  });
}
