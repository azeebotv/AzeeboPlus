import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const interests = [
  { id: 'reality', icon: '🎭', label: 'Reality TV' },
  { id: 'creators', icon: '🎤', label: 'Creators' },
  { id: 'lifestyle', icon: '✨', label: 'Lifestyle' },
  { id: 'vertical', icon: '🏰', label: 'Vertical' },
  { id: 'movies', icon: '🎬', label: 'Movies' },
  { id: 'games', icon: '🎮', label: 'Games' },
  { id: 'comedy', icon: '😂', label: 'Comedy' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'music', icon: '🎵', label: 'Music' },
  { id: 'news', icon: '📰', label: 'News' },
  { id: 'tech', icon: '💻', label: 'Tech' },
  { id: 'food', icon: '🍔', label: 'Food' },
];

export default function OnboardingInterestsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

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

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          What interests you?
        </Text>
        <Text style={styles.subtitle}>
          Select at least 3 topics to personalize your experience
        </Text>
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
              <Text style={[styles.interestLabel, selectedInterests.includes(interest.id) && { color: '#ffffff' }]}>
                {interest.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.progressText}>
          {selectedInterests.length} selected
          {selectedInterests.length >= 3 && (
            <Text style={styles.progressComplete}> - Ready!</Text>
          )}
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
