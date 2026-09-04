import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Award, CheckCircle2, XCircle, Loader2, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function VerifyCertificatePage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.get(`/training/certificates/verify/${code.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.message || t('verify.not_found'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-200 selection:bg-teal-500 selection:text-white">
      {/* Top Controls Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between z-20 pb-4">
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

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-900/20 ring-4 ring-teal-50 dark:ring-teal-950/60">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('nav.verify_certificate')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">{t('verify.intro')}</p>
        </div>

        <form onSubmit={handleVerify} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5 transition-colors">
          <Input
            label={t('verify.code_label')}
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CERT-SOM-2026-XXXX"
            required
            icon={Award}
          />
          <Button type="submit" loading={loading} className="w-full py-3 text-sm font-bold shadow-md shadow-teal-700/20">{t('verify.action')}</Button>
        </form>

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl p-6 text-center shadow-md animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-red-900 dark:text-red-300">{t('verify.invalid')}</h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 text-center shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">{t('verify.valid')}</h3>
            <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-left bg-white/70 dark:bg-slate-900/70 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <p><strong className="text-slate-900 dark:text-white">{t('verify.volunteer')}:</strong> {result.volunteerName || result.volunteer_name}</p>
              <p><strong className="text-slate-900 dark:text-white">{t('verify.course')}:</strong> {result.courseName || result.course_name}</p>
              <p><strong className="text-slate-900 dark:text-white">{t('verify.score')}:</strong> <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.score}%</span></p>
              <p><strong className="text-slate-900 dark:text-white">{t('verify.issued')}:</strong> {result.issuedDate || result.issued_at}</p>
              <div className="pt-2 text-center">
                <p className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1.5 rounded-lg inline-block border border-emerald-200 dark:border-emerald-800/80">
                  {result.certificateCode || result.certificate_code}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        CaafimaadHub — Somalia Community Health Platform
      </footer>
    </div>
  );
}
