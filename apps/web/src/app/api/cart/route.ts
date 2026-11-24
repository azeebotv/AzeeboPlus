import { NextRequest, NextResponse } from 'next/server';
import { getPaymentDb, getMovieDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'guest-session';

    const paymentDb = getPaymentDb();
    let cart = await paymentDb.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      // Seed default initial cart items from database if empty
      const movieDb = getMovieDb();
      const firstPass = await movieDb.cinemaPass.findFirst({ where: { isActive: true } });

      cart = await paymentDb.cart.create({
        data: {
          userId,
          voucherCode: 'AZEEBO15',
          items: {
            create: [
              {
                itemType: 'pass',
                itemId: firstPass?.id || 'pass-001',
                name: firstPass?.name || 'Nollywood Unlimited VIP Pass',
                description: 'Full monthly access to cinema releases & Nollywood premieres',
                price: firstPass ? Number(firstPass.price) : 4500,
                quantity: 1,
              },
              {
                itemType: 'coins',
                itemId: 'coins-500',
                name: 'Reality TV 500 Coin Bundle',
                description: 'Tribal Council eviction voting pack (+50 bonus coins)',
                price: 4500,
                quantity: 1,
              },
            ],
          },
        },
        include: { items: true },
      });
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const discount = cart.voucherCode === 'AZEEBO15' ? Math.round(subtotal * 0.15) : 0;
    const total = Math.max(0, subtotal - discount);

    return NextResponse.json({
      success: true,
      data: {
        id: cart.id,
        userId: cart.userId,
        voucherCode: cart.voucherCode,
        items: cart.items.map((i) => ({
          id: i.id,
          itemId: i.itemId,
          itemType: i.itemType,
          name: i.name,
          description: i.description,
          price: Number(i.price),
          quantity: i.quantity,
        })),
        subtotal,
        discount,
        total,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query cart';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = 'guest-session',
      itemId,
      itemType,
      name,
      description,
      price,
      quantity = 1,
    } = body;

    const paymentDb = getPaymentDb();
    const cart = await paymentDb.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await paymentDb.cartItem.findFirst({
      where: { cartId: cart.id, itemId },
    });

    if (existingItem) {
      await paymentDb.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await paymentDb.cartItem.create({
        data: {
          cartId: cart.id,
          itemId,
          itemType,
          name,
          description,
          price,
          quantity,
        },
      });
    }

    const updated = await paymentDb.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update cart';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId is required' }, { status: 400 });
    }

    const paymentDb = getPaymentDb();
    await paymentDb.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to delete cart item';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, quantity, voucherCode, userId = 'guest-session' } = body;

    const paymentDb = getPaymentDb();

    if (voucherCode !== undefined) {
      await paymentDb.cart.update({
        where: { userId },
        data: { voucherCode },
      });
    }

    if (itemId && typeof quantity === 'number') {
      if (quantity <= 0) {
        await paymentDb.cartItem.delete({ where: { id: itemId } });
      } else {
        await paymentDb.cartItem.update({
          where: { id: itemId },
          data: { quantity },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to modify cart';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
