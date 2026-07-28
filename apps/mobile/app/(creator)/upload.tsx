import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { contentApi, type ContentItem } from '../../src/api/content';
import { colors, typography, spacing, radius } from '../../src/theme';

type ContentType = 'video' | 'image' | 'audio';

interface UploadForm {
  title: string;
  description: string;
  contentType: ContentType;
  universe: string;
  selectedFile: ContentType | null;
}

const UNIVERSES = [
  { id: 'comedy', name: 'Comedy', icon: '🎭' },
  { id: 'reality', name: 'Reality', icon: '📺' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' },
  { id: 'vertical', name: 'Vertical', icon: '📖' },
];

const CONTENT_TYPES: { id: ContentType; label: string; icon: string }[] = [
  { id: 'video', label: 'Video', icon: '🎥' },
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
];

export default function UploadScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    contentType: 'video',
    universe: '',
    selectedFile: null,
  });
  const [existingContent, setExistingContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UploadForm, string>>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    loadContent();
  }, [isAuthenticated]);

  const loadContent = async () => {
    try {
      const response = await contentApi.getCreatorContent();
      if (response.success && response.data) {
        setExistingContent(response.data as unknown as ContentItem[]);
      }
    } catch {
      // silently fail - content list is supplementary
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadContent();
    setIsRefreshing(false);
  }, []);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UploadForm, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.universe) newErrors.universe = 'Please select a universe';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validate()) return;
    setIsUploading(true);
    try {
      const response = await contentApi.createContent({
        title: form.title.trim(),
        description: form.description.trim(),
        contentType: form.contentType,
        universe: form.universe,
      });

      if (response.success) {
        Alert.alert('Upload Started', 'Your content has been created and is being processed.');
        setForm({
          title: '',
          description: '',
          contentType: 'video',
          universe: '',
          selectedFile: null,
        });
        await loadContent();
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      Alert.alert(
        'Upload Failed',
        err instanceof Error ? err.message : 'An error occurred while uploading. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFile = () => {
    Alert.alert(
      'Select File',
      'File selection requires expo-image-picker or expo-document-picker. Install with: npx expo install expo-document-picker',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return colors.success[500];
      case 'processing':
        return colors.warning[500];
      case 'draft':
        return colors.text.tertiary;
      case 'archived':
        return colors.error[500];
      default:
        return colors.text.tertiary;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Content</Text>
          <Text style={styles.subtitle}>Share your content with the Azeebo+ community</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Content Type</Text>
          <View style={styles.contentTypeRow}>
            {CONTENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.contentTypeButton,
                  form.contentType === type.id && styles.contentTypeButtonActive,
                ]}
                onPress={() => setForm({ ...form, contentType: type.id })}
              >
                <Text style={styles.contentTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.contentTypeLabel,
                    form.contentType === type.id && styles.contentTypeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filePickerArea}>
            <TouchableOpacity style={styles.filePickerButton} onPress={handleSelectFile}>
              <Text style={styles.filePickerIcon}>{form.selectedFile ? '📁' : '📤'}</Text>
              <Text style={styles.filePickerText}>
                {form.selectedFile ? 'File selected — tap to change' : 'Tap to select a file'}
              </Text>
              <Text style={styles.filePickerHint}>
                {form.contentType === 'video'
                  ? 'MP4, MOV, AVI (max 2GB)'
                  : form.contentType === 'image'
                    ? 'JPG, PNG, WebP (max 50MB)'
                    : 'MP3, AAC, WAV (max 500MB)'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Enter a catchy title for your content"
            placeholderTextColor={colors.text.tertiary}
            value={form.title}
            onChangeText={(text) => {
              setForm({ ...form, title: text });
              setErrors({ ...errors, title: undefined });
            }}
            maxLength={120}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your content..."
            placeholderTextColor={colors.text.tertiary}
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            multiline
            numberOfLines={4}
            maxLength={2000}
          />

          <Text style={styles.sectionLabel}>Universe</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.universeScroll}
          >
            <TouchableOpacity
              style={[styles.universeChip, !form.universe && styles.universeChipActive]}
              onPress={() => setForm({ ...form, universe: '' })}
            >
              <Text
                style={[styles.universeChipText, !form.universe && styles.universeChipTextActive]}
              >
                All
              </Text>
            </TouchableOpacity>
            {UNIVERSES.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.universeChip, form.universe === u.id && styles.universeChipActive]}
                onPress={() => setForm({ ...form, universe: u.id })}
              >
                <Text style={styles.universeChipIcon}>{u.icon}</Text>
                <Text
                  style={[
                    styles.universeChipText,
                    form.universe === u.id && styles.universeChipTextActive,
                  ]}
                >
                  {u.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.universe && <Text style={styles.errorText}>{errors.universe}</Text>}

          <TouchableOpacity
            style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.uploadButtonIcon}>⬆️</Text>
                <Text style={styles.uploadButtonText}>Upload Content</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.existingSection}>
          <Text style={styles.sectionTitle}>Your Uploads</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
          ) : existingContent.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No uploads yet</Text>
              <Text style={styles.emptySubtext}>Your uploaded content will appear here</Text>
            </View>
          ) : (
            <View style={styles.uploadsList}>
              {existingContent.map((item) => (
                <View key={item.id} style={styles.uploadItem}>
                  <View style={styles.uploadItemInfo}>
                    <Text style={styles.uploadItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.uploadItemDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + '20' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  formSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contentTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contentTypeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  contentTypeButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '15',
  },
  contentTypeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  contentTypeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  contentTypeLabelActive: {
    color: colors.primary[500],
  },
  filePickerArea: {
    marginTop: spacing.xs,
  },
  filePickerButton: {
    borderWidth: 2,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary + '80',
  },
  filePickerIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  filePickerText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  filePickerHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.error[500],
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  universeScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  universeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.tertiary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  universeChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500] + '20',
  },
  universeChipIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  universeChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  universeChipTextActive: {
    color: colors.primary[500],
    fontWeight: typography.fontWeight.semibold,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonIcon: {
    fontSize: 18,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  existingSection: {
    padding: spacing.lg,
  },
  loader: {
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  uploadsList: {
    gap: spacing.sm,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.tertiary,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  uploadItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  uploadItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  uploadItemDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  bottomPadding: {
    height: 40,
  },
});
