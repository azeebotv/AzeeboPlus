import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/theme';
import { moderationApi, ReportReason } from '@azeebo/react-data/api/moderation';
import { LoadingState, ErrorState, SuccessState } from '../../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';

const REPORT_REASONS: ReportReason[] = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'harassment', label: 'Harassment or hate' },
  { id: 'violence', label: 'Violence or dangerous' },
  { id: 'nudity', label: 'Nudity or sexual' },
  { id: 'copyright', label: 'Copyright violation' },
  { id: 'misinformation', label: 'Misinformation' },
  { id: 'scam', label: 'Scam or fraud' },
  { id: 'other', label: 'Other' },
];

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { contentType, contentId, contentTitle } = useLocalSearchParams<{
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
  }>();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await moderationApi.getReportReasons();
      if (response.success && response.data && response.data.length > 0) {
        // Use server reasons if available, otherwise fallback to local
      }
    } catch (err) {
      logger.error('Failed to load report reasons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    if (!contentId || !contentType) {
      Alert.alert('Error', 'Missing content information');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await moderationApi.submitReport({
        contentType,
        contentId,
        reasonId: selectedReason,
        description,
      });

      if (response.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to submit report:', err);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <ErrorState description={error} onRetry={loadReasons} />
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <SuccessState
          title="Report Submitted"
          description="Thank you for helping keep our community safe. We will review your report shortly."
          actionText="Done"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
          ]}
        >
          Report Content
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {contentTitle ? (
          <View style={styles.contentPreview}>
            <Text style={[styles.contentPreviewLabel, { color: colors.text.secondary }]}>
              Reporting:
            </Text>
            <Text
              style={[
                styles.contentPreviewTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
              ]}
              numberOfLines={2}
            >
              {contentTitle}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
          >
            Why are you reporting this?
          </Text>
          <Text style={styles.sectionSubtitle}>
            Select the reason that best describes the issue.
          </Text>

          <View style={styles.reasonsList}>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                  {
                    backgroundColor:
                      selectedReason === reason.id
                        ? colors.primary[500] + '20'
                        : colorScheme === 'dark'
                          ? colors.bg.secondary
                          : colors.light[50],
                  },
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <View style={[styles.radio, selectedReason === reason.id && styles.radioSelected]}>
                  {selectedReason === reason.id && <View style={styles.radioDot} />}
                </View>
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.id && styles.reasonTextSelected,
                    {
                      color:
                        selectedReason === reason.id
                          ? colors.primary[500]
                          : colorScheme === 'dark'
                            ? colors.text.primary
                            : colors.bg.primary,
                    },
                  ]}
                >
                  {reason.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
            ]}
          >
            Additional details (optional)
          </Text>
          <Text style={styles.sectionSubtitle}>
            Provide more context to help our team review faster.
          </Text>

          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
                color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason || isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentPreview: {
    padding: 16,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    marginBottom: 24,
  },
  contentPreviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    borderColor: colors.primary[500],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: colors.primary[500],
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  reasonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  reasonTextSelected: {
    fontWeight: '600',
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.bg.tertiary,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});
