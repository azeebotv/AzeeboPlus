'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { webLogger } from '@/lib/logger';
import { api } from '@/lib/api';

interface MetricConfig {
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'unique';
  field: string;
  label: string;
  format?: string;
}

interface DimensionConfig {
  field: string;
  label: string;
  type: 'date' | 'string' | 'number' | 'boolean';
  format?: string;
}

interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value?: any;
  values?: any[];
}

interface CustomReport {
  id: string;
  name: string;
  description?: string;
  category: string;
  metrics: MetricConfig[];
  dimensions: DimensionConfig[];
  filters: FilterConfig[];
  dateField: string;
  dateRange: string;
  isPublic: boolean;
  createdAt: string;
}

interface ReportExecutionResult {
  success: boolean;
  data?: {
    results: any[];
    columns: string[];
  };
  error?: string;
  metadata?: {
    totalRows: number;
    executionTime: number;
    reportName: string;
    generatedAt: string;
  };
}

const AVAILABLE_METRICS: { value: string; label: string; type: MetricConfig['type'] }[] = [
  { value: 'userId', label: 'Users', type: 'count' },
  { value: 'contentId', label: 'Content Items', type: 'count' },
  { value: 'amount', label: 'Revenue', type: 'sum' },
  { value: 'amount', label: 'Average Amount', type: 'avg' },
  { value: 'viewCount', label: 'Total Views', type: 'sum' },
  { value: 'sessionId', label: 'Unique Sessions', type: 'unique' },
];

const AVAILABLE_DIMENSIONS: { value: string; label: string; type: DimensionConfig['type'] }[] = [
  { value: 'createdAt', label: 'Created Date', type: 'date' },
  { value: 'eventName', label: 'Event Name', type: 'string' },
  { value: 'platform', label: 'Platform', type: 'string' },
  { value: 'universe', label: 'Universe', type: 'string' },
  { value: 'status', label: 'Status', type: 'string' },
  { value: 'type', label: 'Type', type: 'string' },
];

const AVAILABLE_FILTERS = [
  { value: 'platform', label: 'Platform', operators: ['eq', 'in'] },
  { value: 'universe', label: 'Universe', operators: ['eq', 'in'] },
  { value: 'status', label: 'Status', operators: ['eq', 'in'] },
  { value: 'type', label: 'Type', operators: ['eq', 'in'] },
  { value: 'amount', label: 'Amount', operators: ['gt', 'gte', 'lt', 'lte', 'between'] },
];

