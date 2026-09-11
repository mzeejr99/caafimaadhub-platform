import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import SyncBanner from './SyncBanner';
import GlobalSearchModal from './GlobalSearchModal';
import ToastContainer from '../common/ToastContainer';
import PullToRefresh from '../common/PullToRefresh';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <PullToRefresh>
      <div className="flex h-screen w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden overflow-y-hidden transition-colors duration-200">
        {/* Pinned & Docked Sidebar on Desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Full-Width Content Container */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <Topbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onOpenSearch={() => setSearchOpen(true)}
          />
          <SyncBanner />

          <main className="flex-1 overflow-y-auto w-full bg-slate-50 dark:bg-slate-950">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>

        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <ToastContainer />
      </div>
    </PullToRefresh>
  );
}
