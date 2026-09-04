import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageSquare, CheckCircle2, User, Phone, Mail, MapPin, AlertCircle, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { validateTextOnly, validateEmail, validatePhone } from '../../utils/validation';

export default function FeedbackPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    category: '',
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-10 px-4 transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="max-w-lg mx-auto w-full flex items-center justify-between pb-4">
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

      <div className="w-full max-w-lg mx-auto my-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-teal-900/20 ring-4 ring-teal-50 dark:ring-teal-950/60">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('nav.give_feedback')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">{t('feedback_form.intro')}</p>
        </div>

        {success ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 p-8 text-center shadow-xl transition-colors">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('common.success')}!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">{t('feedback_form.success')}</p>
            <p className="text-2xl font-mono font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 rounded-xl py-3 px-6 inline-block border border-teal-200 dark:border-teal-800/60 shadow-sm">
              {success.ticketNumber}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">{t('feedback_form.keep_code')}</p>
            <button
              onClick={() => setSuccess(null)}
              className="mt-6 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 font-bold block mx-auto underline cursor-pointer"
            >
              {t('feedback_form.submit_another')}
            </button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4 transition-colors">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              rows={4}
              required
            />

            <Input
              label={t('feedback_form.location')}
              name="location_name"
              value={form.location_name}
              onChange={handleChange}
              placeholder={t('feedback_form.location_ph')}
              icon={MapPin}
            />

            <Button type="submit" loading={loading} className="w-full py-3">
              {t('common.submit')}
            </Button>
          </form>
        )}
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        CaafimaadHub — Somalia Community Health Feedback Portal
      </footer>
    </div>
  );
}
