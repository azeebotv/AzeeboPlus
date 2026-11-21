'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  CreditCard,
  Coins,
  ArrowRight,
  Sparkles,
  Percent,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface CartItem {
  id: string;
  itemId: string;
  itemType: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

interface ProductItem {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  currency: string;
}

export default function CartCheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('AZEEBO15');
  const [appliedVoucher, setAppliedVoucher] = useState('AZEEBO15');
  const [voucherMessage, setVoucherMessage] = useState('15% discount applied successfully');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'coins' | 'transfer'>('coins');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCartAndProducts() {
      try {
        const [cartRes, productsRes] = await Promise.all([
          fetch('/api/cart'),
          fetch('/api/cart/products'),
        ]);

        const [cartJson, productsJson] = await Promise.all([cartRes.json(), productsRes.json()]);

        if (isMounted) {
          if (cartJson.success) {
            setItems(cartJson.data.items);
            if (cartJson.data.voucherCode) {
              setAppliedVoucher(cartJson.data.voucherCode);
              setVoucherCode(cartJson.data.voucherCode);
            }
          }
          if (productsJson.success) {
            setAvailableProducts([...productsJson.data.passes, ...productsJson.data.coinPacks]);
          }
        }
      } catch (err) {
        console.error('Failed to load cart and products from DB:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCartAndProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty <= 0) {
      await removeItem(id);
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, quantity: newQty }),
      });
    } catch (err) {
      console.error('Failed to update item quantity in DB:', err);
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/cart?itemId=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete item from DB:', err);
    }
  };

  const addProductToCart = async (prod: ProductItem) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: prod.id,
          itemType: prod.type,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          quantity: 1,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.items) {
        setItems(
          json.data.items.map((i: Record<string, unknown>) => ({
            id: i.id as string,
            itemId: i.itemId as string,
            itemType: i.itemType as string,
            name: i.name as string,
            description: i.description as string,
            price: Number(i.price),
            quantity: i.quantity as number,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to add product to DB cart:', err);
    }
  };

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (code === 'AZEEBO15') {
      setAppliedVoucher('AZEEBO15');
      setVoucherMessage('15% discount applied successfully');
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: 'AZEEBO15' }),
      });
    } else if (code === 'VIP50') {
      setAppliedVoucher('VIP50');
      setVoucherMessage('50% VIP discount applied');
      await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode: 'VIP50' }),
      });
    } else {
      setAppliedVoucher('');
      setVoucherMessage('Invalid promotional voucher code');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountRate = appliedVoucher === 'AZEEBO15' ? 0.15 : appliedVoucher === 'VIP50' ? 0.5 : 0;
  const discount = Math.round(subtotal * discountRate);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsOrderComplete(true);
    }, 1500);
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-24 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="border-b border-az-glass-border pb-6 mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-az-flame text-sm font-semibold tracking-wider uppercase mb-2">
                <ShoppingBag className="h-4 w-4" />
                <span>Commerce & Passes</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Cart & Checkout
              </h1>
              <p className="text-az-ink-muted mt-2 text-sm sm:text-base">
                Review your passes, voting coin bundles, and subscription add-ons before checkout.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {isOrderComplete ? (
          /* Confirmation Screen */
          <GlowCard>
            <div className="p-10 sm:p-14 text-center max-w-xl mx-auto">
              <div className="h-20 w-20 rounded-full bg-az-success-500/10 border border-az-success-500/30 text-az-success-400 mx-auto flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-black text-white">Order Confirmed!</h2>
              <p className="text-az-ink-muted mt-2 text-sm leading-relaxed">
                Your passes and coin bundles have been provisioned to your Azeebo account. You are
                ready to stream and vote.
              </p>

              <div className="my-6 p-4 rounded-xl bg-az-surface-panel border border-az-glass-border text-xs text-az-ink-muted font-mono">
                Transaction ID: TX-{Math.floor(Math.random() * 900000 + 100000)} • Amount Paid: ₦
                {total.toLocaleString()}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                <Link
                  href="/wallet"
                  className="px-6 py-2.5 rounded-xl border border-az-glass-border bg-az-surface-panel hover:bg-az-surface-panel/80 text-white font-semibold text-sm transition-colors"
                >
                  View Wallet Balance
                </Link>
                <Link
                  href="/movies"
                  className="px-6 py-2.5 rounded-xl bg-az-flame text-az-surface-root font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Start Watching Movies
                </Link>
              </div>
            </div>
          </GlowCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Cart Items & Available Products */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-az-glass-border text-center">
                  <ShoppingBag className="h-10 w-10 text-az-ink-muted mx-auto mb-3 opacity-40" />
                  <h3 className="text-lg font-bold text-white">Your cart is empty</h3>
                  <p className="text-xs text-az-ink-muted mt-1">
                    Select a pass or coin package below to add it to your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-az-surface-panel/60 border border-az-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-black/60 border border-az-glass-border text-az-flame">
                            {item.itemType}
                          </span>
                          <h4 className="font-bold text-white text-base">{item.name}</h4>
                        </div>
                        {item.description && (
                          <p className="text-xs text-az-ink-muted mt-1">{item.description}</p>
                        )}
                        <div className="text-xs font-mono text-az-flame font-semibold mt-2">
                          ₦{item.price.toLocaleString()} each
                        </div>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-az-glass-border pt-3 sm:pt-0">
                        <div className="flex items-center gap-2 bg-black/40 rounded-xl border border-az-glass-border p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-az-surface-panel text-az-ink-muted hover:text-white transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-2">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-az-surface-panel text-az-ink-muted hover:text-white transition-colors"
                            title="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right sm:min-w-[80px]">
                          <span className="font-mono font-bold text-white text-sm">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-xl text-az-ink-muted hover:text-az-error-400 hover:bg-az-error-500/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Passes & Bundles from DB */}
              {availableProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-az-glass-border">
                  <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-az-flame" />
                    Available Passes & Bundles from Database
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableProducts.slice(0, 4).map((prod) => (
                      <div
                        key={prod.id}
                        className="p-4 rounded-xl border border-az-glass-border bg-az-surface-panel/30 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h5 className="font-bold text-white text-xs truncate">{prod.name}</h5>
                          <p className="text-[11px] text-az-ink-muted truncate">
                            {prod.description}
                          </p>
                          <span className="font-mono text-xs font-semibold text-az-flame">
                            ₦{prod.price.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addProductToCart(prod)}
                          className="px-3 py-1.5 rounded-lg bg-az-surface-panel border border-az-glass-border hover:border-az-flame text-xs font-bold text-white transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Order Summary & Checkout Card */}
            <div>
              <div className="sticky top-20 rounded-2xl border border-az-glass-border bg-az-surface-panel/60 p-6 space-y-6">
                <h3 className="font-bold text-lg text-white border-b border-az-glass-border pb-3">
                  Order Summary
                </h3>

                {/* Subtotal, Discount & Total */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-az-ink-muted">
                    <span>Subtotal</span>
                    <span className="font-mono text-white font-semibold">
                      ₦{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-az-success-400">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        Promo Discount ({appliedVoucher})
                      </span>
                      <span className="font-mono font-semibold">-₦{discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-az-glass-border pt-3 flex items-center justify-between text-sm">
                    <span className="font-bold text-white">Total Amount</span>
                    <span className="font-mono font-extrabold text-az-flame text-lg">
                      ₦{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Voucher Code Form */}
                <div>
                  <label className="block text-xs font-semibold text-az-ink-muted mb-1.5">
                    Promotional Voucher
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AZEEBO15"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-az-surface-root border border-az-glass-border text-xs text-white placeholder-az-ink-dim font-mono focus:outline-none focus:border-az-flame uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      className="px-4 py-2 rounded-xl bg-az-surface-panel border border-az-glass-border text-xs font-semibold text-white hover:bg-az-surface-panel/80 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {voucherMessage && (
                    <p
                      className={`text-[11px] mt-1.5 ${
                        appliedVoucher ? 'text-az-success-400' : 'text-az-error-400'
                      }`}
                    >
                      {voucherMessage}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-az-ink-muted mb-2">
                    Payment Channel
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('coins')}
                      className={`w-full p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        paymentMethod === 'coins'
                          ? 'bg-az-flame/15 border-az-flame text-white'
                          : 'bg-az-surface-panel/60 border-az-glass-border text-az-ink-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-az-flame" />
                        <span className="font-semibold text-white">Azeebo Coin Balance</span>
                      </div>
                      <span className="font-mono text-[11px]">Instant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        paymentMethod === 'card'
                          ? 'bg-az-flame/15 border-az-flame text-white'
                          : 'bg-az-surface-panel/60 border-az-glass-border text-az-ink-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-az-flame" />
                        <span className="font-semibold text-white">
                          Debit / Credit Card (Paystack)
                        </span>
                      </div>
                      <span className="font-mono text-[11px]">Naira / USD</span>
                    </button>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={items.length === 0 || isProcessing}
                  className="w-full py-3.5 rounded-xl bg-az-flame text-az-surface-root font-black text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                  {isProcessing ? (
                    'Provisioning Passes...'
                  ) : (
                    <>
                      Complete Checkout <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
