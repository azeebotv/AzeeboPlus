'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface AuditLog {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  result: 'success' | 'failure';
  ipAddress: string;
  userAgent: string;
  details: string;
}

export default function AuditLogsPage(): JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [filter, page]);

  const loadLogs = async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filter !== 'all' && { action: filter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const result = await apiFetch<{ logs: AuditLog[]; hasMore: boolean }>(
        `/api/v1/admin/audit-logs?${params}`
      );

      if (result.success && result.data) {
        if (page === 1) {
          setLogs(result.data.logs);
        } else {
          setLogs((prev) => [...prev, ...result.data!.logs]);
        }
        setHasMore(result.data.hasMore);
      }
    } catch (error) {
      webLogger.error('Failed to load audit logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResultColor = (result: string): string => {
    return result === 'success' ? 'text-green-500' : 'text-red-500';
  };

  const getActionIcon = (action: string): string => {
    if (action.includes('login')) return '🔐';
    if (action.includes('payment')) return '💰';
    if (action.includes('role')) return '👤';
    if (action.includes('content')) return '📝';
    if (action.includes('admin')) return '⚙️';
    return '📋';
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">Track all platform activities and changes</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-muted border border-border rounded-lg text-foreground"
            >
              <option value="all">All Actions</option>
              <option value="login">Authentication</option>
              <option value="payment">Payments</option>
              <option value="role">Role Changes</option>
              <option value="content">Content</option>
              <option value="admin">Admin Actions</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-border hover:bg-accent/50">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{log.actor}</p>
                        <p className="text-xs text-muted-foreground">{log.actorRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{getActionIcon(log.action)}</span>
                        <span className="text-sm text-foreground">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.resource}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${getResultColor(log.result)}`}>
                        {log.result.charAt(0).toUpperCase() + log.result.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-foreground mb-2">No audit logs found</h2>
              <p className="text-muted-foreground">Adjust your filters or search criteria</p>
            </div>
          )}

          {hasMore && (
            <div className="p-4 border-t border-border text-center">
              <button
                onClick={() => setPage(page + 1)}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
