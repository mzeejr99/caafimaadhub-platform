import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AlertTriangle, MapPin, CheckCircle2, User, Phone, AlertCircle, Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Input, Select, Textarea } from '../../components/common/Input';
import Button from '../../components/common/Button';
import LocationPicker from '../../components/maps/LocationPicker';
import api from '../../services/api';
import { validateTextOnly, validatePhone, validateNumberOnly } from '../../utils/validation';

export default function EmergencyReportPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const [form, setForm] = useState({
    reporter_name: '',
    reporter_phone: '',
    emergency_type: '',
    severity: '',
    description: '',
    location_name: '',
    suspected_cases: '5',
    latitude: '2.0469',
    longitude: '45.3182'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const emergencyTypes = [
    { value: 'DISEASE_OUTBREAK', label: t('emergency_form.type_outbreak') },
    { value: 'FLOOD', label: t('emergency_form.type_flood') },
    { value: 'DROUGHT', label: t('emergency_form.type_drought') },
    { value: 'CONFLICT_DISPLACEMENT', label: t('emergency_form.type_conflict') },
    { value: 'MALNUTRITION_CRISIS', label: t('emergency_form.type_malnutrition') },
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

    if (!form.description.trim() || !form.location_name.trim()) {
      setError(language === 'so' ? 'Fadlan buuxi goobta iyo faahfaahinta xaaladda deg-degga ah' : 'Please fill in location and description.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between py-10 px-4 transition-colors duration-200">
      {/* Top Controls Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between pb-4">
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

      <div className="w-full max-w-xl mx-auto my-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-600 dark:bg-red-700 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-900/30 ring-4 ring-red-50 dark:ring-red-950/60">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('emergency.report_emergency')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Soo sheeg cudur dillaacay, shuban-biyood, Jadeeco, ama xaalad deg-deg ah si kooxda gurmadka degmada loogu diro
          </p>
        </div>

        {success ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/60 p-8 text-center shadow-xl transition-colors">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('emergency_form.sent')}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">{t('emergency_form.code')}</p>
            <p className="text-2xl font-mono font-extrabold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 rounded-xl py-3 px-6 inline-block border border-red-200 dark:border-red-800/60 shadow-sm">
              {success.reportCode}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">{t('emergency_form.dispatched')}</p>
            <button
              onClick={() => setSuccess(null)}
              className="mt-6 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 font-bold block mx-auto underline cursor-pointer"
            >
              {t('emergency_form.report_another')}
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
                placeholder="e.g. 8"
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
              rows={3}
              required
            />

            {/* Interactive Location Picker Map */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <LocationPicker
                initialLat={parseFloat(form.latitude) || 2.0469}
                initialLng={parseFloat(form.longitude) || 45.3182}
                onLocationSelect={handleLocationPicked}
                height="200px"
              />
            </div>

            <Button type="submit" variant="danger" loading={loading} className="w-full py-3">
              {t('emergency.report_emergency')}
            </Button>
          </form>
        )}
      </div>

      <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
        CaafimaadHub — Somalia Community Health Emergency Response
      </footer>
    </div>
  );
}
