/**
 * TV search — 10-foot search across Azeebo+ content.
 *
 * Focus a text input (the platform IME opens), results stream in debounced
 * (400ms) once two characters are typed; Select on a result opens the watch
 * screen. Back exits. States: loading / error-with-retry / honest empty.
 *
 * M2: search was the biggest missing lean-back vertical (the audit noted TV
 * shipped with exactly two rails and no way to reach anything else).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { contentApi, type ContentItem } from '@azeebo/react-data';
import { FocusableRow, type RailItem } from '../src/components/Focusable';
import { LoadingState, ErrorState } from '../src/components/StateContainers';
import { logger } from '@azeebo/react-data/utils/logger';
import { colors, tvTypography, tvSpacing, tvRadius } from '../src/theme';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 24;

export default function TVSearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedFor, setSearchedFor] = useState('');

  // Bump on every new search (and on unmount) so stale responses never land.
  const runIdRef = useRef(0);

  const runSearch = useCallback(
    async (trimmed: string) => {
      const runId = ++runIdRef.current;
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await contentApi.searchContent(trimmed, 1, RESULT_LIMIT);
        if (runId !== runIdRef.current) return; // superseded
        if (response.success && response.data) {
          setResults(response.data.items ?? []);
          setSearchedFor(trimmed);
        } else {
          setResults([]);
          setSearchedFor(trimmed);
          setSearchError(response.message || t('common.error'));
        }
      } catch (error) {
        if (runId !== runIdRef.current) return;
        logger.error('TV search failed', error);
        setSearchError(t('common.errorNetwork'));
        setResults([]);
        setSearchedFor(trimmed);
      } finally {
        if (runId === runIdRef.current) {
          setIsSearching(false);
        }
      }
    },
    [t]
  );

  // Debounced auto-search as the user types.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      runIdRef.current += 1; // invalidate in-flight searches
      setIsSearching(false);
      setResults([]);
      setSearchedFor('');
      setSearchError(null);
      return;
    }
    const timer = setTimeout(() => {
      void runSearch(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1; // unmount: never land a late response
    };
  }, []);

  const handleSelect = useCallback(
    (item: RailItem) => {
      router.push(`/watch/${item.id}`);
    },
    [router]
  );

  const toRailItems = (items: ContentItem[]): RailItem[] =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.mediaAsset?.thumbnailUrl || item.thumbnail,
      subtitle: item.creator?.name,
    }));

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('common.search')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('common.searchPlaceholder')}
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => {
            const trimmed = query.trim();
            if (trimmed.length >= MIN_QUERY_LENGTH) void runSearch(trimmed);
          }}
          accessibilityLabel={t('common.search')}
        />

        <ScrollView
          style={styles.results}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {isSearching ? <LoadingState text={t('common.loading')} /> : null}

          {!isSearching && searchError ? (
            <ErrorState
              description={searchError}
              onRetry={() => {
                const trimmed = query.trim();
                if (trimmed.length >= MIN_QUERY_LENGTH) void runSearch(trimmed);
              }}
            />
          ) : null}

          {!isSearching && !searchError && hasQuery && results.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {/* Manual interpolation: the app's t() is the basic overload
                    (no typed resources), which rejects an options object. */}
                {t('common.searchNoResults').replace('{{query}}', searchedFor)}
              </Text>
            </View>
          ) : null}

          {!isSearching && results.length > 0 ? (
            <FocusableRow
              title={`${results.length} ${searchedFor}`}
              items={toRailItems(results)}
              onSelect={handleSelect}
            />
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: tvSpacing.section,
    paddingTop: tvSpacing.xl,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: tvTypography.fontSize.hero,
    fontWeight: tvTypography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: tvSpacing.lg,
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: tvRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    color: colors.text.primary,
    fontSize: tvTypography.fontSize.xl,
    paddingHorizontal: tvSpacing.lg,
    paddingVertical: tvSpacing.md,
    marginBottom: tvSpacing.lg,
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: tvSpacing.section,
  },
  emptyState: {
    padding: tvSpacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.text.secondary,
    fontSize: tvTypography.fontSize.lg,
    textAlign: 'center',
  },
});
