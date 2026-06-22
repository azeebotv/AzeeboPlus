import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

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

  const handleContinue = () => {
    router.replace('/(tabs)/home');
  };

  if (isLoadingInterests) {
    return <LoadingState text="Loading interests..." />;
  }

  if (interestsError) {
    return <ErrorState description={interestsError} onRetry={fetchInterests} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
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
                selectedInterests.includes(interest.id) && { backgroundColor: '#8B5CF6' },
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
            selectedInterests.length < 3 && { backgroundColor: '#ccc' },
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    color: '#888',
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
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  interestIcon: {
    fontSize: 24,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    marginTop: 24,
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  progressComplete: {
    color: '#10B981',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
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
