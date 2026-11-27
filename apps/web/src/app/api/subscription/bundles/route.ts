import { NextResponse } from 'next/server';
import { getSubDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subDb = getSubDb();
    const bundles = await subDb.bundlePass.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    const formatted = bundles.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description || 'Access bundle',
      universeIds: b.universeIds || [],
      originalPrice: Number(b.originalPrice || b.price),
      price: Number(b.price),
      discountPercent: b.discountPercent || 0,
      duration: b.duration || 30,
      tier: b.tier || 'standard',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query bundles';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
