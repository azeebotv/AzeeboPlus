import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme';
import { apiClient } from '../src/api/client';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { defaultImages } from '../src/theme';

const PLACEHOLDER_IMAGE = defaultImages.thumbnail;

interface City {
  id: string;
  name: string;
  country: string;
  icon: string;
  events: number;
  color: string;
}

interface Event {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  price: string;
  category: string;
  interested: number;
}


export default function CityGuideScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['All', 'Music', 'Tech', 'Food', 'Sports', 'Arts'];

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const response = await apiClient.get<City[]>('/v1/lifestyle/cities');
      setCities(response || []);
      if (response && response.length > 0) {
        setSelectedCity(response[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cities');
    }
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Event[]>(
        `/v1/lifestyle/events?cityId=${selectedCity}&limit=20`
      );
      setEvents(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : '#FFFFFF' },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>City Guide</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {isLoading && <LoadingState text="Loading events..." />}
        {error && <ErrorState title="Failed to load" description={error} onRetry={loadEvents} />}

        {!isLoading && !error && (
        <>
        <View style={styles.citySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cityScroll}
          >
            {cities.map((city) => (
              <TouchableOpacity
                key={city.id}
                onPress={() => setSelectedCity(city.id)}
                style={[
                  styles.cityButton,
                  selectedCity === city.id && { backgroundColor: city.color },
                ]}
              >
                <Text style={styles.cityIcon}>{city.icon}</Text>
                <Text style={[styles.cityName, selectedCity === city.id && { color: '#ffffff' }]}>
                  {city.name}
                </Text>
                <Text style={[styles.cityEvents, selectedCity === city.id && { color: '#ffffff' }]}>
                  {city.events} events
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.categorySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Featured Events
            </Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {events.map((event) => (
              <TouchableOpacity key={event.id} style={styles.featuredCard}>
                <Image source={{ uri: PLACEHOLDER_IMAGE }} style={styles.featuredImage} />
                <View style={styles.featuredOverlay}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{event.category}</Text>
                  </View>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={[styles.featuredTitle, { color: colors.text.primary }]}>
                    {event.title}
                  </Text>
                  <Text style={styles.featuredSubtitle}>{event.subtitle}</Text>
                  <View style={styles.featuredMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>📅</Text>
                      <Text style={styles.metaText}>{event.date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>📍</Text>
                      <Text style={styles.metaText}>{event.location}</Text>
                    </View>
                  </View>
                  <View style={styles.featuredFooter}>
                    <Text style={styles.featuredPrice}>{event.price}</Text>
                    <View style={styles.interestedBadge}>
                      <Text style={styles.interestedIcon}>👥</Text>
                      <Text style={styles.interestedText}>{event.interested}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.upcomingSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Upcoming Events</Text>
          <View style={styles.eventsList}>
            {events.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard}>
                <Image source={{ uri: PLACEHOLDER_IMAGE }} style={styles.eventImage} />
                <View style={styles.eventInfo}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, { color: colors.text.primary }]}>
                      {event.title}
                    </Text>
                    <View style={styles.eventCategory}>
                      <Text style={styles.eventCategoryText}>{event.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                  <View style={styles.eventMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>📅</Text>
                      <Text style={styles.metaText}>
                        {event.date} • {event.time}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>📍</Text>
                      <Text style={styles.metaText}>{event.location}</Text>
                    </View>
                  </View>
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventPrice}>{event.price}</Text>
                    <TouchableOpacity style={styles.interestButton}>
                      <Text style={styles.interestButtonText}>I'm Interested</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text.primary,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  citySelector: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cityScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  cityButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.bg.secondary,
    minWidth: 120,
    alignItems: 'center',
  },
  cityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cityName: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cityEvents: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  categorySelector: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bg.secondary,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[500],
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  featuredSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: colors.primary[500],
    fontSize: 14,
    fontWeight: '500',
  },
  featuredScroll: {
    flexDirection: 'row',
    gap: 16,
  },
  featuredCard: {
    width: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
  },
  featuredImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 12,
  },
  featuredMeta: {
    gap: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    color: colors.primary[500],
    fontSize: 18,
    fontWeight: '700',
  },
  interestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestedIcon: {
    fontSize: 12,
  },
  interestedText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  eventsList: {
    gap: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  eventInfo: {
    flex: 1,
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  eventCategory: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventCategoryText: {
    color: colors.primary[500],
    fontSize: 11,
    fontWeight: '600',
  },
  eventSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 8,
  },
  eventMeta: {
    gap: 6,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPrice: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '700',
  },
  interestButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  interestButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
