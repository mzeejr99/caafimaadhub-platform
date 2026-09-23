import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { applyUpdate } from '../../offline/serviceWorkerRegistration';

/**
 * UpdatePromptBanner
 * Shown at the top of the screen when a new version of the PWA is available.
 * Disappears automatically after 60 s if the user ignores it.
 * Clicking "Refresh" tells the waiting Service Worker to activate immediately.
 */
export default function UpdatePromptBanner({ registration, onDismiss }) {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after 60 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 60_000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    applyUpdate(registration);
    // The page reloads automatically via the 'controllerchange' listener
    // in serviceWorkerRegistration.js
  }, [registration]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(92vw, 440px)',
        animation: 'slideDownFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #14b8a6 100%)',
          boxShadow: '0 8px 32px rgba(13, 148, 136, 0.45), 0 2px 8px rgba(0,0,0,0.18)',
          color: '#fff',
        }}
      >
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={18} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>
            Cusbooneysii cusub ayaa diyaar ah!
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.73rem', opacity: 0.85, lineHeight: 1.3 }}>
            New version available — tap Refresh to update now.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.22)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
        >
          <RefreshCw size={13} />
          Refresh
        </button>

        {/* Dismiss (X) */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
