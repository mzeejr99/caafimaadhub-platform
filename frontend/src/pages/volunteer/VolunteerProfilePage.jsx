import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User, Phone, Mail, MapPin, Save, AlertCircle, Shield, Award, Clock, Camera } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import { validateTextOnly, validateEmail, validatePhone, validatePassword } from '../../utils/validation';

export default function VolunteerProfilePage() {
  const { user, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: user?.fullName || user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    region: user?.region || 'Banadir',
    district: user?.district || 'Hodan',
    avatarUrl: user?.avatarUrl || user?.avatar_url || '',
    password: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || user?.avatar_url || null);
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        region: user.region || 'Banadir',
        district: user.district || 'Hodan',
        avatarUrl: user.avatarUrl || user.avatar_url || ''
      }));
      setAvatarPreview(user.avatarUrl || user.avatar_url || null);
      setAvatarImgError(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'so' ? 'Sawirka waa inuu ka yaraadaa 10MB' : 'Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setForm(prev => ({ ...prev, avatarUrl: reader.result }));
      setAvatarImgError(false);
      addToast(language === 'so' ? 'Sawirka waa la doortay, riix Keydi Xogta' : 'Photo selected, click Save Changes to persist', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName) {
      setError(t('errors.all_fields'));
      return;
    }
    const nameCheck = validateTextOnly(form.fullName);
    if (!nameCheck.isValid) {
      setError(t('validation.text_only'));
      return;
    }

    if (!form.email || !validateEmail(form.email)) {
      setError(t('validation.invalid_email'));
      return;
    }

    if (!form.phone || !validatePhone(form.phone)) {
      setError(t('validation.invalid_phone'));
      return;
    }

    if (form.password) {
      const passCheck = validatePassword(form.password);
      if (!passCheck.isValid) {
        setError(t('validation.password_weak'));
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError(language === 'so' ? 'Labada password isma laha / Passwords do not match' : 'Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        region: form.region,
        district: form.district,
        avatarUrl: form.avatarUrl
      };

      if (form.password) {
        payload.password = form.password;
      }

      const res = await api.put('/users/profile', payload);
      if (res.success) {
        updateUser(res.data);
        addToast(t('profile.updated'), 'success');
        setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (err) {
      setError(err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('profile.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 w-full">
        <div className="space-y-4">
          <Card title={t('profile.credentials')} icon={Shield}>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="relative inline-block shrink-0">
                  {avatarPreview && !avatarImgError ? (
                    <img
                      src={avatarPreview}
                      alt="Profile Avatar"
                      onError={() => setAvatarImgError(true)}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-600 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center text-lg font-bold text-white shadow-md">
                      {(user?.fullName || user?.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <label className="absolute -bottom-1 -right-1 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md cursor-pointer transition-transform hover:scale-110" title={language === 'so' ? 'Beddel Sawirka' : 'Change Avatar'}>
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{user?.fullName || user?.full_name}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{user?.email}</p>
                  <Badge variant="teal" className="mt-1">{user?.role || 'CHV'}</Badge>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">{t('profile.accreditation')}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{t('profile.verified')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500">{t('profile.role')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t('profile.role_chv')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="space-y-6">
            <Card title={t('profile.personal')} icon={User}>
              <div className="space-y-4">
                <Input
                  label={t('profile.full_name')}
                  name="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  validationType="text-only"
                  icon={User}
                  required
                  helperText={t('hints.letters_enter')}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('profile.email')}
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    validationType="email"
                    icon={Mail}
                    required
                    helperText={t('hints.login_email')}
                  />
                  <Input
                    label={t('profile.phone')}
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    validationType="phone"
                    icon={Phone}
                    required
                    helperText={t('hints.digits')}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('common.region')}
                    name="region"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    validationType="text-only"
                    icon={MapPin}
                    required
                  />
                  <Input
                    label={t('common.district')}
                    name="district"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    validationType="text-only"
                    icon={MapPin}
                    required
                  />
                </div>
              </div>
            </Card>

            <Card title={t('profile.security')} icon={Shield}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={t('profile.new_password')}
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    validationType="password"
                    showPasswordRules={true}
                  />
                  <Input
                    label={t('profile.confirm_password')}
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" loading={loading} size="lg" icon={Save}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
