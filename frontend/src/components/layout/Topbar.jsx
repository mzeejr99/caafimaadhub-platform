import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  Menu, Search, Bell, LogOut, User, Globe, ChevronDown, Check, Sun, Moon
} from 'lucide-react';

export default function Topbar({ onToggleSidebar, onOpenSearch }) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t, formatRole } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const langRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserDropdown(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.fullName || user?.full_name || user?.email?.split('@')[0] || 'User';
  const rawRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : 'STAFF');
  const displayRole = formatRole(rawRole);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Left Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center justify-between gap-3 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-400 text-xs w-72 lg:w-80 transition-all shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-500 dark:text-slate-300 font-medium">{t('topbar.search_anything')}</span>
          </div>
          <kbd className="text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
            CTRL + K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{language === 'so' ? 'SO' : 'EN'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs font-semibold">
              <button
                onClick={() => { if (language !== 'en') toggleLanguage(); setShowLangDropdown(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${language === 'en' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-200'}`}
              >
                <span>English (EN)</span>
                {language === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { if (language !== 'so') toggleLanguage(); setShowLangDropdown(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${language === 'so' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40' : 'text-slate-700 dark:text-slate-200'}`}
              >
                <span>Af-Soomaali (SO)</span>
                {language === 'so' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 transition-colors cursor-pointer"
          title={language === 'so' ? 'Beddel Muuqaalka (Dark/Light)' : 'Toggle Dark/Light Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('topbar.alerts')}</h3>
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800"
                >
                  {t('topbar.mark_all_read')}
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">{t('topbar.no_notifications')}</div>
                ) : (
                  notifications.slice(0, 8).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-950/30 border-l-2 border-blue-400' : ''}`}
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title || notif.message}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{notif.time || notif.created_at || ''}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Header */}
        <div className="relative pl-1" ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {user?.avatarUrl || user?.avatar_url || user?.profile_image_url ? (
              <img
                src={user.avatarUrl || user.avatar_url || user.profile_image_url}
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-emerald-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-extrabold text-white shadow-sm ring-2 ring-emerald-100 dark:ring-emerald-900">
                {initial}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]">{displayName}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{displayRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center gap-3">
                {user?.avatarUrl || user?.avatar_url || user?.profile_image_url ? (
                  <img
                    src={user.avatarUrl || user.avatar_url || user.profile_image_url}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    {displayRole}
                  </span>
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    if (user?.role === 'VOLUNTEER') navigate('/volunteer/profile');
                    else if (user?.role === 'PUBLIC_USER') navigate('/community/settings');
                    else navigate('/admin/profile');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" /> {t('topbar.my_profile')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {t('topbar.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
