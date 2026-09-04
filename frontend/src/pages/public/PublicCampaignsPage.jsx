import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Megaphone, Calendar, MapPin, Filter, Loader2, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { enumLabel } from '../../i18n/enums';

export default function PublicCampaignsPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between pb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
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

        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-3">
            <Megaphone className="w-8 h-8 text-teal-700 dark:text-teal-400" /> {t('nav.campaigns')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{t('public_campaigns.subtitle')}</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
              !typeFilter
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {t('common.all')}
          </button>
          {types.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                typeFilter === type
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {enumLabel(t, type)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-16">{t('common.no_data')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <Badge status={c.status}>{c.status}</Badge>
                  <Badge variant="info">{enumLabel(t, c.type)}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{c.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-3 leading-relaxed">{c.description}</p>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {c.start_date} — {c.end_date}</div>
                  {c.target_region && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.target_region}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium border-t border-slate-200/50 dark:border-slate-800/50">
        CaafimaadHub — Somalia Community Health Campaigns Portal
      </footer>
    </div>
  );
}
