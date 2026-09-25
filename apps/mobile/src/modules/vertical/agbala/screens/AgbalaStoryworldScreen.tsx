import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { AgbalaPathCard } from '../components/AgbalaPathCard';
import { colors, typography, spacing, pathColors } from '../../../../theme';
import type { AgbalaStackParamList } from '../types';

type StoryworldNavigationProp = NavigationProp<AgbalaStackParamList, 'AgbalaStoryworld'>;

export default function AgbalaStoryworldScreen({
  navigation,
}: {
  navigation: StoryworldNavigationProp;
}) {
  const paths = [
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'Strength, honor, and combat mastery',
      color: pathColors.warrior,
      progress: 0,
      totalSteps: 10,
    },
    {
      id: 'sage',
      name: 'Sage',
      description: 'Wisdom, knowledge, and ancient truths',
      color: pathColors.sage,
      progress: 0,
      totalSteps: 10,
    },
    {
      id: 'trickster',
      name: 'Trickster',
      description: 'Cunning, deception, and survival',
      color: pathColors.trickster,
      progress: 0,
      totalSteps: 10,
    },
    {
      id: 'healer',
      name: 'Healer',
      description: 'Compassion, restoration, and balance',
      color: pathColors.healer,
      progress: 0,
      totalSteps: 10,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Storyworld
        </Text>
        <Text style={styles.subtitle}>Explore the paths and characters of Agbala</Text>
      </View>

      <View style={styles.pathsContainer}>
        {paths.map((path) => (
          <AgbalaPathCard
            key={path.id}
            name={path.name}
            description={path.description}
            color={path.color}
            progress={path.progress}
            totalSteps={path.totalSteps}
            onPress={() => navigation.navigate('AgbalaPath', { pathId: path.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  pathsContainer: {
    padding: spacing.xl,
  },
});
