import React, { createContext, useContext, useState, useEffect } from 'react';
import syncManager from '../offline/syncManager';

const OfflineContext = createContext();

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(navigator.onLine ? 'ONLINE' : 'OFFLINE');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('ONLINE');
      syncManager.syncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync manager events
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.status === 'SYNCING') {
        setSyncStatus('SYNCING');
      } else if (event.status === 'SYNC_COMPLETE') {
        setSyncStatus('SYNC_COMPLETE');
        syncManager.getPendingCount().then(setPendingCount);
      } else if (event.status === 'SYNC_FAILED') {
        setSyncStatus('SYNC_FAILED');
      }
      if (event.count !== undefined) {
        setPendingCount(event.count);
      }
    });

    // Initial pending count
    syncManager.getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = async () => {
    return await syncManager.syncAll();
  };

  return (
    <OfflineContext.Provider value={{ isOnline, syncStatus, pendingCount, triggerSync }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
