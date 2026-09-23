import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  User, Mail, Phone, Lock, Shield, CheckCircle2, AlertCircle,
  Camera, Globe, MapPin, Key, Award, Check
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { validateTextOnly, validateEmail, validatePhone, validatePassword } from '../../utils/validation';
import api from '../../services/api';

export default function AdminProfilePage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    region: 'Banadir',
    preferredLanguage: 'so',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    avatarUrl: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      const url = user.avatarUrl || user.avatar_url || '';
      setForm({
        fullName: user.fullName || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        region: user.region || 'Banadir',
        preferredLanguage: user.preferredLanguage || user.preferred_language || 'so',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        avatarUrl: url
      });
      setAvatarPreview(url || null);
      setAvatarImgError(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'so' ? 'Sawirka waa inuu ka yaraadaa 10MB' : 'Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize avatar image via Canvas to 320x320 JPEG
        const canvas = document.createElement('canvas');
        const size = 320;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw centered and cropped
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatarPreview(optimizedDataUrl);
        setAvatarImgError(false);
        setForm(prev => ({ ...prev, avatarUrl: optimizedDataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    const nameCheck = validateTextOnly(form.fullName, language === 'so' ? 'Magaca Buuxa' : 'Full Name', language);
    if (!nameCheck.isValid) {
      setError(nameCheck.message);
      return;
    }

    const emailCheck = validateEmail(form.email, language);
    if (!emailCheck.isValid) {
      setError(emailCheck.message);
      return;
    }

    if (form.phone && form.phone.trim()) {
      const phoneCheck = validatePhone(form.phone, language);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.message);
        return;
      }
    }

    if (form.password && form.password.trim()) {
      const pwdCheck = validatePassword(form.password, language);
      if (!pwdCheck.isValid) {
        setError(pwdCheck.message);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError(language === 'so' ? 'Labada password isma laha (Passwords do not match)' : 'Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone ? form.phone.trim() : null,
        region: form.region,
        avatarUrl: form.avatarUrl || null,
        preferredLanguage: form.preferredLanguage
      };

      if (form.password && form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await api.put('/auth/profile', payload);
      const updatedUser = res?.data || res;
      if (updatedUser) {
        updateUser(updatedUser);
        if (updatedUser.avatarUrl || updatedUser.avatar_url) {
          setAvatarPreview(updatedUser.avatarUrl || updatedUser.avatar_url);
        }
      }

      if (form.preferredLanguage !== language) {
        toggleLanguage();
      }

      addToast(
        language === 'so' ? 'Profile-kaaga si guul leh ayaa loo cusbooneysiiyay' : 'Profile updated successfully',
        'success'
      );
      setForm(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
      setSubmitted(false);
    } catch (err) {
      setError(err.message || (language === 'so' ? 'Cusbooneysiinta waa fashilantay' : 'Profile update failed'));
      addToast(err.message || 'Profile update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initial = (user?.fullName || user?.full_name || 'A').charAt(0).toUpperCase();
  const displayRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : 'STAFF');

  const permissionsList = [
    { key: 'users.manage', label: language === 'so' ? 'Maamulka Isticmaalayaasha' : 'User Management & Roles', granted: ['ADMIN', 'SUPER_ADMIN'].includes(displayRole) },
    { key: 'campaigns.manage', label: language === 'so' ? 'Maamulka Ololaha Caafimaadka' : 'Health Campaigns Coordination', granted: true },
    { key: 'field.audit', label: language === 'so' ? 'Baarista Xogta Goobaha' : 'Field Data Audit & Approvals', granted: true },
    { key: 'sms.dispatch', label: language === 'so' ? 'Dirista Farriimaha SMS-ka' : 'SMS Gateway Broadcasts', granted: ['ADMIN', 'SUPER_ADMIN'].includes(displayRole) },
    { key: 'inventory.manage', label: language === 'so' ? 'Maamulka Agabka & Daawada' : 'Supply Depot & Inventory', granted: true },
    { key: 'emergency.manage', label: language === 'so' ? 'Jawaab-celinta Degdegga ah' : 'Emergency Outbreak Response', granted: true }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <User className="w-7 h-7 text-sky-600 dark:text-sky-400" />
          <span>{language === 'so' ? 'Xogtayda & Amniga (My Profile & Security)' : 'My Profile & Security'}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {language === 'so'
            ? 'Maamul sawirkaaga profile-ka, magacaaga buuxa, lambarkaaga, luuqadda aad doorbideyso, iyo furaha sirta ah (Password)'
            : 'Manage personal staff credentials, avatar photo, contact details, language preferences, and security settings'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Staff Card & Permissions Overview */}
        <div className="space-y-6">
          <Card title={language === 'so' ? 'Aqoonsiga Shaqaalaha' : 'Staff Credentials'} icon={Shield}>
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative shrink-0">
                  {avatarPreview && !avatarImgError ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      onError={() => setAvatarImgError(true)}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-600 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center text-xl font-black shadow-md ring-2 ring-teal-100 dark:ring-teal-900">
                      {initial}
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

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white text-base truncate">{user?.fullName || user?.full_name}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs truncate mt-0.5">{user?.email}</p>
                  <div className="mt-1.5">
                    <Badge variant="teal">{displayRole}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">{language === 'so' ? 'Xaaladda Akoonka:' : 'Account Status:'}</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'so' ? 'Shaqaale Sharciyeysan' : 'Verified Staff'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500">{language === 'so' ? 'Gobolka Shaqada:' : 'Assigned Region:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{user?.region || 'Banadir / Mogadishu'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Role Privileges Card */}
          <Card title={language === 'so' ? 'Ogolaanshaha Shaqada' : 'Role & Platform Privileges'} icon={Award}>
            <div className="space-y-2.5 text-xs">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                {language === 'so'
                  ? 'Awoodaha iyo ogolaanshaha uu doorkaagu ku leeyahay nidaamka guud:'
                  : 'Granted system capabilities based on your primary assigned role:'}
              </p>
              {permissionsList.map((perm) => (
                <div key={perm.key} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-none">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{perm.label}</span>
                  {perm.granted ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                      <Check className="w-3 h-3" /> {language === 'so' ? 'Wuu leeyahay' : 'Granted'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {language === 'so' ? 'Ma haysto' : 'Restricted'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Profile & Password Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Personal Details Card */}
            <Card title={language === 'so' ? 'Xogta Shaqsiga ah' : 'Personal Information'} icon={User}>
              <div className="space-y-4">
                <Input
                  label={language === 'so' ? 'Magacaaga Buuxa' : 'Full Name'}
                  name="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  validationType="text-only"
                  icon={User}
                  required
                  helperText={language === 'so' ? 'Geli kaliya xarfo (letters only)' : 'Letters and spaces only'}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={language === 'so' ? 'Email-ka Galitaanka' : 'Login Email'}
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    validationType="email"
                    icon={Mail}
                    required
                    helperText={language === 'so' ? 'Email-kaaga rasmiga ah ee aad ku soo gasho' : 'Primary login email (e.g. user@example.com)'}
                  />
                  <Input
                    label={language === 'so' ? 'Lambarka Telefoonka' : 'Phone Number'}
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    validationType="phone"
                    icon={Phone}
                    placeholder="+252615551234"
                    helperText={language === 'so' ? 'Geli lambarkaaga saxda ah' : 'Standard phone digits'}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Select
                    label={language === 'so' ? 'Luuqadda Aad Doorbideyso' : 'Preferred Language'}
                    name="preferredLanguage"
                    value={form.preferredLanguage}
                    onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    options={[
                      { value: 'so', label: 'Af-Soomaali (Somali)' },
                      { value: 'en', label: 'English (UK / US)' }
                    ]}
                  />

                  <Input
                    label={language === 'so' ? 'Gobolka Hawlgalka' : 'Operational Region'}
                    name="region"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    icon={MapPin}
                  />
                </div>
              </div>
            </Card>

            {/* Password & Security Card */}
            <Card title={language === 'so' ? 'Beddelka Furaha Sirta (Password & Security)' : 'Password & Security'} icon={Key}>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'so'
                    ? 'Haddii aadan rabin inaad beddesho password-kaaga, bannaanka ka tag meelaha hoose:'
                    : 'Leave password fields blank if you do not wish to change your current login credentials.'}
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={language === 'so' ? 'Password-ka Cusub' : 'New Password'}
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    validationType="password"
                    placeholder="••••••••"
                    helperText={language === 'so' ? '6+ xaraf, lambar & calaamad' : '6+ chars with letter, number, and symbol'}
                  />

                  <Input
                    label={language === 'so' ? 'Xaqiiji Password-ka Cusub' : 'Confirm New Password'}
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </Card>

            {/* Submit Bar */}
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                size="lg"
                icon={CheckCircle2}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 shadow-md"
              >
                {language === 'so' ? 'Keydi Isbeddelada Profile-ka' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
