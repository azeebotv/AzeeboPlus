import { NextResponse } from 'next/server';
import { getSportsDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sportsDb = getSportsDb();
    const events = await sportsDb.sportsEvent.findMany({
      include: {
        fixtureMetadata: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    const fixtures = events.map((event, idx) => {
      const meta = event.fixtureMetadata;
      const metaJson = (event.metadata as Record<string, unknown>) || {};
      const titleParts = event.title.split(': ');
      const leagueName = titleParts.length > 1 ? titleParts[0].trim() : 'International';
      const matchPart = titleParts.length > 1 ? titleParts[1] : event.title;
      const teams = matchPart.split(' vs ');
      const homeTeam = teams[0]?.trim() || 'Team A';
      const awayTeam = teams[1]?.trim() || 'Team B';

      // Infer league code
      let league = 'ALL';
      const upperLeague = leagueName.toUpperCase();
      if (upperLeague.includes('NPFL')) league = 'NPFL';
      else if (upperLeague.includes('EPL') || upperLeague.includes('PREMIER')) league = 'EPL';
      else if (
        upperLeague.includes('CAF') ||
        upperLeague.includes('AFCON') ||
        upperLeague.includes('FRIENDLY')
      )
        league = 'CAF';
      else if (upperLeague.includes('LIGA')) league = 'LA LIGA';
      else league = 'NPFL';

      const dateObj = new Date(event.startsAt);
      const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        id: event.id,
        league,
        leagueName,
        homeTeam,
        awayTeam,
        homeLogo:
          (metaJson.homeLogo as string) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(homeTeam)}&size=100&background=18151E&color=F5F3FF&bold=true`,
        awayLogo:
          (metaJson.awayLogo as string) ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(awayTeam)}&size=100&background=18151E&color=F5F3FF&bold=true`,
        time: timeStr,
        date: dateObj.toISOString().split('T')[0],
        status: event.status === 'live' ? 'LIVE' : event.status === 'completed' ? 'FT' : 'Upcoming',
        minute: (metaJson.minute as string) || (event.status === 'live' ? "68'" : undefined),
        score: (metaJson.score as string) || (event.status === 'live' ? '1 - 0' : undefined),
        venue: meta?.venue || 'Teslim Balogun Stadium, Lagos',
        broadcast: meta?.broadcast?.[0] || 'Azeebo Sports 1 HD',
        odds: (metaJson.odds as { home: number; draw: number; away: number }) || {
          home: Number((1.8 + ((idx * 0.25) % 1.5)).toFixed(2)),
          draw: 3.2,
          away: Number((3.1 - ((idx * 0.2) % 1.2)).toFixed(2)),
        },
        hasReminder: false,
      };
    });

    return NextResponse.json({ success: true, data: fixtures });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query sports fixtures';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
