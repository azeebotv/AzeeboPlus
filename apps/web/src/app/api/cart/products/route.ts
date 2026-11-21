import { NextResponse } from 'next/server';
import { getMovieDb, getSubDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movieDb = getMovieDb();
    const subDb = getSubDb();

    const [cinemaPasses, bundlePasses] = await Promise.all([
      movieDb.cinemaPass.findMany({ where: { isActive: true } }),
      subDb.bundlePass.findMany({ where: { isActive: true } }),
    ]);

    const passes = [
      ...cinemaPasses.map((cp) => ({
        id: cp.id,
        name: cp.name,
        type: 'pass' as const,
        description: cp.description || 'Cinema & Premieres Access Pass',
        price: Number(cp.price),
        currency: cp.currency || 'NGN',
        features: cp.features || ['HD & 4K Streaming', 'Zero Ads', 'Offline Downloads'],
      })),
      ...bundlePasses.map((bp) => ({
        id: bp.id,
        name: bp.name,
        type: 'bundle' as const,
        description: bp.description,
        price: Number(bp.price),
        currency: 'NGN',
        features: ['Access to multiple universes', 'Exclusive Premieres', 'Full Archive'],
      })),
    ];

    const coinPacks = [
      {
        id: 'coins-100',
        name: '100 Voting Coins',
        type: 'coins' as const,
        description: 'Reality TV evictions & Super-Votes',
        price: 1000,
        coins: 100,
      },
      {
        id: 'coins-500',
        name: '500 Voting Coins (10% Bonus)',
        type: 'coins' as const,
        description: 'High-stake eviction voting pack',
        price: 4500,
        coins: 500,
      },
      {
        id: 'coins-1200',
        name: '1,200 Voting Coins (20% Bonus)',
        type: 'coins' as const,
        description: 'Tribal Council Super-Vote Power Pack',
        price: 10000,
        coins: 1200,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        passes,
        coinPacks,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query products';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
