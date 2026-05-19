'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';

const mockTransactions = [
  {
    id: '1',
    type: 'deposit',
    amount: 5000,
    description: 'Wallet deposit via card',
    date: 'Today, 2:30 PM',
    status: 'success',
  },
  {
    id: '2',
    type: 'purchase',
    amount: 1500,
    description: 'Movie rental: The African Queen',
    date: 'Yesterday, 7:45 PM',
    status: 'success',
  },
  {
    id: '3',
    type: 'withdraw',
    amount: 2000,
    description: 'Withdrawal to bank account',
    date: 'Dec 15, 10:20 AM',
    status: 'pending',
  },
];

const mockPaymentMethods = [
  { id: '1', type: 'card', last4: '4242', expiry: '12/28', isDefault: true },
  { id: '2', type: 'bank', name: 'Access Bank', last4: '8888', isDefault: false },
];

export default function WalletPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(12500);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: gradients.primary }}>
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold hidden sm:block" style={{ color: colors.text.primary }}>Azeebo+</h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Wallet'].map((item) => (
              <Link
                key={item}
                href={item === 'Home' ? '/' : item === 'Wallet' ? '/wallet' : `/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Wallet' ? colors.primary[500] : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="medium" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{user?.name}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Balance Section */}
      <section className="py-12" style={{ background: gradients.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <Skeleton height="200px" className="w-full" />
          ) : (
            <div className="text-center">
              <p className="text-white/80 mb-2">Your Wallet Balance</p>
              <h2 className="text-6xl font-bold text-white mb-6">₦{balance.toLocaleString()}</h2>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" style={{ backgroundColor: 'white', color: colors.primary[600] }}>
                  <span>💰</span> Deposit
                </Button>
                <Button size="lg" variant="outline" style={{ borderColor: 'white', color: 'white' }}>
                  <span>💳</span> Withdraw
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
              Payment Methods
            </h2>
            <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
              Manage your payment methods
            </p>
          </div>
          <Button variant="outline">
            <span>➕</span> Add Method
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method) => (
            <Card key={method.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg.tertiary }}>
                  <span className="text-2xl">{method.type === 'card' ? '💳' : '🏦'}</span>
                </div>
                <div>
                  <p className="font-medium" style={{ color: colors.text.primary }}>
                    {method.type === 'card' ? `•••• ${method.last4}` : method.name}
                  </p>
                  {method.type === 'card' && (
                    <p className="text-sm" style={{ color: colors.text.secondary }}>Expires {method.expiry}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault && <Badge variant="success">Default</Badge>}
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section className="py-12" style={{ backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.text.primary }}>
                Transaction History
              </h2>
              <p className="text-base mt-1" style={{ color: colors.text.secondary }}>
                View all your transactions
              </p>
            </div>
            <Button variant="ghost">View All</Button>
          </div>

          <Card padding="md">
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-gray-700 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: transaction.type === 'deposit' ? `${colors.success[500]}20` : transaction.type === 'purchase' ? `${colors.primary[500]}20` : `${colors.warning[500]}20` }}>
                      <span className="text-2xl">{transaction.type === 'deposit' ? '⬆️' : transaction.type === 'purchase' ? '🎬' : '⬇️'}</span>
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: colors.text.primary }}>{transaction.description}</p>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg" style={{ color: transaction.type === 'deposit' ? colors.success[500] : colors.text.primary }}>
                      {transaction.type === 'deposit' ? '+' : '-'}{' '}₦{transaction.amount.toLocaleString()}
                    </p>
                    <Badge variant={transaction.status === 'success' ? 'success' : 'warning'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Azeebo+</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Help</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Legal</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>Connect</h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li key={item} className="text-sm hover:text-gray-200 transition-colors cursor-pointer">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm" style={{ borderColor: colors.border.light, color: colors.text.tertiary }}>
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
