import React from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOffline } from '../../contexts/OfflineContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SyncBanner() {
  const { isOnline, syncStatus, pendingCount, triggerSync } = useOffline();
  const { t } = useLanguage();

  // Hide banner completely during normal browsing or when synced
  if (syncStatus !== 'SYNCING' && syncStatus !== 'SYNC_FAILED') {
    return null;
  }

  return (
    <div
      className={`w-full px-4 py-2 text-xs font-medium flex items-center justify-between transition-all ${
        !isOnline
          ? 'bg-amber-600 text-white'
          : syncStatus === 'SYNCING'
          ? 'bg-blue-600 text-white animate-pulse'
          : syncStatus === 'SYNC_FAILED'
          ? 'bg-red-600 text-white'
          : 'bg-emerald-700 text-white'
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>{t('common.offline')}:</strong> {t('offline.banner_offline')} ({pendingCount} {t('offline.pending_records')})
            </span>
          </>
        ) : syncStatus === 'SYNCING' ? (
          <>
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            <span>{t('offline.banner_syncing')}</span>
          </>
        ) : syncStatus === 'SYNC_FAILED' ? (
          <>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{t('common.sync_failed')} — {t('offline.banner_failed')}</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('offline.banner_complete')}</span>
          </>
        )}
      </div>

      {pendingCount > 0 && isOnline && syncStatus !== 'SYNCING' && (
        <button
          onClick={triggerSync}
          className="ml-3 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.sync_now')}
        </button>
      )}
    </div>
  );
}
