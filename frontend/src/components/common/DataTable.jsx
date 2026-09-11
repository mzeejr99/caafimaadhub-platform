import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder,
  filterComponent,
  pagination,
  onPageChange,
  onRowClick,
  emptyMessage,
  emptySubtitle,
  actions
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-200">
      {/* Table Toolbar */}
      {(onSearchChange || filterComponent || actions) && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            {onSearchChange && (
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder || t('table.search_records')}
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            )}
            {filterComponent}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Table Body */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/80 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200/70 dark:bg-slate-800 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{emptyMessage || t('common.no_data')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {emptySubtitle || t('common.try_different_filters')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 text-slate-700 dark:text-slate-200 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.total > 0 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            {t('table.showing')}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(pagination.total, pagination.offset + 1)}</span>{' '}
            {t('table.to')}{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {Math.min(pagination.total, pagination.offset + pagination.limit)}
            </span>{' '}
            {t('table.of')} <span className="font-semibold text-slate-700 dark:text-slate-200">{pagination.total}</span>{' '}
            {t('table.records')}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.offset === 0}
              onClick={() => onPageChange && onPageChange(Math.max(0, pagination.offset - pagination.limit))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {Math.floor(pagination.offset / pagination.limit) + 1} /{' '}
              {Math.ceil(pagination.total / pagination.limit) || 1}
            </span>
            <button
              disabled={pagination.offset + pagination.limit >= pagination.total}
              onClick={() => onPageChange && onPageChange(pagination.offset + pagination.limit)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