export default function ReportBuilderPage(): JSX.Element {
  const router = useRouter();
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    category: 'general',
    metrics: [] as MetricConfig[],
    dimensions: [] as DimensionConfig[],
    filters: [] as FilterConfig[],
    dateField: 'createdAt',
    dateRange: '30d' as string,
    isPublic: false,
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (): Promise<void> => {
    try {
      const response = await api.admin.getCustomReports();
      if (response.success && response.data) {
        setReports(response.data as unknown as CustomReport[]);
      }
    } catch (error) {
      webLogger.error('Failed to load reports', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (): Promise<void> => {
    try {
      const response = await api.admin.createCustomReport(newReport as unknown as Parameters<typeof api.admin.createCustomReport>[0]);
      if (response.success) {
        setShowCreateForm(false);
        setNewReport({
          name: '',
          description: '',
          category: 'general',
          metrics: [],
          dimensions: [],
          filters: [],
          dateField: 'createdAt',
          dateRange: '30d',
          isPublic: false,
        });
        loadReports();
      }
    } catch (error) {
      webLogger.error('Failed to create report', error);
    }
  };

  const handleExecuteReport = async (): Promise<void> => {
    if (!selectedReport) return;

    setIsExecuting(true);
    try {
      const response = await api.admin.executeReport(selectedReport);
      setExecutionResult(response as unknown as ReportExecutionResult);
    } catch (error) {
      webLogger.error('Failed to execute report', error);
      setExecutionResult({
        success: false,
        error: 'Failed to execute report',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteReport = async (reportId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await api.admin.deleteCustomReport(reportId);
      if (response.success) {
        loadReports();
        if (selectedReport === reportId) {
          setSelectedReport(null);
          setExecutionResult(null);
        }
      }
    } catch (error) {
      webLogger.error('Failed to delete report', error);
    }
  };

  const addMetric = (metric: MetricConfig): void => {
    setNewReport((prev) => ({
      ...prev,
      metrics: [...prev.metrics, metric],
    }));
  };

  const removeMetric = (index: number): void => {
    setNewReport((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  const addDimension = (dimension: DimensionConfig): void => {
    setNewReport((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, dimension],
    }));
  };

  const removeDimension = (index: number): void => {
    setNewReport((prev) => ({
      ...prev,
      dimensions: prev.dimensions.filter((_, i) => i !== index),
    }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Custom Report Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and execute custom analytics reports
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {showCreateForm ? 'Cancel' : '+ New Report'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-card rounded-lg border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Create New Report</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) => setNewReport((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="e.g., Monthly Revenue Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={newReport.category}
                  onChange={(e) => setNewReport((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="general">General</option>
                  <option value="revenue">Revenue</option>
                  <option value="engagement">Engagement</option>
                  <option value="users">Users</option>
                  <option value="content">Content</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={newReport.description}
                onChange={(e) => setNewReport((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                rows={3}
                placeholder="Describe the purpose of this report..."
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {AVAILABLE_METRICS.map((metric) => (
                  <button
                    key={`${metric.value}-${metric.type}`}
                    onClick={() =>
                      addMetric({
                        type: metric.type,
                        field: metric.value,
                        label: metric.label,
                      })
                    }
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    + {metric.label} ({metric.type})
                  </button>
                ))}
              </div>
              {newReport.metrics.length > 0 && (
                <div className="space-y-2">
                  {newReport.metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-background border border-border rounded-lg"
                    >
                      <span className="text-sm text-foreground">
                        {metric.label} ({metric.type})
                      </span>
                      <button
                        onClick={() => removeMetric(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Dimensions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {AVAILABLE_DIMENSIONS.map((dimension) => (
                  <button
                    key={dimension.value}
                    onClick={() =>
                      addDimension({
                        field: dimension.value,
                        label: dimension.label,
                        type: dimension.type,
                      })
                    }
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    + {dimension.label}
                  </button>
                ))}
              </div>
              {newReport.dimensions.length > 0 && (
                <div className="space-y-2">
                  {newReport.dimensions.map((dimension, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-4 py-2 bg-background border border-border rounded-lg"
                    >
                      <span className="text-sm text-foreground">
                        {dimension.label} ({dimension.type})
                      </span>
                      <button
                        onClick={() => removeDimension(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date Range
                </label>
                <select
                  value={newReport.dateRange}
                  onChange={(e) => setNewReport((prev) => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newReport.isPublic}
                  onChange={(e) => setNewReport((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-primary"
                />
                <label htmlFor="isPublic" className="text-sm text-foreground">
                  Make this report public (visible to all users)
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateReport}
              disabled={!newReport.name || newReport.metrics.length === 0}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Report
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-foreground mb-4">Saved Reports</h2>
            {reports.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-6 text-center">
                <p className="text-muted-foreground">No reports created yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "New Report" to create your first custom report
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-card rounded-lg border border-border p-4 cursor-pointer transition-all hover:border-primary ${
                      selectedReport === report.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      setSelectedReport(report.id);
                      setExecutionResult(null);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{report.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.category} • {report.metrics.length} metrics • {report.dimensions.length} dimensions
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedReport ? (
              <div>
                <div className="bg-card rounded-lg border border-border p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Report Results</h2>
                    <button
                      onClick={handleExecuteReport}
                      disabled={isExecuting}
                      className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isExecuting ? 'Executing...' : 'Execute Report'}
                    </button>
                  </div>

                  {executionResult && executionResult.success && executionResult.data && (
                    <div>
                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <span>{executionResult.metadata?.totalRows} rows</span>
                        <span>{executionResult.metadata?.executionTime}ms</span>
                        <span>Generated: {new Date(executionResult.metadata?.generatedAt || '').toLocaleString()}</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              {executionResult.data.columns.map((column) => (
                                <th
                                  key={column}
                                  className="text-left py-3 px-4 text-sm font-semibold text-foreground"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {executionResult.data?.results.slice(0, 50).map((row: any, index: number) => (
                              <tr key={index} className="border-b border-border hover:bg-accent/50">
                                {executionResult.data?.columns.map((column: string) => (
                                  <td key={column} className="py-3 px-4 text-sm text-foreground">
                                    {typeof row[column] === 'number'
                                      ? formatNumber(row[column])
                                      : row[column]?.toString() || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {executionResult.data.results.length > 50 && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          Showing first 50 of {executionResult.data.results.length} rows
                        </p>
                      )}
                    </div>
                  )}

                  {executionResult && !executionResult.success && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700">{executionResult.error}</p>
                    </div>
                  )}

                  {!executionResult && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Click "Execute Report" to generate results
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select a Report
                </h3>
                <p className="text-muted-foreground">
                  Choose a report from the list to view and execute it
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
