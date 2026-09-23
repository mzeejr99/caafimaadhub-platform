import React from 'react';

export default function ProgressGauge({
  label,
  value = 0,
  target = 100,
  unit = '%',
  color = 'teal',
  subtitle
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / target) * 100)));

  const colorMap = {
    teal:    { bar: 'bg-teal-600',    text: 'text-teal-700 dark:text-teal-400' },
    blue:    { bar: 'bg-blue-600',    text: 'text-blue-700 dark:text-blue-400' },
    emerald: { bar: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-400' },
    amber:   { bar: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400' },
    red:     { bar: 'bg-red-600',     text: 'text-red-700 dark:text-red-400' }
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-xs font-bold ${c.text}`}>
          {value}{unit} / {target}{unit} ({percentage}%)
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${c.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
