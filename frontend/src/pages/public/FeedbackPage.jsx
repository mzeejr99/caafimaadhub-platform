import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageSquare, CheckCircle2, User, Phone, Mail, MapPin, AlertCircle, Globe, Sun, Moon, ArrowLeft, HeartHandshake, ShieldCheck } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { validateTextOnly, validateEmail, validatePhone } from '../../utils/validation';

export default function FeedbackPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const isInsideApp = location.pathname.startsWith('/community') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/volunteer');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    category: 'HEALTH_SERVICE',
    subject: '',
    description: '',
    location_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    { value: 'HEALTH_SERVICE', label: t('feedback_form.cat_service') },
    { value: 'VOLUNTEER_CONDUCT', label: t('feedback_form.cat_conduct') },
    { value: 'FACILITY', label: t('feedback_form.cat_facility') },
    { value: 'SUGGESTION', label: t('feedback_form.cat_suggestion') },
    { value: 'COMPLAINT', label: t('feedback_form.cat_complaint') },
    { value: 'OTHER', label: t('feedback_form.cat_other') }
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.full_name) {
      const nameCheck = validateTextOnly(form.full_name, 'Magacaaga', language);
      if (!nameCheck.isValid) {
        setError(nameCheck.message);
        return;
      }
    }

    if (form.email) {
      const emailCheck = validateEmail(form.email, language);
      if (!emailCheck.isValid) {
        setError(emailCheck.message);
        return;
      }
    }

    if (form.phone) {
      const phoneCheck = validatePhone(form.phone, language);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.message);
        return;
      }
    }

    if (!form.category || !form.subject.trim() || !form.description.trim()) {
      setError(language === 'so' ? 'Fadlan buuxi qaybta, ciwaanka, iyo sharaxaadda' : 'Please fill in category, subject, and description.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/feedback/submit', form);
      setSuccess(res.data);
      setForm({ full_name: '', phone: '', email: '', category: 'HEALTH_SERVICE', subject: '', description: '', location_name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-lg shadow-sky-900/20 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('nav.give_feedback')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                Community Voice
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('feedback_form.intro')}
            </p>
          </div>
        </div>
      </div>

      {success ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 p-10 text-center shadow-lg transition-colors w-full">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('common.success')}!</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">{t('feedback_form.success')}</p>
          <p className="text-3xl font-mono font-extrabold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 rounded-xl py-3.5 px-8 inline-block border border-sky-200 dark:border-sky-800/60 shadow-sm">
            {success.ticketNumber}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-4">{t('feedback_form.keep_code')}</p>
          <button
            onClick={() => setSuccess(null)}
            className="mt-6 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            {t('feedback_form.submit_another')}
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="w-full">
          {error && (
            <div className="p-4 mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Expansive 2-column layout spanning edge-to-edge */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
            {/* Left: Contact Details (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4 transition-colors">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'so' ? 'Macluumaadkaaga (Ikhtiyaari)' : 'Your Contact Details (Optional)'}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'so' ? 'Waxaad ku dari kartaa magac iyo taleefan haddii aad rabto in lagala soo xiriiro' : 'You can provide contact info if you wish to receive updates'}
                </p>
              </div>

              <Input
                label={t('feedback_form.name')}
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder={t('feedback_form.name_ph')}
                validationType="text-only"
                icon={User}
                helperText={t('hints.letters_enter')}
              />

              <Input
                label={t('feedback_form.phone')}
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+252 61 XXXXXXX"
                validationType="phone"
                icon={Phone}
                helperText={t('hints.digits')}
              />

              <Input
                label={t('feedback_form.email')}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ali12@gmail.com"
                validationType="email"
                icon={Mail}
                helperText={t('hints.email_eg2')}
              />

              <Input
                label={t('feedback_form.location')}
                name="location_name"
                value={form.location_name}
                onChange={handleChange}
                placeholder={t('feedback_form.location_ph')}
                icon={MapPin}
              />

              <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300 space-y-1 mt-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>{language === 'so' ? 'Amniga Xogta' : 'Data Privacy'}</span>
                </div>
                <p className="text-[11px] text-sky-700/80 dark:text-sky-400/80 leading-relaxed">
                  {language === 'so'
                    ? 'Aragtidaadu waa mid qarsoodi ah oo loo isticmaalo keliya kor u qaadista tayada adeegyada caafimaadka bulshada.'
                    : 'Your feedback is treated confidentially to improve healthcare services in your community.'}
                </p>
              </div>
            </div>

            {/* Right: Message Details (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-4 transition-colors">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'so' ? 'Mawduuca & Fariinta' : 'Message & Subject'}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'so' ? 'Dooro nooca aragtida oo si faahfaahsan noogu sharax' : 'Select feedback category and share your thoughts'}
                </p>
              </div>

              <Select
                label={t('feedback_form.category')}
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categories}
                required
              />

              <Input
                label={t('feedback_form.subject')}
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder={t('feedback_form.subject_ph')}
                required
              />

              <Textarea
                label={t('feedback_form.description')}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('feedback_form.description_ph')}
                rows={6}
                required
              />

              <div className="pt-3">
                <Button type="submit" loading={loading} className="w-full py-3.5 text-sm font-extrabold shadow-md">
                  {t('common.submit')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  if (isInsideApp) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      {/* Standalone Public Header Controls */}
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

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center">
        {content}
      </div>

      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
        CaafimaadHub — Somalia Community Health Feedback Portal
      </footer>
    </div>
  );
}
