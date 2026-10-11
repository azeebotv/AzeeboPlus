import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, contentApi, mediaApi } from '@azeebo/react-data';
import { mediaFingerprint } from '@azeebo/react-data/utils/mediaCache';
import { logger } from '@azeebo/react-data/utils/logger';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { colors } from '../../src/theme';
import { brand } from '@azeebo/design-tokens';

const uploadOptions = [
  { id: 'video', name: 'Video', icon: '📹', color: colors.error[500] },
  { id: 'image', name: 'Image', icon: '📷', color: colors.category.teal },
  { id: 'live', name: 'Live Stream', icon: '🎥', color: colors.category.blue },
  { id: 'story', name: 'Story', icon: '📖', color: colors.category.mint },
];

// MOB-10-04: Only offer privacy options supported by content-service.
// "Public" is the standard published item, "Premium" gates behind the premium window.
// "Private" and "Unlisted" are deferred until server-side ACL/direct link authorization
// is implemented in content.repository.ts.
const privacyOptions = [
  { id: 'public', name: 'Public' },
  { id: 'premium', name: 'Premium' },
];

interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const [selectedType, setSelectedType] = useState('video');
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
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
      // Content creation requires a UUID universeId that the content-service
      // recognizes, so this list comes from GET /v1/public/universes (enabled
      // universes with their real ids) — NOT the vertical-service universeMap
      // endpoint, whose slug ids the content DB doesn't know about. This is
      // the same source the web upload page uses.
      const res = await apiClient.get<{
        success: boolean;
        data: { id: string; name: string; displayName: string; icon?: string | null }[];
      }>('/v1/public/universes');
      if (res.success && Array.isArray(res.data)) {
        setUniverseOptions(
          res.data.map((u) => ({
            id: u.id,
            name: u.displayName || u.name,
            icon: u.icon || '🌐',
          }))
        );
      }
    } catch (err: unknown) {
      setUniversesError(err instanceof Error ? err.message : 'Failed to load universes');
    } finally {
      setIsLoadingUniverses(false);
    }
  };

  useEffect(() => {
    fetchUniverses();
  }, []);

  const pickFile = async () => {
    try {
      if (selectedType === 'image') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setSelectedFile({
            uri: asset.uri,
            name: asset.fileName || `image.${asset.uri.split('.').pop() || 'jpg'}`,
            type: asset.mimeType || 'image/jpeg',
          });
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: selectedType === 'video' ? 'video/*' : '*/*',
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setSelectedFile({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
            size: asset.size,
          });
        }
      }
    } catch (err) {
      logger.error('File picker error:', err);
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const handleUpload = async () => {
    if (!selectedUniverse) {
      Alert.alert('Error', 'Please select a universe');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const isPremium = privacy === 'premium';
      const isPublicFeed = privacy === 'public' || privacy === 'premium';
      // The create endpoint always stores drafts; the item is published right
      // after so it lands in the public feeds (unless visibility-restricted).
      const metadata = isPublicFeed ? undefined : { visibility: privacy };
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Images are `immutable` on the media service: uploading the same image
      // again (retry after a failure, or re-publishing the same file) skips
      // the network upload entirely via the media cache and reuses the cached
      // object URL. Videos/stories/live go through the multipart helper.
      let publishedId: string | null = null;
      if (selectedType === 'image') {
        const formData = new FormData();
        formData.append('file', {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.name,
        } as unknown as Blob);
        const upload = await mediaApi.uploadImage(formData, {
          fingerprint: mediaFingerprint(selectedFile),
        });
        if (!upload.success || !upload.data) {
          throw new Error((upload.error as unknown as string) || 'Failed to upload image');
        }
        const contentResult = await contentApi.createContent({
          title: title.trim(),
          description: description.trim() || undefined,
          universe: selectedUniverse,
          contentType: 'image',
          mediaUrl: upload.data.url,
          isPremium,
          tags: tagList,
          metadata,
        });
        if (!contentResult.success || !contentResult.data) {
          throw new Error(contentResult.message || 'Failed to publish content');
        }
        publishedId = contentResult.data.id;
      } else {
        const result = await contentApi.createContentWithFile({
          title: title.trim(),
          description: description.trim() || undefined,
          universe: selectedUniverse,
          contentType: selectedType,
          fileUri: selectedFile.uri,
          fileType: selectedFile.type,
          fileName: selectedFile.name,
        });
        if (!result.success || !result.data) {
          Alert.alert(
            'Upload Failed',
            (result.error as unknown as string) || 'Failed to upload content'
          );
          return;
        }
        publishedId = result.data.id;
      }

      // Visibility-restricted items keep the draft status (they are excluded
      // from the public home/watch feeds, which list published content).
      let publishSuccess = true;
      if (publishedId && isPublicFeed) {
        const publishResult = await contentApi.publishContentItem(publishedId);
        if (!publishResult.success) {
          publishSuccess = false;
          logger.warn('Content created but publish failed', undefined, { contentId: publishedId });
        }
      }

      if (!publishSuccess) {
        Alert.alert(
          'Upload Succeeded (Draft Saved)',
          'Your content was uploaded successfully, but could not be published to public feeds right now. It has been saved as a draft.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Success', 'Content published successfully!', [{ text: 'OK' }]);
      }
      setTitle('');
      setDescription('');
      setSelectedUniverse(null);
      setSelectedFile(null);
      setPrivacy('public');
      setTags('');
    } catch (err) {
      logger.error('Failed to upload content:', err);
      Alert.alert(
        'Upload Error',
        err instanceof Error ? err.message : 'Failed to upload content. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => setSelectedFile(null);

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

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#1A0A0A' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1A0A0A';
  const inputBg = isDark ? '#1a1a1a' : '#f5f5f5';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Create</Text>
        </View>

        <View style={styles.uploadTypeSection}>
          <Text style={[styles.sectionLabel, { color: textColor }]}>Select Type</Text>
          <View style={styles.uploadOptionsGrid}>
            {uploadOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => {
                  setSelectedType(option.id);
                  setSelectedFile(null);
                }}
                style={[
                  styles.uploadOption,
                  selectedType === option.id && {
                    borderColor: option.color,
                    backgroundColor: `${option.color}20`,
                  },
                ]}
              >
                <Text style={styles.uploadIcon}>{option.icon}</Text>
                <Text style={[styles.uploadName, { color: textColor }]}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.uploadArea}>
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <Text style={styles.selectedFileIcon}>
                {selectedType === 'video' ? '🎬' : selectedType === 'image' ? '🖼️' : '📄'}
              </Text>
              <Text style={styles.selectedFileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              {selectedFile.size && (
                <Text style={styles.selectedFileSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </Text>
              )}
              <TouchableOpacity onPress={removeFile} style={styles.removeFileButton}>
                <Text style={styles.removeFileText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={pickFile} style={styles.uploadButton}>
              <Text style={styles.uploadIconLarge}>📤</Text>
              <Text style={[styles.uploadText, { color: textColor }]}>
                Tap to Select{' '}
                {selectedType === 'video' ? 'Video' : selectedType === 'image' ? 'Image' : 'File'}
              </Text>
              <Text style={styles.uploadHint}>
                {selectedType === 'image' ? 'From gallery' : 'From device storage'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Title</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="Enter title..."
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Description</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="Add description..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Tags (comma separated)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="e.g. comedy, nollywood, music"
              placeholderTextColor="#888"
              value={tags}
              onChangeText={setTags}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: textColor }]}>Universe</Text>
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
                    selectedUniverse === universe.id && { backgroundColor: brand.flame },
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
          <Text style={[styles.sectionLabel, { color: textColor }]}>Privacy Settings</Text>
          <View style={styles.privacyOptions}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setPrivacy(option.id)}
                style={[
                  styles.privacyButton,
                  privacy === option.id && { backgroundColor: brand.flame },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: privacy === option.id }}
              >
                <Text style={[styles.privacyText, privacy === option.id && { color: '#ffffff' }]}>
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.privacyHint, { color: colors.text.secondary }]}>
            {privacy === 'public' && 'Visible to everyone in feeds and search.'}
            {privacy === 'premium' && 'Only subscribers with a premium window can watch.'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={isUploading}
          style={[styles.submitButton, isUploading && { backgroundColor: colors.neutral[600] }]}
        >
          {isUploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.submitButtonText}> Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Publish</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tipsSection}>
          <Text style={[styles.tipsTitle, { color: textColor }]}>Tips for Creators</Text>
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
    backgroundColor: colors.bg.surfaceLight,
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
    borderColor: brand.flame,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: colors.bg.surfaceLight,
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
    color: colors.text.secondary,
  },
  selectedFileContainer: {
    borderWidth: 2,
    borderColor: colors.category.teal,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.bg.surfaceLight,
  },
  selectedFileIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
    maxWidth: '80%',
  },
  selectedFileSize: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  removeFileButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.error[500],
  },
  removeFileText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: colors.neutral[100],
  },
  universeIcon: {
    fontSize: 16,
  },
  universeName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[800],
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
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  privacyHint: {
    fontSize: 12,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: brand.flame,
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
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsSection: {
    backgroundColor: colors.bg.surfaceLight,
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
    color: colors.text.tertiary,
    lineHeight: 20,
  },
});
