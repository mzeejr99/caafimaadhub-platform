import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Heart, CheckCircle2, User, Mail, Phone, Lock, MapPin, BookOpen, AlertCircle,
  Globe, Sun, Moon, ShieldCheck, Users, ClipboardList, BarChart3, ArrowRight, Eye, EyeOff,
  Shield, Calendar, UserPlus
} from 'lucide-react';
import { Input, Select, Textarea } from '../../components/common/Input';
import Button from '../../components/common/Button';
import { SOMALIA_DISTRICTS_MAP } from '../../components/common/UserFormModal';
import {
  validateTextOnly,
  validateEmail,
  validatePhone,
  validatePassword,
  validateAge18Plus
} from '../../utils/validation';


export default function RegisterVolunteerPage() {
  const { registerVolunteer } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', date_of_birth: '', gender: '',
    region_name: '', district_name: '', village_name: '', education_level: '',
    languages_spoken: 'Somali', motivation: '', emergency_contact_name: '', emergency_contact_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [publicStats, setPublicStats] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

    const nameCheck = validateTextOnly(form.full_name, 'Magaca Buuxa (Full Name)', language);
    if (!nameCheck.isValid) { setFormError(nameCheck.message); return; }

    const emailCheck = validateEmail(form.email, language);
    if (!emailCheck.isValid) { setFormError(emailCheck.message); return; }

    const phoneCheck = validatePhone(form.phone, language);
    if (!phoneCheck.isValid) { setFormError(phoneCheck.message); return; }

    const pwdCheck = validatePassword(form.password, language);
    if (!pwdCheck.isValid) { setFormError(pwdCheck.message); return; }

    const dobCheck = validateAge18Plus(form.date_of_birth, language, language === 'so' ? 'Taariikhda dhalashada' : 'Date of birth');
    if (!dobCheck.isValid) { setFormError(dobCheck.message); return; }

    if (!form.gender) {

      setFormError(language === 'so' ? 'Fadlan dooro jinsigaaga (Lab/Dheddig)' : 'Please select your gender');
      return;
    }

    if (!form.region_name) {
      setFormError(language === 'so' ? 'Fadlan dooro gobolkaaga' : 'Please select your region');
      return;
    }

    if (!form.district_name.trim()) {
      setFormError(language === 'so' ? 'Fadlan geli magaca degmada' : 'Please enter your district name');
      return;
    }

    if (!form.education_level) {
      setFormError(language === 'so' ? 'Fadlan dooro heerkaaga waxbarasho' : 'Please select your education level');
      return;
    }

    if (form.emergency_contact_name) {
      const contactNameCheck = validateTextOnly(form.emergency_contact_name, 'Magaca Qofka Deg-degga', language);
      if (!contactNameCheck.isValid) { setFormError(contactNameCheck.message); return; }
    }

    if (form.emergency_contact_phone) {
      const contactPhoneCheck = validatePhone(form.emergency_contact_phone, language);
      if (!contactPhoneCheck.isValid) { setFormError(contactPhoneCheck.message); return; }
    }

    setLoading(true);
    try {
      await registerVolunteer(form);
      setSuccess(true);
    } catch (err) {
      setFormError(err.message || t('reg_vol.failed'));
    } finally {
      setLoading(false);
    }
  };

  const educationLevels = [
    { value: 'PRIMARY', label: t('reg_vol.edu_primary') },
    { value: 'SECONDARY', label: t('reg_vol.edu_secondary') },
    { value: 'DIPLOMA', label: t('reg_vol.edu_diploma') },
    { value: 'DEGREE', label: t('reg_vol.edu_degree') },
    { value: 'POSTGRADUATE', label: t('reg_vol.edu_postgrad') },
    { value: 'NONE', label: t('reg_vol.edu_none') }
  ];

  const regions = [
    'Banadir', 'Hiran', 'Bari', 'Woqooyi Galbeed', 'Lower Juba', 'Bay', 'Galguduud',
    'Mudug', 'Nugaal', 'Sool', 'Togdheer', 'Sanaag', 'Middle Juba', 'Lower Shabelle',
    'Middle Shabelle', 'Bakool', 'Gedo', 'Awdal'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 p-8 text-center shadow-2xl shadow-emerald-100/60 dark:shadow-none">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-50/60 dark:ring-emerald-900/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{t('reg_vol.sent')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            Diiwaangelintaada hawl-wadeennimo si guul leh ayaa loo gudbiyay. Maamulka caafimaadka degmada ayaa dib u eegi doona si laguugu ansixiyo.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-700/20 transition-all w-full"
          >
            <ArrowRight className="w-4 h-4" /> {t('nav.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 lg:p-8 relative selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Top Right Controls */}
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

      {/* Main Two-Column Container */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start my-auto py-6">

        {/* Left Side: Brand & Community Overview */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/20">
              <Heart className="w-5 h-5 fill-white text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">CaafimaadHub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{t('login.tagline')}</p>
            </div>
          </div>

          {/* Hero Headlines */}
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('reg_vol.hero_1')}<br />
              <span className="text-teal-700 dark:text-teal-400">{t('reg_vol.hero_2')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-lg leading-relaxed font-medium">
              Register as a Community Health Volunteer (CHV) and help improve healthcare access across Somalia. Your skills and dedication can save lives.
            </p>
          </div>

          {/* 4 Feature Value Points */}
          <div className="space-y-3.5 max-w-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/80 dark:border-emerald-900/60">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Join {publicStats?.totalVolunteers ? `${publicStats.totalVolunteers}+` : 'Our'} Volunteers</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_vol.f1_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/80 dark:border-purple-900/60">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_vol.f2_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_vol.f2_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/80 dark:border-amber-900/60">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_vol.f3_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_vol.f3_text')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/80 dark:border-blue-900/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('reg_vol.f4_title')}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('reg_vol.f4_text')}</p>
              </div>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800">
            <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-950 p-4 text-white">
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

        {/* Right Side: Registration Form Card */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/80 dark:shadow-none p-6 sm:p-8 border border-slate-100 dark:border-slate-800 w-full max-w-xl transition-colors">

            {/* Header Icon */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 ring-8 ring-teal-50/60 dark:ring-teal-900/40 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <UserPlus className="w-6 h-6 text-teal-700 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t('reg_vol.title')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{t('reg_vol.subtitle')}</p>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
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
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-100/70 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-lg border-2 border-dashed border-teal-300 dark:border-teal-700">
                      <User className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    {language === 'so' ? 'Sawirka Profile-ka (Ikhtiyaari)' : 'Profile Photo (Optional)'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {language === 'so' ? 'Sawirkaagu wuxuu ka soo muuqan doonaa bogga hore iyo xogtaada' : 'Your photo will be displayed on the public platform & profile'}
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer transition-colors">
                    <UserPlus className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
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

              {/* Full Name */}
              <Input
                label={t('reg_vol.full_name')}
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder={t('reg_vol.name_ph')}
                validationType="text-only"
                icon={User}
                required
                submitted={submitted}
                helperText={t('hints.letters_enter')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <Input
                  label={t('login.email')}
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('reg_vol.email_ph')}
                  validationType="email"
                  icon={Mail}
                  required
                  submitted={submitted}
                  helperText={t('hints.email_letter')}
                />
                {/* Phone */}
                <Input
                  label={t('reg_vol.phone')}
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+252 61..."
                  validationType="phone"
                  icon={Phone}
                  required
                  submitted={submitted}
                  helperText={t('hints.digits')}
                />
              </div>

              {/* Password */}
              <Input
                label={t('reg_vol.password')}
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
                helperText={t('hints.password_rule')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`${t('reg_vol.dob')} (18+ Sano)`}
                  name="date_of_birth"
                  type="date"
                  validationType="age-18"
                  allowPast={true}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  value={form.date_of_birth}
                  onChange={handleChange}
                  helperText={language === 'so' ? 'Waa in aad jirtaa 18 sano ama ka weyn' : 'Must be 18 years or older'}
                  required
                  submitted={submitted}
                />
                <Select
                  label={t('reg_vol.gender')}
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={[
                    { value: 'FEMALE', label: t('reg_vol.gender_female') },
                    { value: 'MALE', label: t('reg_vol.gender_male') }
                  ]}
                  required
                  submitted={submitted}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label={t('common.region')}
                  name="region_name"
                  value={form.region_name}
                  onChange={(e) => {
                    const newReg = e.target.value;
                    setForm(prev => ({ ...prev, region_name: newReg, district_name: '' }));
                  }}
                  options={regions.map(r => ({ value: r, label: r }))}
                  required
                  submitted={submitted}
                />
                <Select
                  label={t('common.district')}
                  name="district_name"
                  value={form.district_name}
                  onChange={handleChange}
                  options={(form.region_name && SOMALIA_DISTRICTS_MAP[form.region_name] ? SOMALIA_DISTRICTS_MAP[form.region_name] : Array.from(new Set(Object.values(SOMALIA_DISTRICTS_MAP).flat())).sort()).map(d => ({ value: d, label: d }))}
                  required
                  submitted={submitted}
                />
                <Input
                  label={t('reg_vol.village')}
                  name="village_name"
                  value={form.village_name}
                  onChange={handleChange}
                  placeholder={t('reg_vol.village_ph')}
                  required
                  submitted={submitted}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={t('reg_vol.education')}
                  name="education_level"
                  value={form.education_level}
                  onChange={handleChange}
                  options={educationLevels}
                  required
                  submitted={submitted}
                />
                <Input
                  label={t('reg_vol.languages')}
                  name="languages_spoken"
                  value={form.languages_spoken}
                  onChange={handleChange}
                  placeholder={t('reg_vol.languages_ph')}
                  required
                  submitted={submitted}
                />
              </div>

              <Textarea
                label={t('reg_vol.motivation')}
                name="motivation"
                value={form.motivation}
                onChange={handleChange}
                placeholder={t('reg_vol.motivation_ph')}
                rows={3}
                submitted={submitted}
              />

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Emergency Contact (Qofka Deg-degga)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('reg_vol.emergency_name')}
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    validationType="text-only"
                    placeholder={t('reg_vol.contact_ph')}
                    submitted={submitted}
                    helperText={t('hints.letters')}
                  />
                  <Input
                    label={t('reg_vol.emergency_phone')}
                    name="emergency_contact_phone"
                    type="tel"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                    validationType="phone"
                    placeholder="+252 61..."
                    submitted={submitted}
                    helperText={t('hints.digits')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-teal-700/20 text-sm flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? t('reg_vol.submitting') : t('reg_vol.submit')}</span>
              </button>
            </form>

            {/* Footer Login Link */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Horey ma isu diiwaangelisay?{' '}
                <Link to="/login" className="text-teal-700 dark:text-teal-400 font-bold hover:underline">
                  {t('nav.login')}
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
