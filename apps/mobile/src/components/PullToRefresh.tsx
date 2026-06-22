import React from 'react';
import { RefreshControl, ScrollView, FlatList, SectionList, Platform } from 'react-native';
import { logger } from '../utils/logger';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
  tintColor?: string;
  titleColor?: string;
  title?: string;
  style?: any;
  contentContainerStyle?: any;
}

export function PullToRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  tintColor = '#007AFF',
  titleColor = '#666666',
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
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  numColumns?: number;
  contentContainerStyle?: any;
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
  tintColor = '#007AFF',
  titleColor = '#666666',
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
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  tintColor?: string;
  titleColor?: string;
  title?: string;
}

interface SectionListData<T, SectionT> {
  data: T[];
  [key: string]: any;
}

export function PullToRefreshSectionList<T, SectionT>({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  refreshing,
  onRefresh,
  ListEmptyComponent,
  tintColor = '#007AFF',
  titleColor = '#666666',
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
