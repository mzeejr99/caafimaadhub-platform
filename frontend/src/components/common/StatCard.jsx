import React from 'react';
import { useNavigate } from 'react-router-dom';

const COLOR_MAP = {
  sky:     { ring: 'ring-sky-100 dark:ring-sky-900/30',      icon: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',         value: 'text-sky-700 dark:text-sky-300'      },
  teal:    { ring: 'ring-sky-100 dark:ring-sky-900/30',      icon: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',         value: 'text-sky-700 dark:text-sky-300'      },
  blue:    { ring: 'ring-blue-100 dark:ring-blue-900/30',    icon: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',       value: 'text-blue-700 dark:text-blue-300'    },
  emerald: { ring: 'ring-sky-100 dark:ring-sky-900/30',     icon: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',         value: 'text-sky-700 dark:text-sky-300'      },
  amber:   { ring: 'ring-amber-100 dark:ring-amber-900/30',   icon: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',     value: 'text-amber-700 dark:text-amber-300'   },
  red:     { ring: 'ring-red-100 dark:ring-red-900/30',     icon: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',         value: 'text-red-700 dark:text-red-300'     },
  purple:  { ring: 'ring-purple-100 dark:ring-purple-900/30',  icon: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',   value: 'text-purple-700 dark:text-purple-300'  },
  slate:   { ring: 'ring-slate-200 dark:ring-slate-800',   icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',     value: 'text-slate-700 dark:text-slate-200'   },
  orange:  { ring: 'ring-orange-100 dark:ring-orange-900/30',  icon: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400',   value: 'text-orange-700 dark:text-orange-300'  },
};

export default function StatCard({ value, label, icon: Icon, color = 'sky', subtitle, to, onClick, className = '' }) {
  const navigate = useNavigate();
  const c = COLOR_MAP[color] || COLOR_MAP.sky;
  const isClickable = !!to || !!onClick;

  const handleClick = () => {
    if (to) navigate(to);
    if (onClick) onClick();
  };

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex items-start gap-4 transition-all ring-1 ${c.ring} dark:ring-slate-800 ${
        isClickable
          ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] hover:border-slate-300 dark:hover:border-slate-700'
          : 'hover:shadow-md'
      } ${className}`}
    >
      <div className={`p-3 rounded-xl ${c.icon} shrink-0 mt-0.5`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide truncate">{label}</p>
        <p className={`text-3xl font-extrabold ${c.value} leading-tight mt-1`}>
          {value != null ? value : '—'}
        </p>
        {subtitle && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
