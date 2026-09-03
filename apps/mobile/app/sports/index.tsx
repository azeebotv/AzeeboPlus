import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../src/theme';
import { analytics } from '../../src/utils/analytics';

const SECTIONS = [
  { id: 'fixtures', label: 'Fixtures', icon: '⚽', desc: 'Upcoming matches', route: '/sports/fixtures' },
  { id: 'highlights', label: 'Highlights', icon: '🎬', desc: 'Match highlights', route: '/sports/highlights' },
  { id: 'predictions', label: 'Predictions', icon: '🔮', desc: 'Predict & win', route: '/sports/predictions' },
  { id: 'fan-contests', label: 'Fan Contests', icon: '🏆', desc: 'Compete with fans', route: '/sports/fan-contests' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '📊', desc: 'Top predictors', route: '/sports/leaderboard' },
];

export default function SportsHubScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    analytics.lifestyleFeedViewed();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.universeLabel, { color: '#22C55E' }]}>⚽ Sports</Text>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Sports Universe</Text>
          <Text style={[styles.headerDesc, { color: colors.text.secondary }]}>
            Live matches, predictions, and fan contests
          </Text>
        </View>

        <View style={styles.sectionList}>
          {SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionCard, { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' }]}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>{section.icon}</Text>
              </View>
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{section.label}</Text>
                <Text style={[styles.sectionDesc, { color: colors.text.tertiary }]}>{section.desc}</Text>
              </View>
              <Text style={[styles.sectionArrow, { color: colors.text.secondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: 40 },
  universeLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  headerDesc: { fontSize: 15 },
  sectionList: { padding: spacing.lg, gap: 12 },
  sectionCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: radius.lg, gap: 14,
  },
  sectionIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#22C55E20', alignItems: 'center', justifyContent: 'center',
  },
  sectionIconText: { fontSize: 22 },
  sectionInfo: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sectionDesc: { fontSize: 13 },
  sectionArrow: { fontSize: 24 },
});
