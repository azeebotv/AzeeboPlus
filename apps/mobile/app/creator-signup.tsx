import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreatorSignupScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = [
    { id: 'comedian', name: 'Comedian', icon: '😂' },
    { id: 'musician', name: 'Musician', icon: '🎤' },
    { id: 'actor', name: 'Actor', icon: '🎭' },
    { id: 'influencer', name: 'Influencer', icon: '⭐' },
    { id: 'filmmaker', name: 'Filmmaker', icon: '🎬' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push('/creator-dashboard');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Your Category</Text>
      <Text style={styles.stepDescription}>Select the category that best describes your content</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryCard,
              category === cat.id && styles.categoryCardSelected,
            ]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryName,
              category === cat.id && styles.categoryNameSelected
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Create Your Handle</Text>
      <Text style={styles.stepDescription}>Choose a unique username for your creator profile</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>@</Text>
        <TextInput
          style={[styles.input, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
          placeholder="username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      <Text style={styles.inputHint}>Username can contain letters, numbers, and underscores</Text>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>About You</Text>
      <Text style={styles.stepDescription}>Tell your audience what makes you unique</Text>
      <TextInput
        style={[styles.bioInput, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}
        placeholder="Write a short bio..."
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={300}
      />
      <Text style={styles.charCount}>{description.length}/300</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          Become a Creator
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              step >= s && styles.progressStepActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backStepText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, step === 1 && !category && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={step === 1 && !category}
        >
          <Text style={styles.nextButtonText}>{step === 3 ? 'Complete' : 'Next'}</Text>
        </TouchableOpacity>
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
    paddingTop: 40,
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
  placeholder: {
    width: 40,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  progressStepActive: {
    backgroundColor: '#8B5CF6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  categoryNameSelected: {
    color: '#8B5CF6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputPrefix: {
    fontSize: 18,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  bioInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#1a1a1a',
  },
  backStepButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backStepText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#333',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
