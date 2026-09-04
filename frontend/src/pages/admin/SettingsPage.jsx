import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  Settings, Save, Server, Smartphone, ShieldCheck,
  User, Lock, Mail, Phone, Globe, CheckCircle2, AlertCircle, KeyRound
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import api from '../../services/api';
import {
  validateTextOnly,
  validateEmail,
  validatePhone,
  validatePassword
} from '../../utils/validation';

export default function SettingsPage() {
  const { user, isAdmin, isSuperAdmin, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { addToast } = useNotification();

  const [activeTab, setActiveTab] = useState(isAdmin || isSuperAdmin ? 'system' : 'profile');

  // System Settings State
  const [systemLoading, setSystemLoading] = useState(false);
  const [settings, setSettings] = useState({
    sms_provider: 'MOCK',
    sms_sender_id: 'CaafimaadHub',
    low_stock_threshold: 10,
    offline_sync_interval_mins: 15,
    default_language: 'so',
    emergency_sms_broadcast_enabled: true
  });

  // Profile Settings State
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredLanguage: user?.preferredLanguage || 'so',
    avatarUrl: user?.avatarUrl || user?.avatar_url || '',
    password: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || user?.avatar_url || null);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        fullName: user.fullName || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        preferredLanguage: user.preferredLanguage || 'so',
        avatarUrl: user.avatarUrl || user.avatar_url || ''
      }));
      setAvatarPreview(user.avatarUrl || user.avatar_url || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setProfileError(language === 'so' ? 'Sawirka waa inuu ka yaraadaa 10MB' : 'Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatarPreview(optimizedDataUrl);
        setProfileForm(prev => ({ ...prev, avatarUrl: optimizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isAdmin || isSuperAdmin) {
      fetchSettings();
    }
  }, [isAdmin, isSuperAdmin]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save System Settings
  const handleSaveSystem = async (e) => {
    e.preventDefault();
    setSystemLoading(true);
    try {
      await api.put('/settings', settings);
      addToast(language === 'so' ? 'Habaynta nidaamka si guul leh ayaa loo keydiyay' : 'System settings saved successfully', 'success');
    } catch (err) {
      addToast(err.message || t('settings.save_failed'), 'error');
    } finally {
      setSystemLoading(false);
    }
  };

  // Save Profile Settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSubmitted(true);
    setProfileError('');

    const nameCheck = validateTextOnly(profileForm.fullName, 'Magacaaga Buuxa (Full Name)', language);
    if (!nameCheck.isValid) {
      setProfileError(nameCheck.message);
      return;
    }

    const emailCheck = validateEmail(profileForm.email, language);
    if (!emailCheck.isValid) {
      setProfileError(emailCheck.message);
      return;
    }

    if (profileForm.phone && profileForm.phone.trim()) {
      const phoneCheck = validatePhone(profileForm.phone, language);
      if (!phoneCheck.isValid) {
        setProfileError(phoneCheck.message);
        return;
      }
    }

    if (profileForm.password && profileForm.password.trim()) {
      const pwdCheck = validatePassword(profileForm.password, language);
      if (!pwdCheck.isValid) {
        setProfileError(pwdCheck.message);
        return;
      }
      if (profileForm.password !== profileForm.confirmPassword) {
        setProfileError(language === 'so' ? 'Labada password isma laha / Passwords do not match' : 'Passwords do not match');
        return;
      }
    }

    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone ? profileForm.phone.trim() : null,
        preferredLanguage: profileForm.preferredLanguage,
        avatarUrl: profileForm.avatarUrl || null,
        password: profileForm.password ? profileForm.password.trim() : undefined
      });
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        if (updatedUser.avatarUrl || updatedUser.avatar_url) {
          setAvatarPreview(updatedUser.avatarUrl || updatedUser.avatar_url);
        }
      }
      addToast(language === 'so' ? 'Xogtaada profile-ka si guul leh ayaa loo cusboonaysiiyay' : 'Profile updated successfully', 'success');
      setProfileForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      setProfileSubmitted(false);
    } catch (err) {
      setProfileError(err.message || t('settings.profile_failed'));
      addToast(err.message || t('settings.profile_failed'), 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.settings')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {language === 'so'
            ? 'Maamul habaynta nidaamka, xogta akoonkaaga (magaca, taleefanka, email-ka), iyo amniga'
            : 'Manage system operational parameters, personal profile, contact information, and security'}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {(isAdmin || isSuperAdmin) && (
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'system'
                ? 'border-teal-600 dark:border-teal-400 text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/40'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>{language === 'so' ? 'Maamulka Nidaamka (System Management)' : 'System Management & Rules'}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-teal-600 dark:border-teal-400 text-teal-800 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/40'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{language === 'so' ? 'Xogtayda & Amniga (My Profile & Security)' : 'My Profile & Security'}</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM CONFIGURATION (SuperAdmin / Admin) */}
      {activeTab === 'system' && (isAdmin || isSuperAdmin) && (
        <form onSubmit={handleSaveSystem} className="w-full space-y-6">
          <div className="grid lg:grid-cols-2 gap-6 w-full">
            {/* SMS Gateway Card */}
            <Card title={t('settings.sms_gateway')} icon={Smartphone}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label={t('settings.sms_provider')}
                    name="sms_provider"
                    value={settings.sms_provider}
                    onChange={(e) => setSettings({ ...settings, sms_provider: e.target.value })}
                    options={[
                      { value: 'MOCK', label: t('settings.gw_mock') },
                      { value: 'HORMUUD', label: t('settings.gw_hormuud') },
                      { value: 'AFRICAS_TALKING', label: "Africa's Talking Gateway" },
                      { value: 'TWILIO', label: t('settings.gw_twilio') }
                    ]}
                  />
                  <Input
                    label={t('settings.sms_sender')}
                    name="sms_sender_id"
                    value={settings.sms_sender_id}
                    onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
                    placeholder="CaafimaadHub"
                    required
                  />
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  When enabled, automated SMS alerts are dispatched to community volunteers upon task assignment, schedule shifts, and critical disease outbreak declarations.
                </div>
              </div>
            </Card>

            {/* Offline & Sync Defaults Card */}
            <Card title={t('settings.offline_engine')} icon={Server}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('settings.low_stock_threshold')}
                    name="low_stock_threshold"
                    value={String(settings.low_stock_threshold)}
                    onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value || '10', 10) })}
                    validationType="number-only"
                    required
                    helperText={t('hints.digits')}
                  />
                  <Select
                    label={t('settings.default_language')}
                    name="default_language"
                    value={settings.default_language}
                    onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                    options={[
                      { value: 'so', label: 'Somali / Af-Soomaali' },
                      { value: 'en', label: 'English' }
                    ]}
                  />
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Configures IndexedDB client storage rules, automatic synchronization retry intervals, and global default language settings.
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={systemLoading} size="lg" icon={Save}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: MY PROFILE & SECURITY (All Users) */}
      {activeTab === 'profile' && (
        <form noValidate onSubmit={handleSaveProfile} className="w-full space-y-6">
          {profileError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 w-full">
            {/* Personal Details */}
            <Card title={t('settings.personal')} icon={User}>
              <div className="space-y-4">
                {/* Avatar Photo Edit */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <div className="relative group shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-xl border-2 border-dashed border-teal-300">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                      {language === 'so' ? 'Sawirka Profile-ka' : 'Profile Avatar Photo'}
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                      {language === 'so' ? 'Dooro sawir cusub si aad ugu beddesho profile-kaaga' : 'Upload a new photo for your user profile and public display'}
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer transition-colors">
                      <User className="w-3.5 h-3.5" />
                      <span>{language === 'so' ? 'Beddel Sawirka' : 'Change Photo'}</span>
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
                  label={t('settings.full_name')}
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  placeholder={t('settings.name_ph')}
                  validationType="text-only"
                  required
                  submitted={profileSubmitted}
                  helperText={t('hints.letters')}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('login.email')}
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder={t('settings.email_ph')}
                    validationType="email"
                    required
                    submitted={profileSubmitted}
                    helperText={t('hints.email_eg')}
                  />
                  <Input
                    label={t('settings.phone')}
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+252 61..."
                    validationType="phone"
                    submitted={profileSubmitted}
                    helperText={t('hints.digits')}
                  />
                </div>

                <Select
                  label={t('settings.language_pref')}
                  name="preferredLanguage"
                  value={profileForm.preferredLanguage}
                  onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value })}
                  options={[
                    { value: 'so', label: 'Somali / Af-Soomaali' },
                    { value: 'en', label: 'English' }
                  ]}
                  required
                />
              </div>
            </Card>

            {/* Security & Password */}
            <Card title={t('settings.security')} icon={Lock}>
              <div className="space-y-4">
                <Input
                  label={t('settings.new_password')}
                  name="password"
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  placeholder="••••••••"
                  validationType="password"
                  showPasswordRules={true}
                  submitted={profileSubmitted}
                />

                <Input
                  label={t('settings.confirm_password')}
                  name="confirmPassword"
                  type="password"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  submitted={profileSubmitted}
                />
              </div>
            </Card>

            {/* Role & System Capabilities Matrix (Full Width) */}
            <div className="lg:col-span-2">
              <Card title={language === 'so' ? 'Doorkaaga & Awoodahaaga Nidaamka (Role & Permissions)' : 'Role & System Capabilities'} icon={ShieldCheck}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black">
                        {user?.role?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                          {user?.role === 'SUPER_ADMIN' ? 'Super Administrator' :
                           user?.role === 'ADMIN' ? 'Operational Administrator' :
                           user?.role === 'OPERATIONAL' ? 'Operations & Logistics Manager' :
                           user?.role === 'DATA_ANALYST' ? 'Data & Health Analyst' :
                           user?.role === 'VOLUNTEER' ? 'Community Health Volunteer (CHV)' : 'Public Community User'}
                        </span>
                        <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                          {user?.email} • {user?.phone || 'No phone'}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs">
                      {user?.role}
                    </span>
                  </div>

                  {/* Privileges Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2.5">
                      {language === 'so' ? 'Awoodaha iyo Xuquuqaha laguu oggol yahay:' : 'Granted System Permissions & Access:'}
                    </h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {(user?.permissions || [
                        'campaigns.view', 'volunteers.view', 'field_data.view',
                        'tasks.view', 'inventory.view', 'emergencies.view', 'analytics.view'
                      ]).map((perm, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading} size="lg" icon={Save}>
              {language === 'so' ? 'Keydi Xogta Profile-ka' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
