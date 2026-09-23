/**
 * PWA Service Worker Registration
 * Handles registration and update lifecycle, including notifying the app
 * when a newer version of the SW is waiting to activate.
 */

/**
 * Register the service worker.
 * @param {Object} config - Optional callbacks: { onSuccess, onUpdate }
 *   onSuccess(registration) – fired when SW is registered for the first time (app is cached).
 *   onUpdate(registration)  – fired when a new SW version is waiting; caller should prompt
 *                             the user to reload.
 */
export function register(config = {}) {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered, scope:', registration.scope);

        // ── Already-waiting SW (e.g. page reloaded while update was pending) ──
        if (registration.waiting) {
          console.log('[SW] Update already waiting');
          config.onUpdate?.(registration);
          return;
        }

        // ── Watch for a new SW installing ──
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New SW installed while old one still controls the page → update available
                console.log('[SW] New content available – waiting for reload');
                config.onUpdate?.(registration);
              } else {
                // First-ever install – content is now cached for offline use
                console.log('[SW] Content cached for offline use');
                config.onSuccess?.(registration);
              }
            }
          });
        });

        // ── Reload automatically when the new SW takes control ──
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });
  });
}

/**
 * Tell the waiting SW to skip waiting and activate immediately.
 * Call this when the user clicks "Refresh" in the update banner.
 */
export function applyUpdate(registration) {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((err) => console.error('[SW] Unregister failed:', err.message));
  }
}
