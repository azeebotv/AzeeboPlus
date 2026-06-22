import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const legalContent: Record<
  string,
  { title: string; sections: { heading: string; content: string }[] }
> = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Introduction',
        content:
          'Welcome to Azeebo+. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our app.',
      },
      {
        heading: '2. Data We Collect',
        content:
          'We may collect, use, store and transfer different kinds of personal data about you: Identity Data (name, username), Contact Data (email address), Financial Data (payment card details, transaction history), Usage Data (information about how you use our app).',
      },
      {
        heading: '3. How We Use Your Data',
        content:
          'We use your personal data to provide and improve our services, process payments, communicate with you, and comply with legal obligations.',
      },
      {
        heading: '4. Data Security',
        content:
          'We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.',
      },
      {
        heading: '5. Your Rights',
        content:
          'You have the right to access, correct, or delete your personal data. Contact us at privacy@azeebo.plus to exercise these rights.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: '1. Agreement to Terms',
        content:
          'By accessing and using Azeebo+, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.',
      },
      {
        heading: '2. Account Registration',
        content:
          'To use certain features of the service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials.',
      },
      {
        heading: '3. User Conduct',
        content:
          'You agree not to use the service for any unlawful purpose or in any way that could damage, disable, overburden, or impair the service.',
      },
      {
        heading: '4. Content',
        content:
          'All content provided on Azeebo+ is for informational and entertainment purposes only. We reserve the right to remove any content that violates these terms.',
      },
      {
        heading: '5. Payments',
        content:
          'Certain features of the service require payment. You agree to pay all fees associated with your account in accordance with our pricing and payment terms.',
      },
    ],
  },
};

export default function LegalPage() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'privacy' | 'terms' }>();

  const content = legalContent[type || 'privacy'];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? '#ffffff' : '#000000' }]}>
          {content.title}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colorScheme === 'dark' ? '#ffffff' : '#000000' },
              ]}
            >
              {section.heading}
            </Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: June 1, 2026</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 1.6,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
});
