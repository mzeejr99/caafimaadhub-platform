import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, MapPin, CheckCircle2, User, Phone, AlertCircle, Globe, Sun, Moon, ArrowLeft, ShieldAlert, Radio } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/common/Input';
import Button from '../../components/common/Button';
import LocationPicker from '../../components/maps/LocationPicker';
import api from '../../services/api';
import { validateTextOnly, validatePhone, validateNumberOnly } from '../../utils/validation';

export default function EmergencyReportPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, isVolunteer } = useAuth();
  const location = useLocation();
  const isInsideApp = location.pathname.startsWith('/community') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/volunteer');
  const isVolunteerRoute = location.pathname.startsWith('/volunteer');

  const [form, setForm] = useState({
    reporter_name: user?.fullName || user?.full_name || '',
    reporter_phone: user?.phone || '',
    emergency_type: 'DISEASE_OUTBREAK',
    severity: 'HIGH',
    description: '',
    location_name: user?.district ? `${user.district}, ${user.region || 'Banadir'}` : '',
    suspected_cases: '5',
    latitude: user?.latitude ? String(user.latitude) : '2.0469',
    longitude: user?.longitude ? String(user.longitude) : '45.3182'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  // Auto-fill when user context is ready
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        reporter_name: prev.reporter_name || user.fullName || user.full_name || '',
        reporter_phone: prev.reporter_phone || user.phone || '',
        location_name: prev.location_name || (user.district ? `${user.district}, ${user.region || 'Banadir'}` : '')
      }));
    }
  }, [user]);

  const emergencyTypes = [
    { value: 'DISEASE_OUTBREAK', label: language === 'so' ? 'Cudur Faafaya / Dillaacay (Acute Outbreak)' : 'Disease Outbreak (Acute Cluster)' },
    { value: 'CHOLERA_AWD', label: language === 'so' ? 'Shuban-biyood Daran / Daacuun (AWD / Cholera)' : 'Cholera / Acute Watery Diarrhea (AWD)' },
    { value: 'MEASLES', label: language === 'so' ? 'Jadeeco (Measles Outbreak)' : 'Measles Outbreak' },
    { value: 'MALNUTRITION_CRISIS', label: language === 'so' ? 'Nafaqo-darro Ba\'an (Acute Severe Malnutrition)' : 'Acute Malnutrition Crisis' },
    { value: 'UNKNOWN_FEVER', label: language === 'so' ? 'Qandho Daran oo Cudur Cusub ah (Acute Unexplained Fever)' : 'Acute Unexplained Hemorrhagic / Fever' },
    { value: 'FLOOD', label: t('emergency_form.type_flood') },
    { value: 'DROUGHT', label: t('emergency_form.type_drought') },
    { value: 'OTHER', label: t('emergency_form.type_other') }
  ];

  const severities = [
    { value: 'LOW', label: t('emergency_form.sev_low') },
    { value: 'MEDIUM', label: t('emergency_form.sev_medium') },
    { value: 'HIGH', label: t('emergency_form.sev_high') },
    { value: 'CRITICAL', label: t('emergency_form.sev_critical') }
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLocationPicked = ({ latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(latitude),
      longitude: String(longitude)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.reporter_name) {
      const nameCheck = validateTextOnly(form.reporter_name, 'Magacaaga', language);
      if (!nameCheck.isValid) {
        setError(nameCheck.message);
        return;
      }
    }

    const phoneCheck = validatePhone(form.reporter_phone, language);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.message);
      return;
    }

    if (form.suspected_cases) {
      const caseCheck = validateNumberOnly(form.suspected_cases, t('emergency_form.cases'), language);
      if (!caseCheck.isValid) {
        setError(caseCheck.message);
        return;
      }
    }

    if (!form.emergency_type) {
      setError(language === 'so' ? 'Fadlan dooro nooca xaaladda deg-degga ah' : 'Please select emergency type');
      return;
    }

    if (!form.severity) {
      setError(language === 'so' ? 'Fadlan dooro heerka darnaanta' : 'Please select severity level');
      return;
    }

    if (!form.description || form.description.trim() === '') {
      setError(language === 'so' ? 'Fadlan faahfaahi xaaladda deg-degga ah' : 'Please enter situation description');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        reporter_type: isVolunteer ? 'VOLUNTEER' : 'CITIZEN',
        suspected_cases: form.suspected_cases ? parseInt(form.suspected_cases, 10) : 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null
      };
      const res = await api.post('/emergencies/report', payload);
      setSuccess(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="w-full space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isVolunteerRoute
                  ? (language === 'so' ? 'Gudbi Digniin Cudur Dillaacay (Outbreak)' : 'Report Disease Outbreak Alert')
                  : t('emergency.report_emergency')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                {isVolunteerRoute ? 'CHV Outbreak Surveillance' : 'Live Alert'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isVolunteerRoute
                ? (language === 'so'
                    ? 'Warbixin degdeg ah oo toos u gaareysa Maamulka Degmada & Falanqeeyayaasha Caafimaadka (Rapid Response Teams).'
                    : 'Early warning alert dispatched directly to district operational response coordinators and health analysts.')
                : (language === 'so'
                    ? 'Soo sheeg cudur dillaacay, shuban-biyood, Jadeeco, ama xaalad deg-deg ah si kooxda gurmadka degmada loogu diro'
                    : 'Report disease outbreak, cholera, measles, or emergency health incident to dispatch local health teams')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{language === 'so' ? 'Gurmadka Degdegga ah: 999' : 'Emergency Hotline: 999'}</span>
          </div>
        </div>
      </div>

      {/* Verified Volunteer Identifier Card */}
      {isVolunteer && user && (
        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-teal-700 text-white font-black text-[10px] tracking-wider uppercase">
              CHV VERIFIED
            </span>
            <span>
              {language === 'so' ? 'Qofka soo gudbinaya:' : 'Reporting Volunteer:'}{' '}
              <strong className="text-teal-900 dark:text-white">{user.fullName || user.full_name}</strong>{' '}
              ({user.district || 'Hodan'}, {user.region || 'Banadir'})
            </span>
          </div>
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 font-semibold">
            Tel: {user.phone || 'N/A'}
          </span>
        </div>
      )}

      {success ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 p-10 text-center shadow-lg transition-colors w-full">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('emergency_form.sent')}</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">{t('emergency_form.code')}</p>
          <p className="text-3xl font-mono font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 rounded-xl py-3.5 px-8 inline-block border border-red-200 dark:border-red-800/60 shadow-sm">
            {success.reportCode}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-4">{t('emergency_form.dispatched')}</p>
          <button
            onClick={() => setSuccess(null)}
            className="mt-6 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            {t('emergency_form.report_another')}
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

          {/* Full-width responsive 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
            {/* Left: Form Fields (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'so' ? 'Faahfaahinta Warbixinta Degdegga ah' : 'Emergency Report Details'}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'so' ? 'Buuxi xogta qofka soo sheegaya iyo darnaanta xaaladda' : 'Fill in reporter information and outbreak severity'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('emergency_form.reporter')}
                  name="reporter_name"
                  value={form.reporter_name}
                  onChange={handleChange}
                  placeholder={t('emergency_form.name_ph')}
                  validationType="text-only"
                  icon={User}
                  helperText={t('hints.letters')}
                />
                <Input
                  label={t('emergency_form.phone')}
                  name="reporter_phone"
                  type="tel"
                  value={form.reporter_phone}
                  onChange={handleChange}
                  placeholder="+252 61 XXXXXXX"
                  validationType="phone"
                  icon={Phone}
                  required
                  helperText={t('hints.digits')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label={t('emergency.emergency_type')}
                  name="emergency_type"
                  value={form.emergency_type}
                  onChange={handleChange}
                  options={emergencyTypes}
                  required
                />
                <Select
                  label={t('emergency_form.severity')}
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  options={severities}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('emergency.suspected_cases')}
                  name="suspected_cases"
                  type="text"
                  value={form.suspected_cases}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  validationType="number-only"
                  required
                  helperText={t('hints.digits_eg_512')}
                />
                <Input
                  label={t('emergency_form.location')}
                  name="location_name"
                  value={form.location_name}
                  onChange={handleChange}
                  placeholder={t('emergency_form.location_ph')}
                  icon={MapPin}
                  required
                />
              </div>

              <Textarea
                label={t('emergency_form.description')}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('emergency_form.description_ph')}
                rows={4}
                required
              />

              <div className="pt-2">
                <Button type="submit" variant="danger" loading={loading} className="w-full py-3.5 text-sm font-extrabold shadow-md">
                  {t('emergency.report_emergency')}
                </Button>
              </div>
            </div>

            {/* Right: Map & GPS Location (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>{language === 'so' ? 'Goobta & Khariidadda GIS' : 'Location & GIS Coordinates'}</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {language === 'so' ? 'Riix khariidadda si toos ah ama isticmaal GPS-ka' : 'Click the map directly or use GPS locator'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <LocationPicker
                    initialLat={parseFloat(form.latitude) || 2.0469}
                    initialLng={parseFloat(form.longitude) || 45.3182}
                    onLocationSelect={handleLocationPicked}
                    height="320px"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 font-mono">
                  <span className="text-slate-500">Lat: <strong className="text-slate-800 dark:text-slate-200">{parseFloat(form.latitude || 2.0469).toFixed(4)}</strong></span>
                  <span className="text-slate-500">Lng: <strong className="text-slate-800 dark:text-slate-200">{parseFloat(form.longitude || 45.3182).toFixed(4)}</strong></span>
                </div>
              </div>

              {/* Information Guidance Box */}
              <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-2xl p-5 border border-sky-800/40 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200">
                    {language === 'so' ? 'Ogeysiis Muhiim Ah' : 'Important Notice'}
                  </h3>
                </div>
                <p className="text-xs text-sky-100/80 leading-relaxed">
                  {language === 'so'
                    ? 'Warbixintan waxay si toos ah u gaareysaa maamulayaasha caafimaadka degmada iyo kooxaha gurmadka deg-degga ah. Fadlan xaqiiji in xogta aad galisay ay tahay mid sax ah.'
                    : 'This report immediately notifies district health emergency coordinators and rapid response teams. Please verify all provided details.'}
                </p>
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
        CaafimaadHub — Somalia Community Health Emergency Response
      </footer>
    </div>
  );
}
