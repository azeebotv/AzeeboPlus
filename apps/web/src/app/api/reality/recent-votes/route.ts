import { NextResponse } from 'next/server';
import { getRealityDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const realityDb = getRealityDb();
    const votes = await realityDb.vote.findMany({
      include: {
        contestant: {
          select: {
            name: true,
          },
        },
        show: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Format human-friendly time labels (e.g. "2m ago")
    const now = Date.now();
    const formatted = votes.map((v) => {
      const diffMs = now - new Date(v.createdAt).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      const timeStr = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
      const maskedUser = `Fan_${v.userId.slice(0, 4)}...`;

      return {
        id: v.id,
        user: maskedUser,
        votes: v.quantity,
        contestant: v.contestant?.name || 'Contestant',
        show: v.show?.title || 'Reality Show',
        time: timeStr,
        createdAt: v.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query recent votes';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
