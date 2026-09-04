import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useOffline } from '../../contexts/OfflineContext';
import { ClipboardList, MapPin, CheckCircle2, Save, WifiOff, AlertCircle, User, Camera, Image, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Input, Select, Textarea } from '../../components/common/Input';
import LocationPicker from '../../components/maps/LocationPicker';
import api from '../../services/api';
import syncManager from '../../offline/syncManager';
import { validateTextOnly, validateNumberOnly } from '../../utils/validation';

export default function FieldDataFormPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const { isOnline } = useOffline();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  const [form, setForm] = useState({
    campaignId: '',
    householdHead: '',
    familyMembersCount: '',
    underFiveChildren: '',
    vaccinatedUnderFive: '',
    suspectedIllness: '',
    cleanWaterSource: '',
    notes: '',
    photoUrl: '',
    latitude: '2.0469',
    longitude: '45.3182'
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError(language === 'so' ? 'Sawirku waa inuu ka yaraadaa 5MB' : 'Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setForm(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setForm(prev => ({ ...prev, photoUrl: '' }));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      if (res.success || Array.isArray(res.data) || Array.isArray(res)) {
        const list = res.data || (Array.isArray(res) ? res : []);
        setCampaigns(list);
        if (list.length > 0 && !form.campaignId) {
          setForm(prev => ({ ...prev, campaignId: list[0].id }));
        }
      }
    } catch (err) {
      console.warn('Using offline campaign cache:', err.message);
    }
  };

  const handleLocationPicked = ({ latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(latitude),
      longitude: String(longitude)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.campaignId) {
      setFormError(language === 'so' ? 'Fadlan dooro ololaha caafimaadka' : 'Please select a campaign');
      return;
    }

    // Strict validation
    const nameCheck = validateTextOnly(form.householdHead, 'Magaca Madaxa Qoyska', language);
    if (!nameCheck.isValid) {
      setFormError(nameCheck.message);
      return;
    }

    const membersCheck = validateNumberOnly(form.familyMembersCount, 'Tirada Dadka Qoyska', language);
    if (!membersCheck.isValid) {
      setFormError(membersCheck.message);
      return;
    }

    const childrenCheck = validateNumberOnly(form.underFiveChildren, 'Tirada Carruurta 5 sano ka yar', language);
    if (!childrenCheck.isValid) {
      setFormError(childrenCheck.message);
      return;
    }

    if (!form.vaccinatedUnderFive) {
      setFormError(language === 'so' ? 'Fadlan dooro xaaladda talaalka carruurta' : 'Please select vaccination status');
      return;
    }

    if (!form.suspectedIllness) {
      setFormError(language === 'so' ? 'Fadlan dooro calaamadda cudurka' : 'Please select suspected illness');
      return;
    }

    if (!form.cleanWaterSource) {
      setFormError(language === 'so' ? 'Fadlan dooro isha biyaha cabitaanka' : 'Please select clean water source status');
      return;
    }

    setLoading(true);

    const submissionPayload = {
      campaignId: form.campaignId,
      fieldFormId: 1,
      latitude: parseFloat(form.latitude) || 2.0469,
      longitude: parseFloat(form.longitude) || 45.3182,
      accuracy: 10.0,
      data: {
        householdHead: form.householdHead,
        familyMembersCount: parseInt(form.familyMembersCount, 10),
        underFiveChildren: parseInt(form.underFiveChildren, 10),
        vaccinatedUnderFive: form.vaccinatedUnderFive,
        suspectedIllness: form.suspectedIllness,
        cleanWaterSource: form.cleanWaterSource,
        notes: form.notes,
        photoUrl: form.photoUrl
      }
    };

    try {
      if (!isOnline) {
        await syncManager.saveOfflineSubmission(submissionPayload);
        addToast(t('field_form.saved_offline_toast'), 'info', t('field_form.saved_offline'));
      } else {
        await api.post('/field-data/submit', submissionPayload);
        addToast(t('field_form.submitted_toast'), 'success', t('field_form.submitted'));
      }
      setSubmittedSuccess(true);
    } catch (err) {
      setFormError(err.message || t('field_form.submit_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setFormError('');
    setPhotoPreview('');
    setForm({
      campaignId: campaigns[0]?.id || '',
      householdHead: '',
      familyMembersCount: '',
      underFiveChildren: '',
      vaccinatedUnderFive: '',
      suspectedIllness: '',
      cleanWaterSource: '',
      notes: '',
      photoUrl: '',
      latitude: '2.0469',
      longitude: '45.3182'
    });
  };

  if (submittedSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-8 text-center shadow-lg">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
            {isOnline ? t('field_form.sent_title') : t('field_form.saved_title')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-6">
            {isOnline
              ? t('field_form.sent_text')
              : t('field_form.saved_text')}
          </p>
          <Button onClick={handleReset} className="w-full">
            Diiwaangeli Qoys Kale (Next Household)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('volunteer_portal.submit_report')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Booqashada qoysaska, baaritaanka talaalka carruurta, iyo diiwaangelinta xaaladaha caafimaad
        </p>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
          <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <span><strong>{t('field_form.offline_label')}</strong> {t('field_form.offline_hint')}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 w-full">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Form Details */}
          <div className="space-y-4">
            <Select
              label={t('field_form.campaign')}
              name="campaignId"
              value={form.campaignId}
              onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
              options={campaigns.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
              required
            />

            <Input
              label={t('field_form.head_name')}
              name="householdHead"
              value={form.householdHead}
              onChange={(e) => setForm({ ...form, householdHead: e.target.value })}
              placeholder={t('field_form.head_name_ph')}
              validationType="text-only"
              icon={User}
              required
              helperText={t('hints.letters_enter')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('field_form.family_size')}
                name="familyMembersCount"
                type="text"
                value={form.familyMembersCount}
                onChange={(e) => setForm({ ...form, familyMembersCount: e.target.value })}
                validationType="number-only"
                required
                helperText={t('hints.digits_eg_5')}
              />
              <Input
                label={t('field_form.under_five')}
                name="underFiveChildren"
                type="text"
                value={form.underFiveChildren}
                onChange={(e) => setForm({ ...form, underFiveChildren: e.target.value })}
                validationType="number-only"
                required
                helperText={t('hints.digits_eg_2')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('field_form.vaccinated')}
                name="vaccinatedUnderFive"
                value={form.vaccinatedUnderFive}
                onChange={(e) => setForm({ ...form, vaccinatedUnderFive: e.target.value })}
                options={[
                  { value: 'YES', label: t('field_form.vacc_yes') },
                  { value: 'PARTIAL', label: t('field_form.vacc_partial') },
                  { value: 'NO', label: t('field_form.vacc_no') },
                  { value: 'NO_CHILDREN', label: t('field_form.vacc_none') }
                ]}
                required
              />
              <Select
                label={t('field_form.symptoms')}
                name="suspectedIllness"
                value={form.suspectedIllness}
                onChange={(e) => setForm({ ...form, suspectedIllness: e.target.value })}
                options={[
                  { value: 'NONE', label: t('field_form.sym_none') },
                  { value: 'ACUTE_WATERY_DIARRHEA', label: t('field_form.sym_awd') },
                  { value: 'MEASLES_RASH', label: t('field_form.sym_measles') },
                  { value: 'MALARIA', label: t('field_form.sym_malaria') },
                  { value: 'MALNUTRITION', label: t('field_form.sym_malnutrition') }
                ]}
                required
              />
            </div>

            <Select
              label={t('field_form.water_source')}
              name="cleanWaterSource"
              value={form.cleanWaterSource}
              onChange={(e) => setForm({ ...form, cleanWaterSource: e.target.value })}
              options={[
                { value: 'YES', label: t('field_form.water_safe') },
                { value: 'NO', label: t('field_form.water_unsafe') }
              ]}
              required
            />
          </div>

          {/* Right Column: GPS Location Picker & Notes */}
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Goobta Juqraafiga ee Guriga (GPS Tagging)
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <LocationPicker
                  initialLat={parseFloat(form.latitude) || 2.0469}
                  initialLng={parseFloat(form.longitude) || 45.3182}
                  onLocationSelect={handleLocationPicked}
                  height="220px"
                />
              </div>
            </div>

            {/* Photo / Image Attachment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Sawirka Goobta / Bukaan-socodka (Photo Attachment)
              </label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-teal-500 bg-slate-50 dark:bg-slate-800/60 p-2 text-center">
                  <img src={photoPreview} alt={t('field_form.photo_alt')} className="max-h-48 w-full object-cover rounded-lg mx-auto" />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-4 right-4 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all cursor-pointer"
                    title={t('field_form.remove_photo')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('field_form.photo_attached')}
                  </p>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-600 dark:hover:border-teal-400 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/30 dark:hover:bg-teal-950/30 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-teal-100/70 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 group-hover:scale-110 flex items-center justify-center mb-2 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    {language === 'so' ? 'Riix si aad sawir u soo geliso' : 'Click to Upload / Capture Photo'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{t('field_form.photo_types')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <Textarea
              label={t('field_form.notes')}
              name="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t('field_form.notes_ph')}
              rows={3}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button type="submit" loading={loading} size="lg" icon={Save}>
            {isOnline ? t('field_form.submit') : t('field_form.save_offline')}
          </Button>
        </div>
      </form>
    </div>
  );
}
