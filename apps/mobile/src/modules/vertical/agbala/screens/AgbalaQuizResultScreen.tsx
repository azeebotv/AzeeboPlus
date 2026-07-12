import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { AgbalaQuizResult } from '../components/AgbalaQuizResult';
import { colors } from '../../../../theme';
import { apiClient } from '../../../../api/client';
import { LoadingState, ErrorState } from '../../../../components/StateContainers';
import type { AgbalaStackParamList } from '../types';

type RouteProps = RouteProp<AgbalaStackParamList, 'AgbalaQuizResult'>;

interface PathDescription {
  title: string;
  description: string;
}

export default function AgbalaQuizResultScreen({ route }: { route: RouteProps }) {
  const { answers = [] } = route?.params || {};
  const [pathDescriptions, setPathDescriptions] = useState<Record<string, PathDescription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    loadPathDescriptions();
  }, []);

  const loadPathDescriptions = async () => {
    try {
      const response = await apiClient.get<Record<string, PathDescription>>(
        '/v1/vertical/storyworlds/agbala/paths'
      );
      setPathDescriptions(response || {});
    } catch (err) {
      // Fallback to default descriptions if API fails
      setPathDescriptions({
        warrior: { title: 'Warrior', description: 'You possess the spirit of a warrior.' },
        sage: { title: 'Sage', description: 'The wisdom of the ages flows through you.' },
        trickster: {
          title: 'Trickster',
          description: 'Your cunning and adaptability are your greatest assets.',
        },
        healer: {
          title: 'Healer',
          description: 'Your compassion and restorative power are rare gifts.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pathScores = {
    warrior: answers.filter((a: number) => a === 0).length,
    sage: answers.filter((a: number) => a === 1).length,
    trickster: answers.filter((a: number) => a === 2).length,
    healer: answers.filter((a: number) => a === 3).length,
  };

  const dominantPath = Object.entries(pathScores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as string;

  if (isLoading) return <LoadingState text="Loading results..." />;
  if (error)
    return <ErrorState title="Failed to load" description={error} onRetry={loadPathDescriptions} />;

  return (
    <ScrollView style={styles.container}>
      <AgbalaQuizResult
        path={dominantPath}
        title={pathDescriptions[dominantPath]?.title || dominantPath}
        description={pathDescriptions[dominantPath]?.description || ''}
        onContinue={() => {}}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
});
