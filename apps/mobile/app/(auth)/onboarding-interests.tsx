import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

export default function OnboardingInterestsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [interests, setInterests] = useState<Array<{ id: string; icon: string; label: string }>>(
    []
  );
  const [isLoadingInterests, setIsLoadingInterests] = useState(true);
  const [interestsError, setInterestsError] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    setIsLoadingInterests(true);
    setInterestsError(null);
    try {
      const res =
        await apiClient.get<Array<{ id: string; icon: string; label: string }>>('/user/interests');
      setInterests(res);
    } catch {
      setInterestsError('Failed to load interests');
    } finally {
      setIsLoadingInterests(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleContinue = async () => {
    try {
      await apiClient.post('/users/me/complete-profile', { interests: selectedInterests });
    } catch (error) {
      logger.error('Failed to save interests:', error);
    }
    router.replace('/(tabs)/home');
  };

  if (isLoadingInterests) {
    return (
      <SafeAreaView accessibilityLabel="Onboarding Interests Screen" style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <LoadingState text="Loading interests..." />
      </SafeAreaView>
    );
  }

  if (interestsError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
        <ErrorState description={interestsError} onRetry={fetchInterests} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          What interests you?
        </Text>
        <Text style={styles.subtitle}>Select at least 3 topics to personalize your experience</Text>
      </View>

      <ScrollView style={styles.interestsScroll}>
        <View style={styles.interestsGrid}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              onPress={() => toggleInterest(interest.id)}
              style={[
                styles.interestButton,
                selectedInterests.includes(interest.id) && { backgroundColor: brand.flame },
              ]}
            >
              <Text style={styles.interestIcon}>{interest.icon}</Text>
              <Text
                style={[
                  styles.interestLabel,
                  selectedInterests.includes(interest.id) && { color: '#ffffff' },
                ]}
              >
                {interest.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {selectedInterests.length} selected
          {selectedInterests.length >= 3 && <Text style={styles.progressComplete}> - Ready!</Text>}
        </Text>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedInterests.length < 3}
          style={[
            styles.continueButton,
            selectedInterests.length < 3 && { backgroundColor: colors.neutral[300] },
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    flexDirection: 'column',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  interestsScroll: {
    flex: 1,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestButton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestIcon: {
    fontSize: 24,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  progressComplete: {
    color: '#10B981',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: brand.flame,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
