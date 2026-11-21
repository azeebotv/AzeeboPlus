import { NextResponse } from 'next/server';
import { getRealityDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const realityDb = getRealityDb();
    const show = await realityDb.realityShow.findFirst({
      where: {
        OR: [{ id: 'show-survivor-001' }, { title: { contains: 'SURVIVOR', mode: 'insensitive' } }],
      },
      include: {
        contestants: true,
      },
    });

    if (!show) {
      return NextResponse.json({ success: false, error: 'Show not found' }, { status: 404 });
    }

    const metadata = (show.metadata as Record<string, unknown>) || {};
    const totalVotes = show.contestants.reduce((sum, c) => {
      const social = (c.socialLinks as Record<string, unknown>) || {};
      return sum + (typeof social.votes === 'number' ? social.votes : 1000);
    }, 0);

    const contestants = show.contestants.map((c) => {
      const social = (c.socialLinks as Record<string, unknown>) || {};
      const votes = typeof social.votes === 'number' ? social.votes : 12000;
      const tribe = typeof social.tribe === 'string' ? social.tribe : 'Ikenga';
      const risk = typeof social.risk === 'string' ? social.risk : 'safe';
      const rank = typeof social.rank === 'number' ? social.rank : 1;
      const voteShare = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 25;

      return {
        id: c.id,
        name: c.name,
        tribe,
        votes,
        voteShare,
        risk,
        rank,
        image:
          c.thumbnail ||
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: c.description || 'Castaway contestant fighting for survival on Snake Island.',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: show.id,
        title: show.title,
        description: show.description,
        thumbnail: show.thumbnail,
        currentEpisode: metadata.currentEpisode || 3,
        totalEpisodes: metadata.totalEpisodes || 12,
        tribes: metadata.tribes || ['Ikenga Tribe', 'Odugwu Tribe'],
        nextEviction:
          metadata.nextEviction || new Date(Date.now() + 38 * 3600 * 1000).toISOString(),
        contestants,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query reality survivor show';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
