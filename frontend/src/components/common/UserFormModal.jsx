import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Phone, Lock, MapPin, Calendar, BookOpen, Globe,
  Heart, Shield, AlertCircle, CheckCircle2, UserPlus, Edit3, Eye,
  ShieldCheck, Check, X, Building2, Sparkles, UserCheck, UserX
} from 'lucide-react';
import FormModal from './FormModal';
import DynamicFormBuilder from './DynamicFormBuilder';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const SOMALIA_REGIONS = [
  'Banadir', 'Hiran', 'Bari', 'Woqooyi Galbeed', 'Lower Juba', 'Bay', 'Galguduud',
  'Mudug', 'Nugaal', 'Sool', 'Togdheer', 'Sanaag', 'Middle Juba', 'Lower Shabelle',
  'Middle Shabelle', 'Bakool', 'Gedo', 'Awdal'
];

export const SOMALIA_DISTRICTS_MAP = {
  Banadir: ['Hodan', 'Wadajir', 'Waberi', 'Yaqshid', 'Howlwadaag', 'Hamar Weyne', 'Hamar Jajab', 'Karaan', 'Shibis', 'Boondheere', 'Daynile', 'Dharkenley', 'Kaxda', 'Warta Nabadda', 'Hiliwaa', 'Abdiaziz', 'Kahda', 'Garasbaley'],
  Hiran: ['Beledweyne', 'Buloburde', 'Jalalaqsi', 'Mataban', 'Mahas'],
  Bay: ['Baidoa', 'Burhakaba', 'Dinsor', 'Qansax Dheere', 'Berdale'],
  Bari: ['Bossaso', 'Qardho', 'Caluula', 'Bandarbeyla', 'Iskushuban', 'Bargaal', 'Rako Raaxo'],
  Nugaal: ['Garowe', 'Eyl', 'Burtinle', 'Dangorayo'],
  Mudug: ['Galkayo', 'Hobyo', 'Jariban', 'Harardhere', 'Goldogob'],
  Galguduud: ['Dhusamareb', 'Adado', 'Abudwaq', 'Guriel', 'El Buur', 'El Dher', 'Caabudwaaq'],
  'Middle Shabelle': ['Jowhar', 'Balcad', 'Adale', 'Warsheikh', 'Mahaday', 'Run-nirgood'],
  'Lower Shabelle': ['Merka', 'Afgooye', 'Qoryooley', 'Barawe', 'Wanlaweyn', 'Kurtunwarey', 'Sablaale'],
  Bakool: ['Xudur', 'Wajid', 'El Barde', 'Rabdhure', 'Tayeeglow'],
  Gedo: ['Garbaharey', 'Luuq', 'Bardhere', 'Dolow', 'Beled Hawa', 'Elwak'],
  'Middle Juba': ["Bu'aale", 'Jilib', 'Sakow', 'Salagle'],
  'Lower Juba': ['Kismayo', 'Afmadow', 'Jamame', 'Badhadhe'],
  'Woqooyi Galbeed': ['Hargeisa', 'Berbera', 'Gabiley'],
  Togdheer: ['Burao', 'Sheikh', 'Oodweyne', 'Buuhoodle'],
  Sanaag: ['Erigavo', 'El Afweyn', 'Badhan', 'Las Khorey', 'Dhahar'],
  Sool: ['Las Anod', 'Taleh', 'Aynaba', 'Hudun'],
  Awdal: ['Borama', 'Baki', 'Lughaya', 'Zeila']
};

const EDUCATION_LEVELS = [
  { value: 'SECONDARY', label: 'Dugsiga Sare (Secondary School)' },
  { value: 'DIPLOMA_NURSING', label: 'Diploma Nursing / Caafimaadka' },
  { value: 'BACHELORS_PUBLIC_HEALTH', label: 'Bachelors in Public Health' },
  { value: 'BACHELORS_MEDICINE', label: 'Bachelors in Medicine (MBBS)' },
  { value: 'COMMUNITY_HEALTH_CERT', label: 'Shahaado Caafimaadka Bulshada (CHW Cert)' },
  { value: 'OTHER', label: 'Heer Kale (Other Qualification)' }
];

const LANGUAGE_OPTIONS = [
  { value: 'Somali', label: 'Af-Soomaali (Somali)' },
  { value: 'Arabic', label: 'Carabi (Arabic)' },
  { value: 'English', label: 'Ingiriis (English)' },
  { value: 'Maay', label: 'Af-Maay' }
];

