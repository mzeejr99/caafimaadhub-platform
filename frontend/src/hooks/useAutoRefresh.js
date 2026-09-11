import { useEffect, useRef } from 'react';

/**
 * useAutoRefresh
 * Periodically and silently executes a fetch function in the background.
 * Automatically pauses when window/tab is hidden to save resources,
 * and immediately triggers a silent refresh when tab regains visibility/focus.
 * 
 * @param {Function} fetchCallback - Async or sync function that refreshes data
 * @param {number} intervalMs - Polling interval in ms (default 12000ms / 12s)
 * @param {boolean} enabled - Whether auto refresh is active (default true)
 */
export function useAutoRefresh(fetchCallback, intervalMs = 12000, enabled = true) {
  const savedCallback = useRef(fetchCallback);
  const isMountedRef = useRef(true);

  useEffect(() => {
    savedCallback.current = fetchCallback;
  }, [fetchCallback]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!enabled) return;

    let timerId = null;

    const executeSilentRefresh = async () => {
      if (!isMountedRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        if (savedCallback.current) {
          await savedCallback.current(true); // pass isSilent = true
        }
      } catch (e) {
        // Silently catch background poll errors
      }
    };

    timerId = setInterval(executeSilentRefresh, intervalMs);

    // Immediate silent refresh on tab visibility / window focus
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current) {
        executeSilentRefresh();
      }
    };

    const handleWindowFocus = () => {
      if (isMountedRef.current) {
        executeSilentRefresh();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMountedRef.current = false;
      if (timerId) clearInterval(timerId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [intervalMs, enabled]);
}

export default useAutoRefresh;
