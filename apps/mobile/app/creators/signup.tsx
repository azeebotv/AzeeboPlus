import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

const CATEGORY_OPTIONS = [
  { id: '1', label: 'Music', emoji: '🎵' },
  { id: '2', label: 'Dance', emoji: '💃' },
  { id: '3', label: 'Comedy', emoji: '😂' },
  { id: '4', label: 'Cooking', emoji: '🍳' },
  { id: '5', label: 'Fashion', emoji: '👗' },
  { id: '6', label: 'Vlogs', emoji: '📹' },
  { id: '7', label: 'Gaming', emoji: '🎮' },
  { id: '8', label: 'Art', emoji: '🎨' },
];

const CONTENT_TYPE_OPTIONS = [
  { id: '1', label: 'Short Videos' },
  { id: '2', label: 'Long-form Content' },
  { id: '3', label: 'Live Streams' },
  { id: '4', label: 'All of the above' },
];

export default function CreatorSignup() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    socialLink: '',
    goals: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && !selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (step === 2 && !selectedContentType) {
      Alert.alert('Error', 'Please select a content type');
      return;
    }
    if (step === 3 && !formData.displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Your creator application has been submitted!', [
        { text: 'OK', onPress: () => router.push('/creators/dashboard') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Become a Creator
        </Text>
      </View>

      <View style={styles.progressBar}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.progressItem, step >= s && styles.progressItemActive]}>
            <View style={[styles.progressCircle, step >= s && styles.progressCircleActive]}>
              <Text style={styles.progressNumber}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <View style={styles.content}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              What's your category?
            </Text>
            <Text style={styles.stepDesc}>Choose the category that best describes your content</Text>
            <View style={styles.optionsGrid}>
              {CATEGORY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                    selectedCategory === option.id && styles.optionCardActive,
                  ]}
                  onPress={() => setSelectedCategory(option.id)}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: isDark ? '#fff' : '#000' }]}>
                    {option.label}
                  </Text>
                  {selectedCategory === option.id && <View style={styles.checkmark} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              What type of content?
            </Text>
            <Text style={styles.stepDesc}>Select the type of content you plan to create</Text>
            <View style={styles.optionsList}>
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionListItem,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
                    selectedContentType === option.id && styles.optionListItemActive,
                  ]}
                  onPress={() => setSelectedContentType(option.id)}
                >
                  <Text style={[styles.optionListLabel, { color: isDark ? '#fff' : '#000' }]}>
                    {option.label}
                  </Text>
                  {selectedContentType === option.id && <View style={styles.checkmark} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Tell us about you
            </Text>
            <Text style={styles.stepDesc}>Complete your profile to get started</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Display Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
                placeholder="Enter your display name"
                placeholderTextColor="#888"
                value={formData.displayName}
                onChangeText={(text) => setFormData({ ...formData, displayName: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Bio</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
                placeholder="Tell your audience about yourself"
                placeholderTextColor="#888"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Social Link (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
                placeholder="Add your social media link"
                placeholderTextColor="#888"
                value={formData.socialLink}
                onChangeText={(text) => setFormData({ ...formData, socialLink: text })}
                keyboardType="url"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Goals (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
                placeholder="What do you want to achieve as a creator?"
                placeholderTextColor="#888"
                value={formData.goals}
                onChangeText={(text) => setFormData({ ...formData, goals: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        <View style={styles.buttonBar}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButtonMain}
              onPress={handleBack}
            >
              <Text style={styles.backButtonMainText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              { flex: step > 1 ? 1 : 1 },
            ]}
            onPress={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.nextButtonText}>
              {isSubmitting ? 'Submitting...' : step === 3 ? 'Submit Application' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    paddingTop: 50,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  progressItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#4ECDC4',
  },
  progressNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#2a2a2a',
  },
  progressLineActive: {
    backgroundColor: '#4ECDC4',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDesc: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#4ECDC4',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionListItemActive: {
    borderColor: '#4ECDC4',
  },
  optionListLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 30,
  },
  backButtonMain: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  backButtonMainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});