import { NextResponse } from 'next/server';
import { getMovieDb, getSubDb, getPaymentDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movieDb = getMovieDb();
    const subDb = getSubDb();
    const paymentDb = getPaymentDb();

    const [cinemaPasses, bundlePasses, dbCoinPackages] = await Promise.all([
      movieDb.cinemaPass.findMany({ where: { isActive: true } }),
      subDb.bundlePass.findMany({ where: { isActive: true } }),
      paymentDb.coinPackage.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
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

    const coinPacks = dbCoinPackages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      type: 'coins' as const,
      description: pkg.description || 'Voting coins pack',
      price: Number(pkg.price),
      coins: pkg.coins,
      bonus: pkg.bonus,
      isPopular: pkg.isPopular,
    }));

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
