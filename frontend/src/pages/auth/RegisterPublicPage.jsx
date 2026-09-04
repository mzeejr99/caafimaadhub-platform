import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Heart, CheckCircle2, User, Mail, Phone, Lock,
  Globe, ShieldCheck, UserPlus, AlertCircle, ArrowRight,
  Users, ClipboardList, BarChart3, MapPin, Sun, Moon
} from 'lucide-react';
import { Input, Select } from '../../components/common/Input';
import {
  validateTextOnly,
  validateEmail,
  validatePhone,
  validatePassword
} from '../../utils/validation';

const REGIONS = [
  'Banadir', 'Hiran', 'Bari', 'Woqooyi Galbeed', 'Lower Juba', 'Bay', 'Galguduud',
  'Mudug', 'Nugaal', 'Sool', 'Togdheer', 'Sanaag', 'Middle Juba', 'Lower Shabelle',
  'Middle Shabelle', 'Bakool', 'Gedo', 'Awdal'
];

export default function RegisterPublicPage() {
  const { registerPublicUser } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    region_name: '', district_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [publicStats, setPublicStats] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    api.get('/analytics/public')
      .then(d => { if (d && d.success) setPublicStats(d.data); })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError(language === 'so' ? 'Sawirka waa inuu ka yaraadaa 5MB' : 'Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setForm(prev => ({ ...prev, avatar_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError('');

    const nameCheck = validateTextOnly(form.full_name, 'Full Name', language);
    if (!nameCheck.isValid) { setFormError(nameCheck.message); return; }

    const emailCheck = validateEmail(form.email, language);
    if (!emailCheck.isValid) { setFormError(emailCheck.message); return; }

    if (form.phone) {
      const phoneCheck = validatePhone(form.phone, language);
      if (!phoneCheck.isValid) { setFormError(phoneCheck.message); return; }
    }

    const pwdCheck = validatePassword(form.password, language);
    if (!pwdCheck.isValid) { setFormError(pwdCheck.message); return; }

    setLoading(true);
    try {
      await registerPublicUser(form);
      setSuccess(true);
    } catch (err) {
      setFormError(err.message || t('reg_pub.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 p-10 text-center shadow-2xl shadow-emerald-100/60 dark:shadow-none">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50/60 dark:ring-emerald-900/40 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t('reg_pub.created')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-sm mx-auto">
            Your community account has been created. You can now sign in to access public health campaigns, report emergencies, and submit feedback.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-700/20 transition-all w-full"
          >
            <ArrowRight className="w-4 h-4" /> {t('reg_pub.sign_in_now')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 lg:p-8 relative selection:bg-teal-500 selection:text-white transition-colors duration-200">

      {/* Top Controls */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-8 flex items-center gap-2.5 z-20">
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

      {/* Main Two-Column Layout */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6">

        {/* LEFT: Brand & Community Info */}
        <div className="lg:col-span-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/20">
              <Heart className="w-5 h-5 fill-white text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">CaafimaadHub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{t('login.tagline')}</p>
            </div>
          </div>

          {/* Headlines */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('reg_pub.hero_1')}<br />
              <span className="text-blue-700 dark:text-blue-400">{t('reg_pub.hero_2')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-lg leading-relaxed font-medium">
              Create a free community account to access public health campaigns, report emergencies, submit feedback, and stay connected with health services in your area.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3.5 max-w-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/60">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_pub.f1_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_pub.f1_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/80 dark:border-emerald-900/60">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_pub.f2_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_pub.f2_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/80 dark:border-purple-900/60">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('portal.c_feedback')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_pub.f3_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/80 dark:border-amber-900/60">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_pub.f4_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_pub.f4_text')}</p>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800">
            <div className="h-28 bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-teal-100 dark:from-slate-900 dark:via-blue-950/40 dark:to-teal-950/40 flex items-center justify-center gap-6 px-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-700 border-2 border-white flex items-center justify-center text-lg shadow-md">🧕🏾</div>
                <span className="text-[9px] font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/60 px-1.5 rounded mt-1">{t('login.p_community')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-teal-700 border-2 border-white flex items-center justify-center text-lg shadow-md">👨🏾‍⚕️</div>
                <span className="text-[9px] font-bold text-teal-900 dark:text-teal-200 bg-teal-100 dark:bg-teal-900/60 px-1.5 rounded mt-1">{t('login.p_lead')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-700 border-2 border-white flex items-center justify-center text-lg shadow-md">👩🏽‍⚕️</div>
                <span className="text-[9px] font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 rounded mt-1">{t('reg_pub.p_health_team')}</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 p-4 text-white border-t border-teal-800/40">
              <p className="text-[11px] font-semibold text-teal-300/90 mb-2">{t('login.together')}</p>
              <div className="grid grid-cols-4 gap-2 text-left">
                <div>
                  <p className="text-base font-extrabold text-white leading-tight">{publicStats?.totalVolunteers ?? '—'}</p>
                  <p className="text-[10px] text-teal-300 font-medium">{t('login.stat_volunteers')}</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-white leading-tight">{publicStats?.activeCampaigns ?? '—'}</p>
                  <p className="text-[10px] text-teal-300 font-medium">{t('login.stat_campaigns')}</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-white leading-tight">{publicStats?.totalFieldSubmissions ?? '—'}</p>
                  <p className="text-[10px] text-teal-300 font-medium">{t('login.stat_reports')}</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-white leading-tight">{publicStats?.totalRegions ?? '—'}</p>
                  <p className="text-[10px] text-teal-300 font-medium">{t('login.stat_regions')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Registration Form Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/80 dark:shadow-none p-8 sm:p-10 border border-slate-100 dark:border-slate-800 w-full max-w-lg transition-colors">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 ring-8 ring-blue-50/60 dark:ring-blue-900/40 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('reg_pub.title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t('reg_pub.subtitle')}</p>
            </div>

            {formError && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {/* Profile Photo Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl">
                <div className="relative group shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
                      <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    {language === 'so' ? 'Sawirka Profile-ka (Ikhtiyaari)' : 'Profile Photo (Optional)'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {language === 'so' ? 'Sawirkaagu wuxuu ka soo muuqan doonaa boggaaga' : 'Your photo will be displayed on your user profile'}
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer transition-colors">
                    <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'so' ? 'Dooro Sawir' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <Input
                label={t('reg_pub.full_name')}
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder={t('reg_pub.name_ph')}
                validationType="text-only"
                icon={User}
                required
                submitted={submitted}
              />

              <Input
                label={t('login.email')}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder={t('reg_pub.email_ph')}
                validationType="email"
                icon={Mail}
                required
                submitted={submitted}
              />

              <Input
                label={t('reg_pub.phone')}
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+252 61..."
                validationType="phone"
                icon={Phone}
                submitted={submitted}
              />

              <Input
                label={t('login.password')}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                validationType="password"
                icon={Lock}
                required
                submitted={submitted}
                showPasswordRules={true}
                enableSpeech={false}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label={t('reg_pub.region')}
                  name="region_name"
                  value={form.region_name}
                  onChange={handleChange}
                  options={REGIONS.map(r => ({ value: r, label: r }))}
                />
                <Input
                  label={t('reg_pub.district')}
                  name="district_name"
                  value={form.district_name}
                  onChange={handleChange}
                  validationType="text-only"
                  placeholder={t('reg_pub.district_ph')}
                  submitted={submitted}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-700/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? t('reg_pub.submitting') : t('reg_pub.submit')}</span>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Want to volunteer?{' '}
                <Link to="/register" className="text-teal-700 dark:text-teal-400 font-bold hover:underline">
                  Register as Volunteer
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-700 dark:text-teal-400 font-bold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="text-center py-2 text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span>{t('login.footer_note')}</span>
      </div>
    </div>
  );
}