export default function UserFormModal({
  isOpen,
  onClose,
  mode = 'create', // 'create' | 'edit' | 'view'
  userData = null,
  onSuccess,
  currentUserRole = 'Superadmin'
}) {
  const { language } = useLanguage();
  const { user: authUser, isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Available roles based on who is logged in
  const availableRoles = useMemo(() => isSuperAdmin
    ? [
        { value: 'Superadmin', label: 'Superadmin (Super Maamule)' },
        { value: 'Admin', label: 'Admin (Maamule Hawleed)' },
        { value: 'DataAnalyst', label: 'Data Analyst (Falanqeeye)' },
        { value: 'Volunteer', label: 'Volunteer (Hawl-wadeen CHV)' },
        { value: 'Public', label: 'Public User (Bulshada)' }
      ]
    : [
        { value: 'Volunteer', label: 'Volunteer (Hawl-wadeen CHV)' },
        { value: 'Public', label: 'Public User (Bulshada)' }
      ], [isSuperAdmin]);

  // Memoized initial values: In create mode, defaults are clean and unselected
  const initialValues = useMemo(() => {
    if (!userData || mode === 'create') {
      return {
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        status: '',
        gender: '',
        date_of_birth: '',
        profile_image_url: '',
        region: '',
        district: '',
        village_neighbourhood: '',
        latitude: '',
        longitude: '',
        education_level: '',
        languages_spoken: ['Somali'],
        motivation_background: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        volunteer_code: ''
      };
    }

    let langs = userData.languages_spoken || userData.languagesSpoken || [];
    if (typeof langs === 'string') {
      try { langs = JSON.parse(langs); } catch (e) { langs = [langs]; }
    }

    let userRole = userData.role || 'Volunteer';
    const urClean = String(userRole).toUpperCase().replace(/[\s-_]/g, '');
    if (urClean === 'SUPERADMIN' || urClean === 'ROLESUPERADMIN' || urClean === 'SUPER_ADMIN') userRole = 'Superadmin';
    else if (urClean === 'ADMIN' || urClean === 'ROLEADMIN' || urClean === 'OPERATIONAL') userRole = 'Admin';
    else if (urClean === 'DATAANALYST' || urClean === 'DATA_ANALYST' || urClean === 'ANALYST') userRole = 'DataAnalyst';
    else if (urClean === 'VOLUNTEER' || urClean === 'CHV') userRole = 'Volunteer';
    else if (urClean === 'PUBLIC' || urClean === 'PUBLICUSER' || urClean === 'PUBLIC_USER') userRole = 'Public';

    return {
      id: userData.id,
      full_name: userData.full_name || userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userRole,
      status: userData.status || (userData.is_active ? 'active' : 'deactivated'),
      gender: userData.gender || 'FEMALE',
      date_of_birth: userData.date_of_birth ? String(userData.date_of_birth).split('T')[0] : '',
      profile_image_url: userData.profile_image_url || userData.avatar_url || '',
      region: userData.region || '',
      district: userData.district || '',
      village_neighbourhood: userData.village_neighbourhood || userData.villageNeighbourhood || '',
      latitude: userData.latitude || '',
      longitude: userData.longitude || '',
      education_level: userData.education_level || userData.educationLevel || '',
      languages_spoken: Array.isArray(langs) ? langs : ['Somali'],
      motivation_background: userData.motivation_background || userData.motivationBackground || '',
      emergency_contact_name: userData.emergency_contact_name || userData.emergencyContactName || '',
      emergency_contact_phone: userData.emergency_contact_phone || userData.emergencyContactPhone || '',
      volunteer_code: userData.volunteer_code || userData.volunteerCode || ''
    };
  }, [userData?.id, userData?.updated_at, mode, isOpen, isSuperAdmin]);

  // Build schema memoized
  const schema = useMemo(() => ({
    sections: [
      {
        title: language === 'so' ? '1. Doorka & Akoonka (Auth & System)' : '1. Auth & System Role',
        icon: 'shield',
        badge: mode === 'create' ? 'Step 1' : null,
        gridCols: 'grid-cols-1 md:grid-cols-2',
        fields: [
          {
            name: 'role',
            label: language === 'so' ? 'User Role *' : 'User Role *',
            type: 'select',
            icon: 'shield',
            required: true,
            placeholder: language === 'so' ? '-- Dooro Doorka --' : '-- Select Role --',
            disabled: mode === 'view' || (!isSuperAdmin && mode === 'edit'),
            options: availableRoles
          },
          {
            name: 'status',
            label: language === 'so' ? 'Account Status *' : 'Account Status *',
            type: 'select',
            icon: 'shield',
            required: true,
            placeholder: language === 'so' ? '-- Dooro Xaaladda --' : '-- Select Status --',
            disabled: mode === 'view',
            options: [
              { value: 'active', label: language === 'so' ? 'Active (Shaqeynaya)' : 'Active' },
              { value: 'pending', label: language === 'so' ? 'Pending (Sugaya Ansixin)' : 'Pending Approval' },
              { value: 'deactivated', label: language === 'so' ? 'Deactivated (La Hakiyay)' : 'Deactivated' }
            ]
          },
          {
            name: 'password',
            label: mode === 'create'
              ? (language === 'so' ? 'Password *' : 'Password *')
              : (language === 'so' ? 'New Password (Optional)' : 'New Password (Optional)'),
            type: 'password',
            icon: 'lock',
            required: mode === 'create',
            autoComplete: 'new-password',
            condition: () => mode !== 'view',
            placeholder: mode === 'create' ? 'Password' : 'Enter new password to reset'
          }
        ]
      },
      {
        title: language === 'so' ? '2. Xogta Shakhsiga (Personal Info)' : '2. Personal Information',
        icon: 'user',
        badge: mode === 'create' ? 'Step 2' : null,
        gridCols: 'grid-cols-1 md:grid-cols-2',
        fields: [
          {
            name: 'full_name',
            label: language === 'so' ? 'Full Name *' : 'Full Name *',
            type: 'text',
            icon: 'user',
            required: true,
            autoComplete: 'off',
            placeholder: 'Full Name'
          },
          {
            name: 'email',
            label: language === 'so' ? 'Email Address *' : 'Email Address *',
            type: 'email',
            icon: 'mail',
            required: true,
            autoComplete: 'off',
            placeholder: 'Email Address'
          },
          {
            name: 'phone',
            label: language === 'so' ? 'Phone Number *' : 'Phone Number *',
            type: 'tel',
            icon: 'phone',
            required: true,
            autoComplete: 'off',
            placeholder: 'Phone Number'
          },
          {
            name: 'gender',
            label: language === 'so' ? 'Gender' : 'Gender',
            type: 'select',
            icon: 'user',
            placeholder: language === 'so' ? '-- Dooro Jinsiga --' : '-- Select Gender --',
            options: [
              { value: 'FEMALE', label: language === 'so' ? 'Dheddig (Female)' : 'Female' },
              { value: 'MALE', label: language === 'so' ? 'Lab (Male)' : 'Male' }
            ]
          },
          {
            name: 'date_of_birth',
            label: language === 'so' ? 'Date of Birth' : 'Date of Birth',
            type: 'date',
            icon: 'calendar'
          }
        ]
      },
      {
        title: language === 'so' ? '3. Goobta & Deegaanka (Location Info)' : '3. Location & Jurisdiction',
        icon: 'map-pin',
        badge: mode === 'create' ? 'Step 3' : null,
        gridCols: 'grid-cols-1 md:grid-cols-2',
        fields: [
          {
            name: 'region',
            label: language === 'so' ? 'Region *' : 'Region *',
            type: 'select',
            icon: 'map-pin',
            required: true,
            placeholder: language === 'so' ? '-- Dooro Gobolka --' : '-- Select Region --',
            options: SOMALIA_REGIONS.map(r => ({ value: r, label: r }))
          },
          {
            name: 'district',
            label: language === 'so' ? 'District *' : 'District *',
            type: 'select',
            icon: 'map-pin',
            required: true,
            placeholder: language === 'so' ? '-- Dooro Degmada --' : '-- Select District --',
            options: (formData) => {
              const selectedReg = formData?.region;
              if (selectedReg && SOMALIA_DISTRICTS_MAP[selectedReg]) {
                return SOMALIA_DISTRICTS_MAP[selectedReg].map(d => ({ value: d, label: d }));
              }
              // If no region chosen yet, show all districts
              const allDistricts = Array.from(new Set(Object.values(SOMALIA_DISTRICTS_MAP).flat())).sort();
              return allDistricts.map(d => ({ value: d, label: d }));
            }
          },
          {
            name: 'village_neighbourhood',
            label: language === 'so' ? 'Village / Neighbourhood' : 'Village / Neighbourhood',
            type: 'text',
            icon: 'building',
            placeholder: 'Village / Neighbourhood',
            condition: (fd) => fd.role === 'Volunteer' || fd.role === 'Public'
          },
          {
            name: 'latitude',
            label: 'Latitude (GPS)',
            type: 'text',
            icon: 'map-pin',
            placeholder: 'Latitude (GPS)',
            condition: (fd) => fd.role === 'Volunteer'
          },
          {
            name: 'longitude',
            label: 'Longitude (GPS)',
            type: 'text',
            icon: 'map-pin',
            placeholder: 'Longitude (GPS)',
            condition: (fd) => fd.role === 'Volunteer'
          }
        ]
      },
      {
        title: language === 'so' ? '4. Waxbarashada & Aqoonta (Background Info)' : '4. Background & Qualifications',
        icon: 'book',
        condition: (fd) => fd.role === 'Volunteer',
        gridCols: 'grid-cols-1 md:grid-cols-2',
        fields: [
          {
            name: 'education_level',
            label: language === 'so' ? 'Education Level' : 'Education Level',
            type: 'select',
            icon: 'book',
            placeholder: language === 'so' ? '-- Dooro Heerka Waxbarashada --' : '-- Select Education Level --',
            options: EDUCATION_LEVELS
          },
          {
            name: 'languages_spoken',
            label: language === 'so' ? 'Languages Spoken' : 'Languages Spoken',
            type: 'checkbox-group',
            options: LANGUAGE_OPTIONS,
            colSpan: 2
          },
          {
            name: 'motivation_background',
            label: language === 'so' ? 'Motivation & Background' : 'Motivation & Background',
            type: 'textarea',
            icon: 'heart',
            rows: 3,
            placeholder: language === 'so' ? 'U-jeeddada & Waayo-aragnimada' : 'Describe health experience or motivation...',
            colSpan: 2
          }
        ]
      },
      {
        title: language === 'so' ? '5. Xiriirka Xaaladaha Degdegga ah (Emergency Info)' : '5. Emergency Contact',
        icon: 'heart',
        condition: (fd) => fd.role === 'Volunteer',
        gridCols: 'grid-cols-1 md:grid-cols-2',
        fields: [
          {
            name: 'emergency_contact_name',
            label: language === 'so' ? 'Emergency Contact Name' : 'Emergency Contact Name',
            type: 'text',
            icon: 'user',
            placeholder: 'Emergency Contact Name'
          },
          {
            name: 'emergency_contact_phone',
            label: language === 'so' ? 'Emergency Contact Phone' : 'Emergency Contact Phone',
            type: 'tel',
            icon: 'phone',
            placeholder: 'Emergency Contact Phone'
          }
        ]
      }
    ]
  }), [language, mode, availableRoles, isSuperAdmin]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        // Create user endpoint
        const res = await api.post('/users', formData);
        if (res.success || res.data) {
          if (onSuccess) onSuccess(res.data || res);
          onClose();
        } else {
          setError(res.message || 'Failed to create user');
        }
      } else if (mode === 'edit') {
        // Update user endpoint
        const res = await api.put(`/users/${userData.id}`, formData);
        if (res.success || res.data) {
          if (onSuccess) onSuccess(res.data || res);
          onClose();
        } else {
          setError(res.message || 'Failed to update user');
        }
      }
    } catch (err) {
      console.error('[UserFormModal] Submit error:', err);
      setError(err.message || (language === 'so' ? 'Khalad ayaa dhacay' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!userData) return;
    setStatusLoading(true);
    try {
      const res = await api.patch(`/users/${userData.id}/status`, { status: newStatus });
      if (res.success || res.data) {
        if (onSuccess) onSuccess({ ...userData, status: newStatus });
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const modalTitle = mode === 'create'
    ? (language === 'so' ? 'Diiwaangeli Isticmaale Cusub' : 'Register New User')
    : mode === 'edit'
    ? (language === 'so' ? 'Wax-ka-beddel Xogta Isticmaalaha' : 'Edit User Profile')
    : (language === 'so' ? 'Faahfaahinta Isticmaalaha' : 'User Profile Details');

  const modalSubtitle = mode === 'create'
    ? (language === 'so' ? 'Buuxi foomka si aad u diiwaangeliso xubin cusub' : 'Fill in credentials and role information')
    : userData?.email;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={mode === 'create' ? UserPlus : mode === 'edit' ? Edit3 : User}
      avatarUrl={userData?.avatar_url || userData?.profile_image_url || userData?.avatarUrl}
      badge={userData?.role || (mode === 'create' ? 'NEW' : null)}
      size="xl"
    >
      {/* Quick Approval Banner for Pending Volunteers in View Mode */}
      {mode === 'view' && userData?.status === 'pending' && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
                {language === 'so' ? 'Codsigaan wuxuu sugayaa ansixin' : 'Registration Pending Approval'}
              </h5>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {language === 'so' ? 'Hawl-wadeenkaan wuxuu iska diiwaangeliyay bannaanka.' : 'This volunteer self-registered externally.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => handleQuickStatusChange('active')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{language === 'so' ? 'Ansixi (Approve)' : 'Approve'}</span>
            </button>
            <button
              type="button"
              disabled={statusLoading}
              onClick={() => handleQuickStatusChange('deactivated')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold text-xs uppercase tracking-wider border border-rose-700/60 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              <span>{language === 'so' ? 'Diid (Reject)' : 'Reject'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Form Builder Instance */}
      <DynamicFormBuilder
        schema={schema}
        initialValues={initialValues}
        mode={mode}
        onSubmit={handleSubmit}
        onCancel={onClose}
        loading={loading}
        error={error}
        submitLabel={
          mode === 'create'
            ? (language === 'so' ? 'Diiwaangeli Isticmaalaha' : 'Register User')
            : (language === 'so' ? 'Kaydi Isbeddelka' : 'Save Changes')
        }
      />
    </FormModal>
  );
}
