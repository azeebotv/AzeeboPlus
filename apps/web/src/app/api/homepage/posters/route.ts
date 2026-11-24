import { NextResponse } from 'next/server';
import { getContentDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contentDb = getContentDb();
    const items = await contentDb.contentItem.findMany({
      where: {
        thumbnail: {
          not: '',
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 24,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        metadata: true,
      },
    });

    const posters = items.map((item, idx) => {
      const meta = (item.metadata as Record<string, unknown>) || {};
      const genre = (meta.genre as string) || 'African Cinema';
      const rating = (meta.rating as string) || (4.6 + (idx % 5) * 0.1).toFixed(1);

      return {
        id: item.id,
        title: item.title,
        genre,
        rating,
        image: item.thumbnail,
      };
    });

    return NextResponse.json({
      success: true,
      data: posters,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query posters';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
