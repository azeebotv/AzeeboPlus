import { NextResponse } from 'next/server';
import { getPaymentDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const paymentDb = getPaymentDb();
    const packages = await paymentDb.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const votePacks = packages.map((pkg) => ({
      id: pkg.id,
      label: `${pkg.coins.toLocaleString()} Votes`,
      votes: pkg.coins,
      coins: Math.max(1, Math.round(pkg.coins / 10)),
      price: Number(pkg.price),
      currency: pkg.currency,
      popular: pkg.isPopular,
      bonus: pkg.bonus,
    }));

    return NextResponse.json({
      success: true,
      data: votePacks,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query vote packages';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
