import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { apiClient } from '@azeebo/react-data/api/client';
import { LoadingState, ErrorState } from '../../src/components/StateContainers';
import { analytics } from '../../src/utils/analytics';

interface StoryworldDetail {
  id: string;
  name: string;
  description: string;
  titles: { id: string; title: string; emoji: string; status: string }[];
  characters: { id: string; name: string; avatar: string; role: string }[];
  theories: { id: string; title: string; description: string; author: string; votes: number }[];
  realms: { id: string; name: string; description: string; icon: string }[];
}

export default function StoryworldScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState('titles');
  const [data, setData] = useState<StoryworldDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theoryDesc, setTheoryDesc] = useState('');
  const [isSubmittingTheory, setIsSubmittingTheory] = useState(false);

  const tabs = [
    { id: 'titles', label: 'Titles' },
    { id: 'characters', label: 'Characters' },
    { id: 'theories', label: 'Theories' },
    { id: 'realms', label: 'Realms' },
  ];

  const fetchData = useCallback(async () => {
    if (!id) {
      setError('No storyworld ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<StoryworldDetail>(`/v1/vertical/storyworlds/${id}`);
      setData(res);
      analytics.verticalTitleViewed(res.id);
    } catch {
      setError('Failed to load storyworld');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitTheory = async () => {
    if (!theoryTitle.trim() || !id) return;
    setIsSubmittingTheory(true);
    try {
      await apiClient.post(`/v1/vertical/storyworlds/${id}/theories`, {
        title: theoryTitle.trim(),
        description: theoryDesc.trim(),
      });
      analytics.verticalTheorySubmitted(id);
      setTheoryTitle('');
      setTheoryDesc('');
      fetchData();
    } catch {
      // silent
    } finally {
      setIsSubmittingTheory(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <LoadingState text="Loading storyworld..." />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
      >
        <ErrorState description={error || 'Storyworld not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.bg.primary : '#fff' }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {data.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{data.name}</Text>
          <Text style={[styles.heroDesc, { color: isDark ? colors.text.secondary : '#666' }]}>
            {data.description}
          </Text>
        </View>

        <View style={styles.tabsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {activeTab === 'titles' && (
            <View>
              {data.titles.map((title) => (
                <TouchableOpacity
                  key={title.id}
                  style={[
                    styles.itemCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                  onPress={() => router.push(`/vertical-title?id=${title.id}`)}
                >
                  <Text style={styles.itemEmoji}>{title.emoji}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: colors.text.primary }]}>
                      {title.title}
                    </Text>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>{title.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'characters' && (
            <View>
              {data.characters.map((char) => (
                <TouchableOpacity
                  key={char.id}
                  style={[
                    styles.itemCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                  onPress={() => router.push(`/vertical/character-detail?id=${char.id}`)}
                >
                  <Text style={styles.itemEmoji}>{char.avatar}</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: colors.text.primary }]}>
                      {char.name}
                    </Text>
                    <Text style={styles.itemSubtitle}>{char.role}</Text>
                  </View>
                  <Text style={styles.itemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'theories' && (
            <View>
              <View
                style={[
                  styles.theoryForm,
                  { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                ]}
              >
                <Text style={[styles.theoryFormTitle, { color: colors.text.primary }]}>
                  Submit a Theory
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text.primary, borderColor: colors.border.default },
                  ]}
                  placeholder="Theory title..."
                  placeholderTextColor={colors.text.tertiary}
                  value={theoryTitle}
                  onChangeText={setTheoryTitle}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    { color: colors.text.primary, borderColor: colors.border.default },
                  ]}
                  placeholder="Describe your theory..."
                  placeholderTextColor={colors.text.tertiary}
                  value={theoryDesc}
                  onChangeText={setTheoryDesc}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.submitButton, isSubmittingTheory && styles.submitButtonDisabled]}
                  onPress={submitTheory}
                  disabled={isSubmittingTheory || !theoryTitle.trim()}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmittingTheory ? 'Submitting...' : 'Submit Theory'}
                  </Text>
                </TouchableOpacity>
              </View>

              {data.theories.map((theory) => (
                <View
                  key={theory.id}
                  style={[
                    styles.theoryCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                >
                  <Text style={[styles.theoryTitle, { color: colors.text.primary }]}>
                    {theory.title}
                  </Text>
                  <Text
                    style={[styles.theoryDesc, { color: isDark ? colors.text.secondary : '#666' }]}
                  >
                    {theory.description}
                  </Text>
                  <View style={styles.theoryFooter}>
                    <Text style={styles.theoryAuthor}>by {theory.author}</Text>
                    <Text style={styles.theoryVotes}>▲ {theory.votes}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'realms' && (
            <View>
              {data.realms.map((realm) => (
                <View
                  key={realm.id}
                  style={[
                    styles.realmCard,
                    { backgroundColor: isDark ? colors.bg.tertiary : '#f5f5f5' },
                  ]}
                >
                  <View style={styles.realmHeader}>
                    <Text style={styles.realmEmoji}>{realm.icon}</Text>
                    <Text style={[styles.realmName, { color: colors.text.primary }]}>
                      {realm.name}
                    </Text>
                  </View>
                  <Text
                    style={[styles.realmDesc, { color: isDark ? colors.text.secondary : '#666' }]}
                  >
                    {realm.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
    padding: 16,
    paddingTop: 40,
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
    padding: 16,
    paddingBottom: 24,
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: colors.text.primary, marginBottom: 8 },
  heroDesc: { fontSize: 15, lineHeight: 24 },
  tabsBar: {
    backgroundColor: colors.bg.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabs: { paddingHorizontal: 12, gap: 4 },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary[500] },
  tabText: { color: colors.text.tertiary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: colors.primary[500] },
  content: { padding: 16 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemEmoji: { fontSize: 28, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemSubtitle: { fontSize: 12, color: colors.text.tertiary },
  itemBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[500] + '25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  itemBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary[500] },
  itemArrow: { color: colors.text.secondary, fontSize: 24 },
  theoryForm: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  theoryFormTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  theoryCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  theoryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  theoryDesc: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  theoryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  theoryAuthor: { fontSize: 12, color: colors.text.tertiary },
  theoryVotes: { fontSize: 13, fontWeight: '600', color: colors.primary[500] },
  realmCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  realmHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  realmEmoji: { fontSize: 28 },
  realmName: { fontSize: 16, fontWeight: '700' },
  realmDesc: { fontSize: 14, lineHeight: 22 },
});
