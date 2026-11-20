'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Coins,
  CreditCard,
  Building,
  ShieldCheck,
  ArrowRight,
  Check,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface CartItem {
  id: string;
  name: string;
  type: string;
  priceNgn: number;
  priceCoins: number;
  quantity: number;
  universe: string;
  badge: string;
}

const INITIAL_CART: CartItem[] = [
  {
    id: 'cart-1',
    name: 'The Nollywood Heist – 48h Cinema Pass',
    type: 'Movie Pass (4K UHD + Dolby Atmos)',
    priceNgn: 2500,
    priceCoins: 250,
    quantity: 1,
    universe: 'movies',
    badge: '🎬 Cinemaxis',
  },
  {
    id: 'cart-2',
    name: 'Survivor Titans – 1,000 Super-Vote Bundle',
    type: 'Reality Multiplier Pack',
    priceNgn: 1000,
    priceCoins: 100,
    quantity: 1,
    universe: 'reality',
    badge: '📺 Reality TV',
  },
];

export default function CartCheckoutPage(): React.JSX.Element {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'bank'>('wallet');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotalNgn = cart.reduce((sum, item) => sum + item.priceNgn * item.quantity, 0);
  const subtotalCoins = cart.reduce((sum, item) => sum + item.priceCoins * item.quantity, 0);
  const discountNgn = promoApplied ? subtotalNgn * 0.15 : 0;
  const totalNgn = subtotalNgn - discountNgn;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'AZEEBO15') {
      setPromoApplied(true);
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutSuccess(true);
      setCart([]);
    }, 1500);
  };

  return (
    <PageShell maxWidth="full">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-az-pill bg-az-flame/15 px-3 py-1 text-xs font-bold text-az-flame uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Secure Checkout & Cinema Passes
            </span>
          </div>
          <h1 className="az-heading text-az-ink font-extrabold text-3xl sm:text-4xl mb-6">
            Your Azeebo+ Cart
          </h1>
        </ScrollReveal>

        {checkoutSuccess ? (
          <GlowCard className="p-8 text-center max-w-xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-az-success-500/20 text-az-success-400">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="az-heading text-az-ink font-bold text-2xl">
                Order Completed Successfully!
              </h2>
              <p className="az-caption text-az-ink-muted mt-2">
                Your passes and vote coins are activated instantly in your wallet.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link href="/movies/passes">
                <button
                  type="button"
                  className="rounded-az-pill bg-az-flame px-6 py-2.5 text-xs font-bold text-az-surface-root shadow"
                >
                  View Active Passes
                </button>
              </Link>
              <Link href="/home">
                <button
                  type="button"
                  className="rounded-az-pill border border-az-glass-border px-5 py-2.5 text-xs font-bold text-az-ink hover:bg-az-surface-panel transition-colors"
                >
                  Return Home
                </button>
              </Link>
            </div>
          </GlowCard>
        ) : cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items List (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="rounded-az-card border border-az-glass-border bg-az-surface-root p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-az-flame uppercase">
                      {item.badge}
                    </span>
                    <h3 className="az-subtitle text-az-ink font-bold truncate mt-0.5">
                      {item.name}
                    </h3>
                    <p className="az-caption text-az-ink-muted">{item.type}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-extrabold text-az-ink">
                      <span>₦{(item.priceNgn * item.quantity).toLocaleString()}</span>
                      <span className="text-az-ink-muted">•</span>
                      <span className="text-az-warning-400 flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {(item.priceCoins * item.quantity).toLocaleString()} Coins
                      </span>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-az-control border border-az-glass-border bg-az-surface-panel p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="rounded p-1 text-az-ink-muted hover:text-az-ink"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-az-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="rounded p-1 text-az-ink-muted hover:text-az-ink"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded p-2 text-az-ink-muted hover:text-az-error-400 hover:bg-az-surface-panel transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="rounded-az-card border border-az-glass-border bg-az-surface-root p-6 space-y-6 shadow-xl">
              <h2 className="az-title text-az-ink font-bold text-base border-b border-az-glass-border pb-3">
                Order Summary
              </h2>

              {/* Promo Code Form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code (e.g. AZEEBO15)"
                  className="flex-1 rounded-az-control border border-az-glass-border bg-az-surface-panel px-3 py-1.5 text-xs text-az-ink uppercase focus:border-az-flame focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-az-control bg-az-surface-panel px-3 py-1.5 text-xs font-bold text-az-ink hover:bg-az-surface-edge transition-colors border border-az-glass-border"
                >
                  Apply
                </button>
              </form>
              {promoApplied && (
                <span className="text-[11px] font-bold text-az-success-400 block -mt-4">
                  ✓ 15% VIP discount applied
                </span>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="az-caption text-az-ink-muted font-bold uppercase tracking-wider block">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`w-full rounded-az-control border p-3 text-left text-xs transition-colors flex items-center justify-between ${
                      paymentMethod === 'wallet'
                        ? 'border-az-flame bg-az-flame/15 text-az-ink'
                        : 'border-az-glass-border bg-az-surface-panel text-az-ink-dim'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Coins className="h-4 w-4 text-az-warning-400" />
                      <span className="font-bold">Azeebo Coin Balance (1,450 Coins)</span>
                    </div>
                    <span className="text-[10px] font-bold text-az-success-400">Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full rounded-az-control border p-3 text-left text-xs transition-colors flex items-center justify-between ${
                      paymentMethod === 'card'
                        ? 'border-az-flame bg-az-flame/15 text-az-ink'
                        : 'border-az-glass-border bg-az-surface-panel text-az-ink-dim'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-az-secondary-400" />
                      <span className="font-bold">Debit / Credit Card (Paystack)</span>
                    </div>
                    <span className="text-[10px] text-az-ink-muted">Mastercard/Visa/Verve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`w-full rounded-az-control border p-3 text-left text-xs transition-colors flex items-center justify-between ${
                      paymentMethod === 'bank'
                        ? 'border-az-flame bg-az-flame/15 text-az-ink'
                        : 'border-az-glass-border bg-az-surface-panel text-az-ink-dim'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building className="h-4 w-4 text-az-flame" />
                      <span className="font-bold">Bank Transfer / USSD</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-az-glass-border">
                <div className="flex justify-between text-az-ink-muted">
                  <span>Subtotal</span>
                  <span className="font-bold text-az-ink">₦{subtotalNgn.toLocaleString()}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-az-success-400">
                    <span>Discount (15%)</span>
                    <span>-₦{discountNgn.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-az-ink-muted">
                  <span>Processing Fee</span>
                  <span className="font-bold text-az-ink">₦0 (Free)</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-az-ink pt-2 border-t border-az-glass-border">
                  <span>Total Amount</span>
                  <div className="text-right">
                    <span className="block text-az-flame text-base">
                      ₦{totalNgn.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-az-warning-400 font-bold block">
                      or {subtotalCoins.toLocaleString()} Coins
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <motion.button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full rounded-az-pill bg-az-flame py-3 text-xs font-bold text-az-surface-root shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCheckingOut ? (
                  'Processing Payment...'
                ) : (
                  <>
                    Confirm & Complete Checkout <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-az-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-az-success-400" />
                <span>256-Bit SSL Encrypted & CBN Licensed</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-az-card border border-az-glass-border bg-az-surface-root p-12 text-center max-w-md mx-auto space-y-4">
            <ShoppingCart className="h-12 w-12 text-az-ink-muted mx-auto" />
            <h3 className="az-title text-az-ink font-bold">Your Cart is Empty</h3>
            <p className="az-caption text-az-ink-muted">
              Explore cinema passes, reality voting packs, or gaming tournament tickets.
            </p>
            <Link href="/movies/passes">
              <button
                type="button"
                className="rounded-az-pill bg-az-flame px-6 py-2.5 text-xs font-bold text-az-surface-root shadow"
              >
                Browse Passes
              </button>
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}
