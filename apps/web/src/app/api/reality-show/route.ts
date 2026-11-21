import { NextRequest, NextResponse } from 'next/server';
import { getRealityDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showName = searchParams.get('name') || searchParams.get('show') || 'survivor';
    const realityDb = getRealityDb();

    const normalized = decodeURIComponent(showName).trim();
    const words = normalized
      .toLowerCase()
      .replace(/bbnaija/g, 'brother')
      .split(/[-_\s:]+/)
      .filter((w) => w.length > 2);

    // Try exact ID or title matching first
    let show = await realityDb.realityShow.findFirst({
      where: {
        OR: [
          { id: normalized },
          { title: { equals: normalized, mode: 'insensitive' } },
          { title: { contains: normalized.replace(/-/g, ' '), mode: 'insensitive' } },
          ...words.map((w) => ({ title: { contains: w, mode: 'insensitive' as const } })),
        ],
      },
      include: {
        contestants: true,
      },
    });

    // If not found, fallback to the flagship show (Survivor or first available active show)
    if (!show) {
      show = await realityDb.realityShow.findFirst({
        where: {
          OR: [{ id: 'show-survivor-001' }, { status: 'active' }],
        },
        include: {
          contestants: true,
        },
      });
    }

    if (!show) {
      return NextResponse.json(
        { success: false, error: 'Reality show not found' },
        { status: 404 }
      );
    }

    const metadata = (show.metadata as Record<string, unknown>) || {};
    const totalVotes = show.contestants.reduce((sum, c) => {
      const social = (c.socialLinks as Record<string, unknown>) || {};
      return sum + (typeof social.votes === 'number' ? social.votes : 1000);
    }, 0);

    const contestants = show.contestants.map((c) => {
      const social = (c.socialLinks as Record<string, unknown>) || {};
      const votes = typeof social.votes === 'number' ? social.votes : 12000;
      const tribe = typeof social.tribe === 'string' ? social.tribe : 'Main House';
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
        bio: c.description || 'Contestant competing in the reality arena.',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: show.id,
        showSlug: normalized,
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
    const errorMsg = err instanceof Error ? err.message : 'Failed to query reality show';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
