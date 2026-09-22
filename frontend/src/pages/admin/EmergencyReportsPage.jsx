import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AlertTriangle, MapPin, Eye, Phone, CheckCircle2, Trash2, Edit, AlertCircle, ShieldAlert, Siren, Activity } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Select, Textarea, Input } from '../../components/common/Input';
import api from '../../services/api';
import { enumLabel } from '../../i18n/enums';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export default function EmergencyReportsPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewEmergency, setReviewEmergency] = useState(null);
  const [deletingEmergency, setDeletingEmergency] = useState(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({ status: '', investigationNotes: '', actionTaken: '' });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchEmergencies = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/emergencies');
      if (res && res.success) {
        setEmergencies(res.data || []);
      }
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  // Silent background refresh every 10 seconds without flickering
  useAutoRefresh(fetchEmergencies, 10000);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!reviewEmergency) return;
    setUpdateLoading(true);
    try {
      await api.put(`/emergencies/${reviewEmergency.id}/action`, {
        status: statusUpdateForm.status,
        investigationNotes: statusUpdateForm.investigationNotes,
        actionTaken: statusUpdateForm.actionTaken
      });
      addToast(t('emerg_admin.updated'), 'success');
      setReviewEmergency(null);
      fetchEmergencies(true);
    } catch (err) {
      addToast(err.message || t('emerg_admin.update_failed'), 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const openDeleteModal = (item, e) => {
    e.stopPropagation();
    setDeletingEmergency(item);
  };

  const handleDeleteEmergency = async () => {
    if (!deletingEmergency) return;
    setUpdateLoading(true);
    try {
      await api.delete(`/emergencies/${deletingEmergency.id}`);
      addToast(
        language === 'so'
          ? `Digniinta ${deletingEmergency.report_code} si guul leh ayaa loo tirtiray`
          : `Emergency report ${deletingEmergency.report_code} deleted successfully`,
        'success'
      );
      setDeletingEmergency(null);
      fetchEmergencies(true);
    } catch (err) {
      addToast(err.message || t('emerg_admin.delete_failed'), 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Koodhka Warbixinta' : 'Report Code',
      accessor: 'report_code',
      render: (row) => <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{row.report_code}</span>
    },
    {
      header: language === 'so' ? 'Nooca Xaaladda Deg-degga ah' : 'Emergency Type',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{enumLabel(t, row.emergency_type)}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{row.description}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Heerka Halista' : 'Severity',
      render: (row) => <Badge status={row.severity}>{t(`priority.${row.severity}`) || row.severity}</Badge>
    },
    {
      header: language === 'so' ? 'Goobta & Kiisaska' : 'Location & Cases',
      render: (row) => (
        <div className="text-xs text-slate-700 dark:text-slate-200">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {row.community_name || row.location_name || (language === 'so' ? 'Goobta' : 'Community Site')}
          </span>
          <p className="text-red-600 dark:text-red-400 font-semibold mt-0.5">
            {language === 'so' ? 'Kiisaska la tuhmayo:' : 'Suspected Cases:'} <strong>{row.suspected_cases_count || row.suspected_cases || 0}</strong>
          </p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Qofka Soo Sheegay' : 'Reporter',
      render: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{row.reporter_name || (language === 'so' ? 'Qof Aan Magaciisa Sheegin' : 'Anonymous')}</p>
          <p className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {row.reporter_phone || 'N/A'}
          </p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => <Badge status={row.status}>{t(`status.${row.status}`) || row.status}</Badge>
    },
    {
      header: t('common.actions'),
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setReviewEmergency(row);
              setStatusUpdateForm({
                status: row.status || 'INVESTIGATING',
                investigationNotes: row.investigation_notes || '',
                actionTaken: row.action_taken || ''
              });
            }}
            icon={Eye}
          >
            {t('emerg_admin.review')}
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => openDeleteModal(row, e)} icon={Trash2}>
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" /> {t('nav.emergencies')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so'
              ? 'Ogaanshaha cudurrada dillaacay ee waqtiga dhabta ah, digniinaha halista ah, iyo iskuduwidda gurmadka goobta'
              : 'Real-time disease outbreak detection, severe alerts, and rapid emergency field coordination'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          value={emergencies.filter(e => !['RESOLVED','FALSE_ALARM'].includes(e.status)).length} 
          label={t('emerg_admin.active_alerts')} 
          icon={Siren} 
          color="red" 
          subtitle={language === 'so' ? 'Xaalado deg-deg ah oo furan' : 'Unresolved emergencies'} 
        />
        <StatCard 
          value={emergencies.filter(e => e.severity === 'CRITICAL').length} 
          label={t('emerg_admin.critical')} 
          icon={ShieldAlert} 
          color="red" 
          subtitle={language === 'so' ? 'Gurmad deg-deg ah loo baahan yahay' : 'Immediate response needed'} 
        />
        <StatCard 
          value={emergencies.filter(e => e.severity === 'HIGH').length} 
          label={t('emerg_admin.high')} 
          icon={AlertTriangle} 
          color="orange" 
          subtitle={language === 'so' ? 'Dhacdooyinka mudnaanta sare leh' : 'High priority incidents'} 
        />
        <StatCard 
          value={emergencies.filter(e => e.status === 'RESOLVED').length} 
          label={t('emerg_admin.resolved')} 
          icon={CheckCircle2} 
          color="emerald" 
          subtitle={language === 'so' ? 'Dhacdooyinka la xalliyay' : 'Closed incidents'} 
        />
      </div>

      <DataTable
        columns={columns}
        data={emergencies}
        loading={loading}
        searchPlaceholder={language === 'so' ? 'Raadi warbixinnada xaaladaha deg-degga ah...' : 'Search emergency reports...'}
      />

      {/* REVIEW & RESPOND MODAL */}
      <Modal
        isOpen={!!reviewEmergency}
        onClose={() => setReviewEmergency(null)}
        title={`Emergency Outbreak Incident: ${reviewEmergency?.report_code}`}
        size="lg"
      >
        {reviewEmergency && (
          <form noValidate onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="bg-red-50/50 dark:bg-red-950/40 p-4 rounded-xl border border-red-100 dark:border-red-900/60 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('emerg_admin.incident_type')}</p>
                <p className="text-slate-900 dark:text-white font-bold">{reviewEmergency.emergency_type}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('emerg_admin.severity_cases')}</p>
                <p className="text-red-700 dark:text-red-400 font-bold">
                  {reviewEmergency.severity} ({reviewEmergency.suspected_cases_count || reviewEmergency.suspected_cases || 0} Cases)
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{t('emerg_admin.description')}</p>
                <p className="text-slate-900 dark:text-slate-200 mt-1 leading-relaxed">{reviewEmergency.description}</p>
              </div>
            </div>

            <Select
              label={t('emerg_admin.investigation_status')}
              name="status"
              value={statusUpdateForm.status}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
              options={[
                { value: 'REPORTED', label: t('emerg_admin.st_reported') },
                { value: 'INVESTIGATING', label: t('emerg_admin.st_investigating') },
                { value: 'RESPONSE_DISPATCHED', label: t('emerg_admin.st_dispatched') },
                { value: 'CONTAINED', label: t('emerg_admin.st_contained') },
                { value: 'RESOLVED', label: t('emerg_admin.st_resolved') },
                { value: 'FALSE_ALARM', label: t('emerg_admin.st_false') }
              ]}
              required
              submitted={submitted}
            />

            <Textarea
              label={t('emerg_admin.investigation_notes')}
              name="investigationNotes"
              value={statusUpdateForm.investigationNotes}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, investigationNotes: e.target.value })}
              placeholder={t('emerg_admin.notes_ph')}
              rows={2}
              submitted={submitted}
            />

            <Textarea
              label={t('emerg_admin.action_taken')}
              name="actionTaken"
              value={statusUpdateForm.actionTaken}
              onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, actionTaken: e.target.value })}
              placeholder={t('emerg_admin.action_ph')}
              rows={2}
              submitted={submitted}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setReviewEmergency(null)}>{t('common.cancel')}</Button>
              <Button type="submit" loading={updateLoading}>{t('emerg_admin.save_response')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={!!deletingEmergency} onClose={() => setDeletingEmergency(null)} title={t('emerg_admin.confirm_delete')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'so' ? 'Ma hubtaa inaad tirtirto digniinta cudurka dillaacay ee ' : 'Are you sure you want to permanently delete emergency outbreak report '}
            <strong className="text-slate-900 dark:text-white font-bold">{deletingEmergency?.report_code}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setDeletingEmergency(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={updateLoading} onClick={handleDeleteEmergency}>{t('emerg_admin.delete_permanent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

