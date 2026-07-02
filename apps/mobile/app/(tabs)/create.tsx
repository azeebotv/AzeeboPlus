import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { universeApi, contentApi } from '../../src/api';
import { logger } from '../../src/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';

const uploadOptions = [
  { id: 'video', name: 'Video', icon: '📹', color: '#FF6B6B' },
  { id: 'image', name: 'Image', icon: '📷', color: '#4ECDC4' },
  { id: 'live', name: 'Live Stream', icon: '🎥', color: '#45B7D1' },
  { id: 'story', name: 'Story', icon: '📖', color: '#96CEB4' },
];

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const [selectedType, setSelectedType] = useState('video');
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [universeOptions, setUniverseOptions] = useState<
    { id: string; name: string; icon: string }[]
  >([]);
  const [isLoadingUniverses, setIsLoadingUniverses] = useState(true);
  const [universesError, setUniversesError] = useState<string | null>(null);

  const fetchUniverses = async () => {
    setIsLoadingUniverses(true);
    setUniversesError(null);
    try {
      const res = await universeApi.getUniverses();
      if (res.success && res.data) {
        setUniverseOptions(
          res.data.items.map((u: any) => ({
            id: u.slug || u.id,
            name: u.name,
            icon: '🌐',
          }))
        );
      }
    } catch (err: any) {
      setUniversesError(err.message || 'Failed to load universes');
    } finally {
      setIsLoadingUniverses(false);
    }
  };

  useEffect(() => {
    fetchUniverses();
  }, []);

  const handleUpload = async () => {
    if (!selectedUniverse) {
      Alert.alert('Error', 'Please select a universe');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsUploading(true);
    try {
      const result = await contentApi.createContent({
        title: title.trim(),
        description: description.trim() || undefined,
        universe: selectedUniverse,
        contentType: selectedType,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Content created! Note: File upload is not yet available in the mobile app. Please use the web app to upload media files.',
          [{ text: 'OK' }]
        );
        setTitle('');
        setDescription('');
        setSelectedUniverse(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to create content');
      }
    } catch (err) {
      logger.error('Failed to upload content:', err);
      Alert.alert('Error', 'Failed to upload content. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoadingUniverses) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <LoadingState text="Loading universe options..." />
      </SafeAreaView>
    );
  }

  if (universesError) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <ErrorState
          title="Failed to load content options"
          description={universesError}
          onRetry={fetchUniverses}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' }]}
    >
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? '#1A0A0A' : '#ffffff' },
        ]}
      >
        <View style={styles.header}>
          <Text
            style={[styles.headerTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Create
          </Text>
        </View>

        <View style={styles.uploadTypeSection}>
          <Text
            style={[styles.sectionLabel, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Select Type
          </Text>
          <View style={styles.uploadOptionsGrid}>
            {uploadOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedType(option.id)}
                style={[
                  styles.uploadOption,
                  selectedType === option.id && {
                    borderColor: option.color,
                    backgroundColor: `${option.color}20`,
                  },
                ]}
              >
                <Text style={styles.uploadIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.uploadName,
                    { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' },
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.uploadArea}>
          <View style={styles.uploadButton}>
            <Text style={styles.uploadIconLarge}>📤</Text>
            <Text
              style={[styles.uploadText, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
            >
              {selectedType === 'video' ? 'Video' : selectedType === 'image' ? 'Image' : 'Content'}{' '}
              Upload
            </Text>
            <Text style={styles.uploadHint}>
              File upload is currently only available on the web app.
            </Text>
            <Text style={styles.uploadHint}>Use the web app to upload media files.</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text
              style={[styles.formLabel, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
            >
              Title
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A',
                },
              ]}
              placeholder="Enter title..."
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text
              style={[styles.formLabel, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
            >
              Description
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A',
                },
              ]}
              placeholder="Add description..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text
              style={[styles.formLabel, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
            >
              Universe
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.universeScroll}
            >
              {universeOptions.map((universe) => (
                <TouchableOpacity
                  key={universe.id}
                  onPress={() =>
                    setSelectedUniverse(selectedUniverse === universe.id ? null : universe.id)
                  }
                  style={[
                    styles.universeButton,
                    selectedUniverse === universe.id && { backgroundColor: '#E8420A' },
                  ]}
                >
                  <Text style={styles.universeIcon}>{universe.icon}</Text>
                  <Text
                    style={[
                      styles.universeName,
                      selectedUniverse === universe.id && { color: '#ffffff' },
                    ]}
                  >
                    {universe.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.privacySection}>
          <Text
            style={[styles.sectionLabel, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            Privacy Settings
          </Text>
          <View style={styles.privacyOptions}>
            {['Public', 'Private', 'Unlisted'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.privacyButton,
                  option === 'Public' && { backgroundColor: '#E8420A' },
                ]}
              >
                <Text style={[styles.privacyText, option === 'Public' && { color: '#ffffff' }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={isUploading}
          style={[styles.submitButton, isUploading && { backgroundColor: '#ccc' }]}
        >
          <Text style={styles.submitButtonText}>{isUploading ? 'Uploading...' : 'Publish'}</Text>
        </TouchableOpacity>

        <View style={styles.tipsSection}>
          <Text
            style={[styles.tipsTitle, { color: colorScheme === 'dark' ? '#ffffff' : '#1A0A0A' }]}
          >
            💡 Tips for Creators
          </Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Use high-quality video for better engagement</Text>
            <Text style={styles.tipItem}>• Add relevant tags to reach more viewers</Text>
            <Text style={styles.tipItem}>• Engage with your audience in comments</Text>
            <Text style={styles.tipItem}>• Post consistently to build your following</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  uploadTypeSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  uploadOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadOption: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  uploadIcon: {
    fontSize: 24,
  },
  uploadName: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadArea: {
    marginBottom: 20,
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E8420A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f5f0ff',
  },
  uploadIconLarge: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#888',
  },
  formSection: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  universeScroll: {
    flexDirection: 'row',
    gap: 10,
  },
  universeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  universeIcon: {
    fontSize: 16,
  },
  universeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#E8420A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
  },
});
