import { NextResponse } from 'next/server';
import { getLifestyleDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lifestyleDb = getLifestyleDb();
    const artists = await lifestyleDb.musicArtist.findMany({
      orderBy: {
        monthlyListeners: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: artists.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        genre: a.genre,
        bio: a.bio,
        monthlyListeners: a.monthlyListeners,
        followersCount: a.followersCount,
        image: a.image,
        isVerified: a.isVerified,
        topTracks: (a.topTracks as string[]) || [],
      })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query music artists';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
