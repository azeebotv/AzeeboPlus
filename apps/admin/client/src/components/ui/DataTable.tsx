import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination, PaginationProps } from './Pagination';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pagination?: PaginationProps;
  actions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchQuery: controlledSearch,
  onSearchChange,
  selectedIds,
  onSelectionChange,
  pagination,
  actions,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  emptyAction,
  className = '',
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const searchValue = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalSearch(val);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Client-side filtering when search is not externally controlled
  const filteredData = useMemo(() => {
    if (controlledSearch !== undefined || !searchValue.trim()) return data;
    const lower = searchValue.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (val) => val && String(val).toLowerCase().includes(lower)
      )
    );
  }, [data, searchValue, controlledSearch]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Selection handlers
  const allSelected =
    data.length > 0 &&
    selectedIds !== undefined &&
    data.every((item) => selectedIds.includes(String(item[keyField])));

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => String(item[keyField])));
    }
  };

  const handleToggleRow = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden ${className}`}>
      {/* Top Toolbar */}
      {(searchable || actions) && (
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800">
          {searchable ? (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          ) : (
            <div />
          )}

          {actions && <div className="flex items-center gap-2 self-end sm:self-auto">{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-950/60 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 select-none">
            <tr>
              {onSelectionChange && (
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleAll}
                    aria-label="Select all rows"
                    className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-zinc-200' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-zinc-500">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-60" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {onSelectionChange && (
                    <td className="py-4 px-4">
                      <div className="w-4 h-4 bg-zinc-800 rounded" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="py-4 px-4">
                      <div className="h-4 bg-zinc-800/80 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="py-12"
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              sortedData.map((item) => {
                const id = String(item[keyField]);
                const isSelected = selectedIds?.includes(id);

                return (
                  <tr
                    key={id}
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      isSelected ? 'bg-zinc-800/30' : ''
                    }`}
                  >
                    {onSelectionChange && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(id)}
                          aria-label={`Select row ${id}`}
                          className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3.5 px-4 ${col.className || ''}`}>
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && <Pagination {...pagination} />}
    </div>
  );
}
