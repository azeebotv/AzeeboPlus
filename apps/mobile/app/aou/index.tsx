import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

interface HubModule {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  badge?: string;
}

export default function AOUHubScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const modules: HubModule[] = [
    {
      id: 'what-you-know',
      title: 'What You Know',
      description: 'Your personalized codex of unlocked revelations, mystical origins, and cosmic lore.',
      route: '/aou/what-you-know',
      icon: '📜',
      badge: 'CODEX',
    },
    {
      id: 'storyworld',
      title: 'Omíṣẹwà Storyworld',
      description: 'Explore the canonical world, kingdoms, and realms.',
      route: '/vertical/storyworlds',
      icon: '🌍',
    },
    {
      id: 'characters',
      title: 'Characters & Orisa',
      description: 'Inspect relationships, allegiances, and lineage.',
      route: '/vertical/characters',
      icon: '⚔️',
    },
    {
      id: 'timeline',
      title: 'Canonical Timeline',
      description: 'Chronological timeline of events across the Age of Orisa.',
      route: '/vertical/timeline',
      icon: '⏳',
    },
    {
      id: 'lore',
      title: 'Sacred Lore & Artifacts',
      description: 'Mystical artifacts, prophecies, and sacred relics.',
      route: '/vertical/lore',
      icon: '🏺',
    },
    {
      id: 'quiz',
      title: 'Agbalá Quests & Quizzes',
      description: 'Test your knowledge to unlock reward coins and badges.',
      route: '/vertical/quiz',
      icon: '🎯',
      badge: 'REWARDS',
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#0a0a0f' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Agbalá Olódùmarè Hub
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>AOU CANONICAL UNIVERSE</Text>
          <Text style={styles.heroTitle}>The Storyworld Gateway</Text>
          <Text style={styles.heroSubtitle}>
            Immerse yourself in Nigerian mythos, cinematic narratives, and interconnected sagas.
          </Text>
        </View>

        {/* Hub Modules Grid */}
        <View style={styles.modulesContainer}>
          {modules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={[
                styles.moduleCard,
                {
                  backgroundColor: isDark ? colors.bg.tertiary : '#14141f',
                  borderColor: mod.badge ? 'rgba(245, 158, 11, 0.4)' : colors.border.subtle,
                },
              ]}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleIcon}>{mod.icon}</Text>
                {mod.badge && (
                  <View style={styles.moduleBadge}>
                    <Text style={styles.moduleBadgeText}>{mod.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleDesc}>{mod.description}</Text>
              <View style={styles.moduleFooter}>
                <Text style={styles.exploreText}>Explore →</Text>
              </View>
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
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.text.primary, fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  modulesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  moduleCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleIcon: {
    fontSize: 32,
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  moduleDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
