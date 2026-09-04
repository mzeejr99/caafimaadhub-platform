import React, { useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-7xl',
};

/**
 * Reusable FormModal with Dark Mode Slate/Navy Theme (#0F172A / #1E293B)
 * Drop shadows, rounded-2xl, and responsive behavior
 */
export default function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  avatarUrl,
  badge,
  children,
  size = 'lg',
  maxWidth,
  footer
}) {
  const widthClass = maxWidth || SIZE_MAP[size] || SIZE_MAP.lg;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-all w-full ${widthClass} z-10`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="w-11 h-11 rounded-xl object-cover border border-teal-500/40 shrink-0 shadow-md ring-2 ring-teal-500/20"
                />
              ) : Icon ? (
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-xs">
                  {React.createElement(Icon, { className: 'w-5 h-5' })}
                </div>
              ) : null}
              <div>
                <div className="flex items-center gap-2">
                  {title && (
                    <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {title}
                    </h3>
                  )}
                  {badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                      {badge}
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer border border-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[78vh] overflow-y-auto text-slate-800 dark:text-slate-200">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-3.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
