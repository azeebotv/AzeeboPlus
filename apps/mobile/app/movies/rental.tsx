import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { moviePricing } from '../../src/config/prices';
import { colors } from '../../src/theme';

type RentalOption = {
  id: string;
  type: string;
  price: string;
  duration: string;
  features: string[];
};

const RENTAL_OPTIONS: RentalOption[] = [
  {
    id: 'rent_48h',
    type: '48-Hour Rental',
    price: moviePricing.rent48h.label,
    duration: '48 hours',
    features: ['Stream in HD', 'Watch on 2 devices', 'No downloads'],
  },
  {
    id: 'rent_7d',
    type: '7-Day Rental',
    price: '₦2,000',
    duration: '7 days',
    features: ['Stream in HD', 'Watch on 3 devices', 'Download for offline'],
  },
  {
    id: 'buy',
    type: 'Buy to Own',
    price: moviePricing.buy.label,
    duration: 'Forever',
    features: ['Stream in HD + 4K', 'Unlimited devices', 'Download for offline', 'Bonus content'],
  },
];

export default function RentalScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const [selectedOption, setSelectedOption] = useState<RentalOption>(RENTAL_OPTIONS[0]);

  const handlePurchase = () => {
    Alert.alert('Confirm Purchase', `${selectedOption.type} for ${selectedOption.price}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay',
        onPress: () => {
          Alert.alert('Success', `${selectedOption.type} confirmed! Enjoy your movie.`, [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0A0A' : '#ffffff' }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1A0A0A' }]}>
          Rent / Buy
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: isDark ? '#fff' : '#000' }]}>
          Choose how to watch
        </Text>
        <Text style={styles.subheading}>Select an option below to unlock this movie</Text>

        {RENTAL_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' },
              selectedOption.id === option.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption(option)}
          >
            <View style={styles.optionHeader}>
              <View>
                <Text style={[styles.optionType, { color: isDark ? '#fff' : '#000' }]}>
                  {option.type}
                </Text>
                <Text style={styles.optionDuration}>{option.duration}</Text>
              </View>
              <View style={styles.optionPriceCol}>
                <Text style={styles.optionPrice}>{option.price}</Text>
              </View>
              {selectedOption.id === option.id && (
                <View style={styles.selectedCheck}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.optionFeatures}>
              {option.features.map((feature, i) => (
                <Text key={i} style={styles.featureText}>
                  ✓ {feature}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Text style={[styles.summaryTitle, { color: isDark ? '#fff' : '#000' }]}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{selectedOption.type}</Text>
            <Text style={styles.summaryValue}>{selectedOption.price}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.summaryValue, { color: colors.category.highlight, fontSize: 20 }]}>
              {selectedOption.price}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.payButton} onPress={handlePurchase}>
          <Text style={styles.payText}>Pay {selectedOption.price}</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By purchasing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 30 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  subheading: { color: colors.text.secondary, fontSize: 14, marginBottom: 24 },
  optionCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: { borderColor: colors.category.highlight },
  optionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  optionType: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  optionDuration: { color: colors.text.secondary, fontSize: 13 },
  optionPriceCol: { flex: 1, alignItems: 'flex-end' },
  optionPrice: { color: colors.category.highlight, fontSize: 22, fontWeight: '700' },
  selectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.category.highlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkmark: { color: '#000', fontWeight: '700', fontSize: 14 },
  optionFeatures: { gap: 4 },
  featureText: { color: colors.neutral[300], fontSize: 13 },
  summaryCard: { padding: 18, borderRadius: 14, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: colors.neutral[300], fontSize: 14 },
  summaryValue: { color: colors.neutral[300], fontSize: 16, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: colors.bg.tertiary, marginVertical: 8 },
  payButton: {
    backgroundColor: colors.category.highlight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  payText: { color: '#000', fontSize: 16, fontWeight: '700' },
  termsText: { color: colors.text.secondary, fontSize: 12, textAlign: 'center' },
});
