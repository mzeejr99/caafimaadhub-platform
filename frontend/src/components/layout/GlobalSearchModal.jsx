import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Megaphone, CheckSquare, Package, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { q: query.trim() });
        if (res.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full text-base bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-teal-600 dark:text-teal-400 shrink-0" />
            ) : (
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 bg-white dark:bg-slate-900">
            {results ? (
              <>
                {/* Volunteers */}
                {results.volunteers && results.volunteers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {t('search.volunteers')}
                    </h4>
                    <div className="space-y-1">
                      {results.volunteers.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => handleNavigate(`/admin/volunteers/${v.id}`)}
                          className="p-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{v.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{v.volunteer_id} • {v.region_name || 'Somalia'}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campaigns */}
                {results.campaigns && results.campaigns.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" /> {t('search.campaigns')}
                    </h4>
                    <div className="space-y-1">
                      {results.campaigns.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleNavigate(`/admin/campaigns/${c.id}`)}
                          className="p-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{c.code} • {c.type}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {results.tasks && results.tasks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" /> {t('search.tasks')}
                    </h4>
                    <div className="space-y-1">
                      {results.tasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleNavigate(`/admin/tasks/${t.id}`)}
                          className="p-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t.task_type} • {t.target_location_name || 'Field'}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inventory */}
                {results.inventory && results.inventory.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> {t('search.inventory')}
                    </h4>
                    <div className="space-y-1">
                      {results.inventory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNavigate('/admin/inventory')}
                          className="p-2.5 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.item_code} • {item.category}</p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            {item.quantity_on_hand} {item.unit_of_measure}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergencies */}
                {results.emergencies && results.emergencies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {t('search.emergencies')}
                    </h4>
                    <div className="space-y-1">
                      {results.emergencies.map((em) => (
                        <div
                          key={em.id}
                          onClick={() => handleNavigate(`/admin/emergencies/${em.id}`)}
                          className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-red-900 dark:text-red-400">{em.report_code}: {em.emergency_type}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{em.community_name || 'Somalia'}</p>
                          </div>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                            {em.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : query.trim().length >= 2 ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">{t('search.no_results')}</p>
            ) : (
              <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">{t('search.hint')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
