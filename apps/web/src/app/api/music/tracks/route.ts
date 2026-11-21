import { NextResponse } from 'next/server';
import { getLifestyleDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lifestyleDb = getLifestyleDb();
    const tracks = await lifestyleDb.musicEntry.findMany({
      where: {
        type: 'track',
      },
      orderBy: {
        playCount: 'desc',
      },
      take: 50,
    });

    const formatDuration = (seconds?: number | null) => {
      if (!seconds) return '3:15';
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return NextResponse.json({
      success: true,
      data: tracks.map((t, idx) => ({
        id: t.id,
        rank: idx + 1,
        title: t.title,
        artist: t.artistName || 'Various Artists',
        album: t.albumName || 'Afrobeats Single',
        streams: (t.playCount || 10000).toLocaleString(),
        rawStreams: t.playCount || 10000,
        duration: formatDuration(t.duration),
        durationSec: t.duration || 195,
        genre: t.genre || 'Afrobeats',
        cover:
          t.coverImage ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
        audioQuality: t.isPremium ? 'Dolby Atmos' : 'Hi-Res Lossless',
        trackUrl: t.trackUrl,
      })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query music tracks';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
