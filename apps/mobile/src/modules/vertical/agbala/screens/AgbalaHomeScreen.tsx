import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/native';
import { AgbalaHero } from '../components/AgbalaHero';
import { AgbalaPathCard } from '../components/AgbalaPathCard';
import { colors, typography, spacing, pathColors } from '../../../../theme';
import type { AgbalaStackParamList } from '../types';

type NavigationProp = StackNavigationProp<AgbalaStackParamList, 'AgbalaHome'>;

export default function AgbalaHomeScreen({ navigation }: { navigation: NavigationProp }) {
  const handleBeginJourney = () => {
    navigation.navigate('AgbalaStoryworld');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AgbalaHero
        title="Agbala"
        subtitle="Choose your path. Shape your destiny."
        onCTAPress={handleBeginJourney}
        ctaLabel="Begin Journey"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Choose Your Path
        </Text>
        <Text style={styles.sectionDescription}>
          Each path reveals different aspects of the Agbala universe.
        </Text>

        <AgbalaPathCard
          name="Warrior"
          description="Strength, honor, and combat mastery"
          color={pathColors.warrior}
          progress={0}
          totalSteps={10}
          onPress={() => navigation.navigate('AgbalaPath', { pathId: 'warrior' })}
        />
        <AgbalaPathCard
          name="Sage"
          description="Wisdom, knowledge, and ancient truths"
          color={pathColors.sage}
          progress={0}
          totalSteps={10}
          onPress={() => navigation.navigate('AgbalaPath', { pathId: 'sage' })}
        />
        <AgbalaPathCard
          name="Trickster"
          description="Cunning, deception, and survival"
          color={pathColors.trickster}
          progress={0}
          totalSteps={10}
          onPress={() => navigation.navigate('AgbalaPath', { pathId: 'trickster' })}
        />
        <AgbalaPathCard
          name="Healer"
          description="Compassion, restoration, and balance"
          color={pathColors.healer}
          progress={0}
          totalSteps={10}
          onPress={() => navigation.navigate('AgbalaPath', { pathId: 'healer' })}
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('AgbalaQuiz')}
          accessibilityRole="button"
          accessibilityLabel="Take the Destiny Quiz"
        >
          <Text style={styles.quizButtonText}>Take the Destiny Quiz</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  section: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  quizButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  quizButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});
