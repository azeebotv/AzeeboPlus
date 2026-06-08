import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Skeleton, Badge, Chip, Table, Tbody, Td, Th, Thead, Tr } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EarningsPage(): JSX.Element {
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    let cancelled = false;

    async function fetchEarnings() {
      try {
        setIsLoading(true);
        setError(null);

        const [earningsResponse, transactionsResponse] = await Promise.all([
          api.wallet.getEarnings({ range: timeRange }),
          api.wallet.getTransactions({ limit: 20, offset: 0 }),
        ]);

        if (cancelled) return;

        if (earningsResponse.success && transactionsResponse.success) {
          setEarnings(earningsResponse.data);
          setTransactions(transactionsResponse.data.items || []);
        } else {
          const msg = !earningsResponse.success ? earningsResponse.message : transactionsResponse.message;
          setError(msg || 'Failed to load earnings');
          webLogger.error('Failed to load creator earnings', {
            earningsError: earningsResponse.message,
            transactionsError: transactionsResponse.message,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load creator earnings', { error: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchEarnings();
    return () => { cancelled = true; };
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Earnings
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
              7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
              90 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('all')} disabled={timeRange === 'all'}>
              All Time
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="none">
                <Skeleton height="120px" />
              </Card>
            ))}
          </div>

          <div className="h-96">
            <Card padding="none">
              <Skeleton height="90%" />
            </Card>
          </div>

          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} padding="none">
                <Skeleton height="80px" />
                <Skeleton width="60%" height="20px" className="mt-3" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Earnings
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
              7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
              90 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('all')} disabled={timeRange === 'all'}>
              All Time
            </Button>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Earnings
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
            7 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
            30 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
            90 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('all')} disabled={timeRange === 'all'}>
            All Time
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Total Earnings
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : timeRange === '90d' ? 'Quarterly' : 'All Time'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                ₦{earnings?.totalEarnings?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {earnings?.pendingEarnings?.toLocaleString() || '0'} pending withdrawal
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Withdrawable Balance
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : timeRange === '90d' ? 'Quarterly' : 'All Time'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                ₦{earnings?.withdrawableBalance?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {earnings?.withdrawableChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Average Earning per Content
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : timeRange === '90d' ? 'Quarterly' : 'All Time'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                ₦{earnings?.avgEarningPerContent?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {earnings?.avgEarningChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Earnings Trend Chart */}
      <Card padding="none">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
            Earnings Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={earnings?.earningsTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fillColor="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card padding="none">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              Recent Transactions
            </h3>
            <Link href="/creators/wallet/transactions" className="text-sm text-primary-600 hover:underline">
              View All
            </Link>
          </div>

          {transactions.length > 0 ? (
            <Table>
              <thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Description</Th>
                  <Th className="text-right">Amount (₦)</Th>
                  <Th>Status</Th>
                </Tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td>{new Date(tx.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <svg
                          className={tx.type === 'credit' ? 'h-4 w-4 text-green-500' : 'h-4 w-4 text-red-500'}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={tx.type === 'credit' ? 'M12 8v4l3 3' : 'M12 16V8m0 0l-3-3m3 3-3-3m3 3V8'}
                          />
                        </svg>
                        {tx.description}
                      </div>
                    </Td>
                    <Td className="text-right font-medium">
                      {tx.type === 'credit' ? `+${tx.amount?.toLocaleString() || '0'}` : `-${tx.amount?.toLocaleString() || '0'}`}
                    </Td>
                    <Td>
                      <Badge
                        variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}