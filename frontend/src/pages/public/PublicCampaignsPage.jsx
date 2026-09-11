import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Megaphone, Calendar, MapPin, Filter, Loader2, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { enumLabel } from '../../i18n/enums';

export default function PublicCampaignsPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const isInsideApp = location.pathname.startsWith('/community') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/volunteer');

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns/public');
      if (res.success) setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const types = ['VACCINATION', 'MATERNAL_HEALTH', 'DISEASE_SURVEILLANCE', 'NUTRITION', 'WASH', 'HEALTH_EDUCATION', 'EMERGENCY_RESPONSE'];
  const filtered = typeFilter ? campaigns.filter(c => c.type === typeFilter) : campaigns;

  const content = (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-lg shadow-sky-900/20 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('nav.campaigns')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                Active Public Drives
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('public_campaigns.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
            !typeFilter
              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          {t('common.all')}
        </button>
        {types.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
              typeFilter === type
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {enumLabel(t, type)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-600 dark:text-sky-400" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-16">{t('common.no_data')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <Badge status={c.status}>{c.status}</Badge>
                  <Badge variant="info">{enumLabel(t, c.type)}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{c.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">{c.description}</p>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {c.start_date} — {c.end_date}</div>
                {c.target_region && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.target_region}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isInsideApp) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full flex items-center justify-between pb-6 max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {language === 'so' ? 'Ku noqo Bogga Hore' : 'Back to Home'}
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{language === 'so' ? 'SO' : 'EN'}</span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 shadow-xs transition-all cursor-pointer"
            title={language === 'so' ? 'Beddel Muuqaalka (Dark/Light)' : 'Toggle Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto flex-1">
        {content}
      </div>

      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium border-t border-slate-200/50 dark:border-slate-800/50 mt-10">
        CaafimaadHub — Somalia Community Health Campaigns Portal
      </footer>
    </div>
  );
}
