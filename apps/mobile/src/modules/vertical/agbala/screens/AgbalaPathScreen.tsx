import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { AgbalaEndCard } from '../components/AgbalaEndCard';
import { colors, typography, spacing } from '../../../../theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../../../components/StateContainers';
import type { AgbalaStackParamList } from '../types';

type RouteProps = RouteProp<AgbalaStackParamList, 'AgbalaPath'>;

interface PathData {
  title: string;
  description: string;
  chapters: string[];
}

export default function AgbalaPathScreen({ route }: { route: RouteProps }) {
  const { pathId } = route?.params || {};
  const [pathData, setPathData] = useState<Record<string, PathData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    loadPathData();
  }, []);

  const loadPathData = async () => {
    try {
      const response = await apiClient.get<Record<string, PathData>>(
        '/v1/vertical/storyworlds/agbala/paths'
      );
      setPathData(response || {});
    } catch (err) {
      // Fallback to default data if API fails
      setPathData({
        warrior: {
          title: 'Path of the Warrior',
          description: "Embark on the warrior's journey through Agbala.",
          chapters: ['The Awakening', 'Trial of Strength', 'Battle of Wills', 'The Final Stand'],
        },
        sage: {
          title: 'Path of the Sage',
          description: 'Seek the wisdom hidden in Agbala.',
          chapters: [
            'The First Insight',
            'Ancient Knowledge',
            'The Test of Truth',
            'Enlightenment',
          ],
        },
        trickster: {
          title: 'Path of the Trickster',
          description: 'Navigate Agbala with cunning and wit.',
          chapters: ['The First Deception', 'Shadow Games', 'The Double Cross', 'Final Gambit'],
        },
        healer: {
          title: 'Path of the Healer',
          description: 'Restore balance to Agbala.',
          chapters: [
            'The Call to Heal',
            'Trials of Compassion',
            'The Healing Touch',
            'Restoration',
          ],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingState text="Loading path..." />;
  if (error)
    return <ErrorState title="Failed to load" description={error} onRetry={loadPathData} />;

  const path = pathData[pathId || 'warrior'] ||
    pathData.warrior || { title: '', description: '', chapters: [] };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {path.title}
        </Text>
        <Text style={styles.description}>{path.description}</Text>
      </View>

      <View style={styles.chapters}>
        {path.chapters.map((chapter, index) => (
          <View key={index} style={styles.chapterItem}>
            <Text style={styles.chapterNumber}>Chapter {index + 1}</Text>
            <Text style={styles.chapterTitle}>{chapter}</Text>
          </View>
        ))}
      </View>

      <AgbalaEndCard
        title="Continue Your Journey"
        description="More chapters will be unlocked as you progress."
        buttonText="Back to Home"
        onPress={() => {}}
      />
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
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  chapters: {
    padding: spacing.xl,
  },
  chapterItem: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  chapterNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  chapterTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
});
