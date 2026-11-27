import { NextRequest, NextResponse } from 'next/server';
import { getSportsDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sportsDb = getSportsDb();
    const teamId = req.nextUrl.searchParams.get('teamId');

    const where = teamId ? { teamId } : {};
    const players = await sportsDb.sportsPlayer.findMany({
      where,
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: players.map((p) => ({
        id: p.id,
        teamId: p.teamId,
        number: p.number,
        name: p.name,
        position: p.position,
        gridX: p.gridX,
        gridY: p.gridY,
        rating: p.rating ? Number(p.rating) : null,
        isCaptain: p.isCaptain,
        photo: p.photo,
      })),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query sports players';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
