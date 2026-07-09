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
import { supportApi } from '../src/api/support';
import { apiClient } from '../src/api';
import { logger } from '../src/utils/logger';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { colors } from '../src/theme';

const categories = ['Account', 'Payment', 'Content', 'Technical', 'Creator'];

export default function SupportScreen() {
  const colorScheme = useColorScheme();
  const [faqData, setFaqData] = useState<Array<{ id: string; question: string; answer: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [_isSubmitting, setIsSubmitting] = useState(false);

  const fetchFAQ = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data =
        await apiClient.get<Array<{ id: string; question: string; answer: string }>>(
          '/support/faq'
        );
      setFaqData(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      logger.error('Failed to load FAQ:', err);
      const message = err instanceof Error ? err.message : 'Failed to load FAQ';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQ();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <LoadingState text="Loading support..." />
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
        <ErrorState description={error} onRetry={fetchFAQ} />
      </SafeAreaView>
    );
  }

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.category || !formData.message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supportApi.createTicket({
        subject: formData.subject,
        category: formData.category,
        message: formData.message,
        priority: 'medium',
      });

      if (response.success) {
        setFormSubmitted(true);
        Alert.alert(
          'Success',
          'Your support ticket has been submitted. We will get back to you soon!'
        );
      } else {
        Alert.alert('Error', 'Failed to submit ticket. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to submit support ticket:', err);
      Alert.alert('Error', 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
      ]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colorScheme === 'dark' ? colors.bg.primary : colors.text.primary },
        ]}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary }]}>
              How can we help you? 👋
            </Text>
            <Text style={styles.subtitle}>
              Find answers to common questions or contact our support team.
            </Text>
          </View>

          <View style={styles.quickLinks}>
            {[
              { icon: '📚', label: 'Help Center' },
              { icon: '📞', label: 'Contact Us' },
              { icon: '📋', label: 'Submit Ticket' },
              { icon: '💬', label: 'Live Chat' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.quickLinkCard,
                  { backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50] },
                ]}
                accessibilityLabel={item.label}
                accessibilityRole="button"
              >
                <Text style={styles.quickLinkIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.quickLinkLabel,
                    { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
              ]}
            >
              Frequently Asked Questions
            </Text>
            {faqData.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[
                  styles.faqCard,
                  { backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50] },
                ]}
                onPress={() => toggleFAQ(faq.id)}
                accessibilityLabel={`Frequently asked question: ${faq.question}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: expandedFAQ === faq.id }}
              >
                <View style={styles.faqHeader}>
                  <Text
                    style={[
                      styles.faqQuestion,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    {faq.question}
                  </Text>
                  <Text style={styles.faqToggle}>{expandedFAQ === faq.id ? '−' : '+'}</Text>
                </View>
                {expandedFAQ === faq.id && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
              ]}
            >
              Contact Support
            </Text>

            {formSubmitted ? (
              <View
                style={[
                  styles.successCard,
                  { backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50] },
                ]}
              >
                <Text style={styles.successIcon}>✅</Text>
                <Text
                  style={[
                    styles.successTitle,
                    { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                  ]}
                >
                  Ticket Submitted!
                </Text>
                <Text style={styles.successSubtitle}>We'll get back to you within 24 hours.</Text>
                <TouchableOpacity
                  onPress={() => setFormSubmitted(false)}
                  style={styles.resubmitButton}
                  accessibilityLabel="Submit another ticket"
                  accessibilityRole="button"
                >
                  <Text style={styles.resubmitButtonText}>Submit Another Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    Subject
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
                        color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary,
                      },
                    ]}
                    value={formData.subject}
                    onChangeText={(value) => handleInputChange('subject', value)}
                    placeholder="Brief description of your issue"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    Category
                  </Text>
                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => handleInputChange('category', cat)}
                        style={[
                          styles.categoryButton,
                          formData.category === cat && styles.categoryButtonSelected,
                        ]}
                        accessibilityLabel={`Select ${cat} category`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: formData.category === cat }}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            formData.category === cat && styles.categoryButtonTextSelected,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary },
                    ]}
                  >
                    Message
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colorScheme === 'dark' ? colors.bg.secondary : colors.light[50],
                        color: colorScheme === 'dark' ? colors.text.primary : colors.bg.primary,
                      },
                    ]}
                    value={formData.message}
                    onChangeText={(value) => handleInputChange('message', value)}
                    placeholder="Tell us more about your issue..."
                    placeholderTextColor={colors.text.secondary}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton} accessibilityLabel="Submit support ticket" accessibilityRole="button">
                  <Text style={styles.submitButtonText}>📤 Submit Ticket</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  quickLinkCard: {
    width: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickLinkIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickLinkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    color: colors.text.secondary,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.light[200],
    fontSize: 14,
    color: colors.text.tertiary,
    lineHeight: 1.6,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 120,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.light[100],
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary[500],
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark[700],
  },
  categoryButtonTextSelected: {
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  successCard: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  resubmitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resubmitButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
