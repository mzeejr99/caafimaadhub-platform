import React from 'react';

export default function Badge({ children, status, variant, className = '' }) {
  // Map various system statuses to color palettes
  const getBadgeStyle = () => {
    if (variant) {
      const variantMap = {
        success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        danger: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
        info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        teal: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
        purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
      };
      return variantMap[variant] || variantMap.neutral;
    }

    const s = (status || '').toUpperCase();
    if (['APPROVED', 'ACTIVE', 'COMPLETED', 'RESOLVED', 'SYNCED'].includes(s)) {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    }
    if (['PENDING', 'UNDER_REVIEW', 'PLANNED', 'REQUESTED', 'INVESTIGATING', 'LOW'].includes(s)) {
      return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    }
    if (['IN_PROGRESS', 'ACCEPTED', 'ASSIGNED', 'ISSUED', 'MEDIUM'].includes(s)) {
      return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    }
    if (['REJECTED', 'SUSPENDED', 'CANCELLED', 'FAILED', 'HIGH', 'CRITICAL', 'URGENT'].includes(s)) {
      return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60';
    }

    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 shrink-0" />
      {children || status}
    </span>
  );
}
