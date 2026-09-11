import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Award, CheckCircle2, XCircle, Loader2, Globe, Sun, Moon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Input } from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function VerifyCertificatePage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const isInsideApp = location.pathname.startsWith('/community') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/volunteer');

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

  const content = (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-lg shadow-sky-900/20 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('nav.verify_certificate')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                Official Credential Verification
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('verify.intro')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* Verification Form Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'so' ? 'Gali Lambarka Shahaadada' : 'Enter Certificate Code'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'so' ? 'Gali lambarka gaarka ah ee ku yaal shahaadada CHV' : 'Type the unique ID printed on the official certificate'}
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label={t('verify.code_label')}
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CERT-SOM-2026-XXXX"
              required
              icon={Award}
            />
            <Button type="submit" loading={loading} className="w-full py-3.5 text-sm font-extrabold shadow-md">
              {t('verify.action')}
            </Button>
          </form>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-5 text-center shadow-xs animate-in fade-in">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-900 dark:text-red-300">{t('verify.invalid')}</h3>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Verification Results Card / Guidance */}
        <div className="lg:col-span-6">
          {result ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-7 text-center shadow-md animate-in fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">{t('verify.valid')}</h3>
              <div className="mt-4 space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 text-left bg-white/80 dark:bg-slate-900/80 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p><strong className="text-slate-900 dark:text-white">{t('verify.volunteer')}:</strong> {result.volunteerName || result.volunteer_name}</p>
                <p><strong className="text-slate-900 dark:text-white">{t('verify.course')}:</strong> {result.courseName || result.course_name}</p>
                <p><strong className="text-slate-900 dark:text-white">{t('verify.score')}:</strong> <span className="font-bold text-emerald-600 dark:text-emerald-400">{result.score}%</span></p>
                <p><strong className="text-slate-900 dark:text-white">{t('verify.issued')}:</strong> {result.issuedDate || result.issued_at}</p>
                <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-4 py-2 rounded-lg inline-block border border-emerald-200 dark:border-emerald-800/80">
                    {result.certificateCode || result.certificate_code}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'so' ? 'Shahaadooyinka Saxda Ah' : 'Authentic Certifications'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Somalia Federal Ministry of Health & CaafimaadHub
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'so'
                  ? 'Dhamaan shahaadooyinka laga soo saaro nidaamka CaafimaadHub waxay leeyihiin lambar aqoonsi oo gaar ah oo la hubin karo wakhti kasta. Xogta shahaadada waxaa lagu kaydiyaa keydka dhexe ee qaranka.'
                  : 'All certificates issued through the CaafimaadHub platform carry a tamper-proof verification ID registered in the national health training database.'}
              </p>
            </div>
          )}
        </div>
      </div>
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
        CaafimaadHub — Somalia Community Health Platform
      </footer>
    </div>
  );
}
