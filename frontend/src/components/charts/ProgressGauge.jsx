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

  const colorClasses = {
    teal: 'bg-teal-600 text-teal-700 border-teal-200',
    blue: 'bg-blue-600 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-600 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-500 text-amber-700 border-amber-200',
    red: 'bg-red-600 text-red-700 border-red-200'
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className={`text-xs font-bold ${colorClasses[color] ? colorClasses[color].split(' ')[1] : 'text-teal-700'}`}>
          {value}{unit} / {target}{unit} ({percentage}%)
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            colorClasses[color] ? colorClasses[color].split(' ')[0] : 'bg-teal-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
