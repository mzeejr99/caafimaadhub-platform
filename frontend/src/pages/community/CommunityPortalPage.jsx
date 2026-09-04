import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Heart, Megaphone, Siren, MessageSquare, ShieldCheck,
  LogOut, User, Globe, ChevronRight, Activity,
  MapPin, Users, ClipboardList, BarChart3, Bell,
  CheckCircle2, AlertTriangle, Info, Sun, Moon
} from 'lucide-react';

export default function CommunityPortalPage() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  useEffect(() => {
    api.get('/analytics/public')
      .then(d => { if (d && d.success) setStats(d.data); })
      .catch(() => {});

    api.get('/campaigns/public')
      .then(d => {
        if (d && d.success) setCampaigns((d.data || []).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoadingCampaigns(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.fullName || user?.email?.split('@')[0] || 'Community Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const actions = [
    {
      icon: Megaphone,
      title: t('portal.c_campaigns'),
      desc: t('portal.c_campaigns_text'),
      href: '/public/campaigns',
      color: 'teal',
      bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900/60 dark:hover:bg-teal-950/60',
      iconBg: 'bg-teal-600 dark:bg-teal-500',
    },
    {
      icon: Siren,
      title: t('portal.c_emergency'),
      desc: t('portal.c_emergency_text'),
      href: '/emergency-report',
      color: 'red',
      bg: 'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:hover:bg-red-950/60',
      iconBg: 'bg-red-600 dark:bg-red-500',
    },
    {
      icon: MessageSquare,
      title: t('portal.c_feedback'),
      desc: t('portal.c_feedback_text'),
      href: '/feedback',
      color: 'blue',
      bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60 dark:hover:bg-blue-950/60',
      iconBg: 'bg-blue-600 dark:bg-blue-500',
    },
    {
      icon: ShieldCheck,
      title: t('portal.c_verify'),
      desc: t('portal.c_verify_text'),
      href: '/verify-certificate',
      color: 'emerald',
      bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:hover:bg-emerald-950/60',
      iconBg: 'bg-emerald-600 dark:bg-emerald-500',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">

      {/* ── Top Navigation ── */}
      <header className="bg-[#0f4c3f] dark:bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-teal-800/40 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 dark:bg-teal-500/20 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-white text-white dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-none tracking-tight">CaafimaadHub</p>
              <p className="text-[10px] text-teal-300 dark:text-teal-400 font-medium">{t('portal.title')}</p>
            </div>
          </div>

          {/* Right: theme + lang + user + logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-teal-200" />
              <span>{language === 'so' ? 'SO' : 'EN'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-teal-200" />}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-xs font-extrabold text-white ring-2 ring-white/30">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold leading-none">{displayName}</p>
                <p className="text-[10px] text-teal-300 dark:text-teal-400 mt-0.5">{t('portal.member')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('portal.sign_out')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-1">{t('portal.welcome')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{displayName} 👋</h1>
            <p className="text-sm text-teal-200 mt-2 max-w-lg leading-relaxed">
              You are logged in as a Community Member. Use the services below to report emergencies, view health campaigns, and submit feedback.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {t('portal.account_active')}
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-teal-300" />
                {t('portal.member')}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('portal.s_volunteers'), value: stats.totalVolunteers, icon: Users, color: 'teal', href: '/campaigns' },
              { label: t('portal.s_campaigns'), value: stats.activeCampaigns, icon: Activity, color: 'emerald', href: '/campaigns' },
              { label: t('portal.s_reports'), value: stats.totalFieldSubmissions, icon: ClipboardList, color: 'blue', href: '/feedback' },
              { label: t('portal.s_regions'), value: stats.totalRegions, icon: MapPin, color: 'amber', href: '/campaigns' },
            ].map((s, i) => (
              <Link
                key={i}
                to={s.href}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-3 hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  s.color === 'teal' ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/60' :
                  s.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60' :
                  s.color === 'blue' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60' :
                  'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60'
                } transition-colors`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value ?? '—'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{s.label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Action Cards */}
        <div>
          <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">{t('portal.what_to_do')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map((a) => (
              <Link
                key={a.href}
                to={a.href}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all group shadow-sm ${a.bg}`}
              >
                <div className={`w-12 h-12 rounded-xl ${a.iconBg} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{a.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        {/* Active Campaigns Preview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t('portal.active_campaigns')}</h2>
            <Link to="/public/campaigns" className="text-xs text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1">
              {t('portal.view_all')} <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingCampaigns ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {campaigns.map((c, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{c.title || c.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">{t('portal.active_badge')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-teal-500 dark:text-teal-400" /> {c.region_name || c.target_region || 'Somalia'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
              <Info className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('portal.no_campaigns')}</p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">{t('portal.more_access')}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              To become a Community Health Volunteer and access training, tasks, and field tools —{' '}
              <Link to="/register" className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200">
                register as a Volunteer
              </Link>.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-2 border-t border-slate-200/50 dark:border-slate-800/50">
        <ShieldCheck className="w-4 h-4 text-teal-500" />
        CaafimaadHub — Secure • Reliable • Always Here to Help
      </footer>
    </div>
  );
}
