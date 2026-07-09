import {
  RefreshControl,
  ScrollView,
  FlatList,
  SectionList,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme';
import { logger } from '../utils/logger';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  tintColor?: string;
  titleColor?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function PullToRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  tintColor = colors.primary[500],
  titleColor = colors.text.secondary,
  title = 'Refreshing...',
  style,
  contentContainerStyle,
}: PullToRefreshProps): React.ReactElement {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          title={title}
          titleColor={titleColor}
          colors={[tintColor]}
          progressBackgroundColor="#ffffff"
        />
      }
    >
      {children}
    </ScrollView>
  );
}

interface PullToRefreshFlatListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  refreshing: boolean;
  onRefresh: () => void;
  ListEmptyComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
  numColumns?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  tintColor?: string;
  titleColor?: string;
  title?: string;
}

export function PullToRefreshFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  refreshing,
  onRefresh,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  numColumns = 1,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  tintColor = colors.primary[500],
  titleColor = colors.text.secondary,
  title = 'Refreshing...',
}: PullToRefreshFlatListProps<T>): React.ReactElement {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          title={title}
          titleColor={titleColor}
          colors={[tintColor]}
          progressBackgroundColor="#ffffff"
        />
      }
    />
  );
}

interface PullToRefreshSectionListProps<T, SectionT> {
  sections: SectionListData<T, SectionT>[];
  renderItem: ({
    item,
    index,
    section,
  }: {
    item: T;
    index: number;
    section: SectionListData<T, SectionT>;
  }) => React.ReactElement;
  renderSectionHeader?: ({
    section,
  }: {
    section: SectionListData<T, SectionT>;
  }) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  refreshing: boolean;
  onRefresh: () => void;
  ListEmptyComponent?: React.ComponentType<Record<string, unknown>> | React.ReactElement | null;
  tintColor?: string;
  titleColor?: string;
  title?: string;
}

export function PullToRefreshSectionList<T, SectionT>({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  refreshing,
  onRefresh,
  ListEmptyComponent,
  tintColor = colors.primary[500],
  titleColor = colors.text.secondary,
  title = 'Refreshing...',
}: PullToRefreshSectionListProps<T, SectionT>): React.ReactElement {
  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tintColor}
          title={title}
          titleColor={titleColor}
          colors={[tintColor]}
          progressBackgroundColor="#ffffff"
        />
      }
    />
  );
}

export function usePullToRefresh() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async (refreshFn: () => Promise<void>) => {
    setRefreshing(true);
    try {
      await refreshFn();
    } catch (error) {
      logger.error('Pull-to-refresh failed', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    refreshing,
    onRefresh: (fn: () => Promise<void>) => onRefresh(fn),
  };
}
