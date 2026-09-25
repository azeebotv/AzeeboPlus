export interface FeedItem {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  categoryName: string;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

export function mapToFeedItem(
  item: Record<string, unknown>,
  type: string,
  defaults: Partial<FeedItem> = {}
): FeedItem {
  return {
    id: item.id as string,
    type,
    title: (item.title as string) || (item.name as string) || '',
    slug: (item.slug as string) || '',
    excerpt: ((item.description as string) || (item.bio as string) || '').substring(0, 150),
    coverImage: (item.coverImage as string) || (item.thumbnail as string) || '',
    authorName:
      (item.authorName as string) || (item.artistName as string) || defaults.authorName || '',
    categoryName:
      (item.categoryName as string) ||
      (item.category as string) ||
      (item.type as string) ||
      defaults.categoryName ||
      'General',
    viewCount: (item.viewCount as number) || (item.playCount as number) || 0,
    publishedAt:
      item.publishedAt instanceof Date
        ? (item.publishedAt as Date).toISOString()
        : item.createdAt instanceof Date
          ? (item.createdAt as Date).toISOString()
          : (item.publishedAt as string) || '',
    createdAt:
      item.createdAt instanceof Date
        ? (item.createdAt as Date).toISOString()
        : (item.createdAt as string) || '',
    ...defaults,
  };
}

export function sortFeedItems(
  items: FeedItem[],
  sortBy: 'date' | 'popularity' = 'date'
): FeedItem[] {
  return items.sort((a, b) => {
    if (sortBy === 'popularity') {
      return b.viewCount - a.viewCount;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
