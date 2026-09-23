import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Context Providers
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { NotificationProvider } from './contexts/NotificationContext';

// PWA
import * as serviceWorkerRegistration from './offline/serviceWorkerRegistration';
import UpdatePromptBanner from './components/common/UpdatePromptBanner';

// ── Root: owns the SW update state ──
function Root() {
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // SW registration fires a custom DOM event when an update is available.
    // We listen here so React state can be updated cleanly.
    const handler = (e) => setSwRegistration(e.detail);
    window.addEventListener('sw-update-available', handler);
    return () => window.removeEventListener('sw-update-available', handler);
  }, []);

  return (
    <>
      {/* PWA Update Banner — shown only when a new SW is waiting to activate */}
      {swRegistration && (
        <UpdatePromptBanner
          registration={swRegistration}
          onDismiss={() => setSwRegistration(null)}
        />
      )}

      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <OfflineProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </OfflineProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Register Service Worker with lifecycle callbacks
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Dispatch a custom event — Root's useEffect will pick this up
    window.dispatchEvent(
      new CustomEvent('sw-update-available', { detail: registration })
    );
  },
  onSuccess: () => {
    console.log('[App] PWA ready for offline use.');
  },
});
