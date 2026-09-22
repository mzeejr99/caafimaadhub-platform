import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Users, Phone, Mail, MapPin, Award, CheckCircle2, XCircle, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function VolunteerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useNotification();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteer(false);
  }, [id]);

  const fetchVolunteer = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get(`/volunteers/${id}`);
      if (res.success) {
        setVolunteer(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useAutoRefresh(fetchVolunteer, 12000);

  const handleApprove = async () => {
    try {
      await api.post(`/volunteers/${id}/approve`, { reviewNotes: 'Approved by Administrator' });
      addToast(t('vol_detail.approved'), 'success');
      fetchVolunteer();
    } catch (err) {
      addToast(err.message || t('vol_detail.approve_failed'), 'error');
    }
  };

  const handleSuspend = async () => {
    try {
      await api.put(`/volunteers/${id}/status`, { status: 'SUSPENDED', notes: 'Suspended by Administrator' });
      addToast(t('vol_detail.suspended'), 'success');
      fetchVolunteer();
    } catch (err) {
      addToast(err.message || t('vol_detail.action_failed'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!volunteer) {
    return <div className="text-center py-20 text-slate-500">{t('vol_detail.not_found')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/volunteers')} icon={ArrowLeft}>
          {t('common.back')}
        </Button>
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {volunteer.avatar_url || volunteer.profile_image_url ? (
            <img
              src={volunteer.avatar_url || volunteer.profile_image_url}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
              }}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-500/40 shadow-md ring-2 ring-teal-500/20 shrink-0"
            />
          ) : null}
          <div className={`w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-200 dark:border-teal-800 items-center justify-center text-teal-700 dark:text-teal-400 font-extrabold text-xl shadow-xs shrink-0 ${volunteer.avatar_url || volunteer.profile_image_url ? 'hidden' : 'flex'}`}>
            {volunteer.full_name ? volunteer.full_name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate">{volunteer.full_name}</h1>
            <p className="text-xs text-teal-700 dark:text-teal-400 font-mono mt-0.5">{volunteer.volunteer_id}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card title={t('vol_detail.profile')} icon={Users}>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('common.status')}:</span>
              <Badge status={volunteer.status}>{volunteer.status}</Badge>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('vol_detail.phone')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {volunteer.phone}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('vol_detail.email')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {volunteer.email || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('vol_detail.region_district')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {volunteer.region_name || 'Somalia'} / {volunteer.district_name || 'Central'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('vol_detail.education')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{volunteer.education_level || 'Secondary'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('vol_detail.languages')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{volunteer.languages_spoken || 'Somali'}</span>
            </div>

            <div className="pt-4 flex gap-2">
              {volunteer.status === 'PENDING' && (
                <Button size="sm" variant="success" onClick={handleApprove} className="w-full" icon={CheckCircle2}>
                  {t('common.approve')}
                </Button>
              )}
              {volunteer.status === 'APPROVED' && (
                <Button size="sm" variant="danger" onClick={handleSuspend} className="w-full" icon={XCircle}>
                  {t('vol_detail.suspend')}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Assigned Tasks & History */}
        <div className="lg:col-span-2 space-y-6">
          <Card title={t('vol_detail.completed_assignments')} icon={Award}>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('vol_detail.completed_intro')} <strong className="text-slate-900 dark:text-white">12</strong> {t('vol_detail.assignments_with')} <strong className="text-slate-900 dark:text-white">98%</strong> {t('vol_detail.on_time_accuracy')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
