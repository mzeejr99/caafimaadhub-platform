import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { ClipboardList, MapPin, Calendar, Eye, CheckCircle2, XCircle, Trash2, User, AlertCircle, Clock, FileCheck, FileX, Camera, Pill } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export default function FieldSubmissionsPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [deletingSubmission, setDeletingSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/field-data/submissions');
      if (res && res.success) {
        setSubmissions(res.data || []);
      }
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Silent auto refresh every 12 seconds
  useAutoRefresh(fetchSubmissions, 12000, !reviewSubmission && !deletingSubmission);

  const handleReview = async (id, reviewStatus) => {
    setActionLoading(true);
    try {
      await api.post(`/field-data/submissions/${id}/review`, {
        reviewStatus,
        reviewComments: reviewStatus === 'APPROVED' ? (language === 'so' ? 'Waa la ansixiyay' : 'Approved by supervisor') : (language === 'so' ? 'Dib-u-eegis ayaa loo baahan yahay' : 'Requires revision')
      });
      addToast(
        language === 'so'
          ? `Warbixinta xaaladdeeda waxaa loo beddelay ${reviewStatus}`
          : `Submission marked as ${reviewStatus}`,
        'success'
      );
      if (reviewSubmission?.id === id) {
        setReviewSubmission(prev => ({ ...prev, review_status: reviewStatus }));
      }
      fetchSubmissions(true);
    } catch (err) {
      addToast(err.message || (language === 'so' ? 'Dib-u-eegistu way fashilantay' : 'Review failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSubmission) return;
    setActionLoading(true);
    try {
      await api.delete(`/field-data/submissions/${deletingSubmission.id}`);
      addToast(language === 'so' ? 'Warbixinta si guul leh ayaa loo tirtiray' : 'Submission deleted successfully', 'success');
      setDeletingSubmission(null);
      fetchSubmissions(true);
    } catch (err) {
      addToast(err.message || (language === 'so' ? 'Tirtiriddu way fashilantay' : 'Failed to delete'), 'error');
    } finally {
      setActionLoading(false);
    }
  };


  const getSubmissionPhoto = (row) => {
    try {
      const p = typeof row.payload_data === 'string' ? JSON.parse(row.payload_data) : (row.payload_data || row.data || {});
      return p?.photoUrl || p?.photo_url || p?.photo || p?.image_url;
    } catch (e) {
      return null;
    }
  };

  const getSubmissionSupplies = (row) => {
    try {
      const p = typeof row.payload_data === 'string' ? JSON.parse(row.payload_data) : (row.payload_data || row.data || {});
      if (p?.distributedSupplies === 'YES' || p?.distributed_supplies === 'YES') {
        const rawItem = p.supplyItem || p.supply_item || 'ORS_SACHETS';
        const qty = p.supplyQuantity || p.supply_quantity || 1;
        const itemLabels = {
          ORS_SACHETS: 'ORS',
          ZINC_TABLETS: 'Zinc',
          PARACETAMOL_SYRUP: 'Paracetamol',
          VITAMIN_A: 'Vit A',
          AQUATABS_WATER: 'Aquatabs',
          MUAC_TAPE: 'MUAC',
          SOAP_HYGIENE: 'Soap/Kit',
          MOSQUITO_NET: 'Bed Net'
        };
        return {
          item: itemLabels[rawItem] || rawItem,
          qty,
          notes: p.supplyNotes || p.supply_notes
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const columns = [
    {
      header: language === 'so' ? 'Foomka / Ololaha' : 'Form / Campaign',
      render: (row) => {
        const hasPhoto = !!getSubmissionPhoto(row);
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {row.form_title || row.form_name || (language === 'so' ? 'Foomka Xog-ururinta' : 'Assessment Form')}
              </span>
              {hasPhoto && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 text-[10px] font-bold" title={language === 'so' ? 'Sawir baa ku lifaaqan' : 'Photo attached'}>
                  <Camera className="w-3 h-3" /> {language === 'so' ? 'Sawir' : 'Photo'}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
              {row.campaign_name || (language === 'so' ? 'Barnaamij Guud' : 'General Program')}
            </p>
          </div>
        );
      }
    },
    {
      header: language === 'so' ? 'Hawl-wadeenka' : 'Volunteer',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          {row.volunteer_name || (language === 'so' ? 'Hawl-wadeen' : 'CHV Agent')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Agab La Siiyay' : 'Supplies Given',
      render: (row) => {
        const supplies = getSubmissionSupplies(row);
        if (!supplies) {
          return <span className="text-xs text-slate-400 dark:text-slate-600">—</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Pill className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {supplies.qty}x {supplies.item}
          </span>
        );
      }
    },
    {
      header: language === 'so' ? 'Goobta / GPS' : 'Location / GPS',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {row.latitude && row.longitude
            ? `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`
            : row.location_name || (language === 'so' ? 'Goobta' : 'Field Site')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda Dib-u-eegista' : 'Review Status',
      render: (row) => {
        const st = row.review_status || 'PENDING';
        const stLabel = language === 'so'
          ? (st === 'APPROVED' ? 'La Ansixiyay' : (st === 'REJECTED' ? 'La Diiday' : 'Sugaya Ansixin'))
          : st;
        return (
          <Badge variant={st === 'APPROVED' ? 'success' : st === 'REJECTED' ? 'danger' : 'warning'}>
            {stLabel}
          </Badge>
        );
      }
    },
    {
      header: language === 'so' ? 'Waqtiga La Gudbiyay' : 'Submitted At',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {row.submission_datetime
            ? new Date(row.submission_datetime).toLocaleString()
            : row.created_at
            ? new Date(row.created_at).toLocaleString()
            : (language === 'so' ? 'Dhowaan' : 'Recent')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Ficillo' : 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setReviewSubmission(row)} icon={Eye}>
            {language === 'so' ? 'Faahfaahin' : 'View Details'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={() => setDeletingSubmission(row)}
            icon={Trash2}
          >
            {language === 'so' ? 'Tirtir' : 'Delete'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-teal-700 dark:text-teal-400" />
          <span>{language === 'so' ? 'Xog-ururinta Goobta' : 'Field Data Collection'}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {language === 'so' ? 'Kayd waqti-xaadir ah oo ay ku jiraan baaritaannada goobta, sahannada, iyo baarista caafimaadka' : 'Real-time repository of field assessments, surveys, and health screenings'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={submissions.length}
          label={language === 'so' ? 'Wadarta Warbixinnada' : 'Total Reports'}
          icon={ClipboardList}
          color="teal"
          subtitle={language === 'so' ? 'Dhammaan warbixinnada goobta' : 'All field submissions'}
        />
        <StatCard
          value={submissions.filter(s => s.review_status === 'PENDING').length}
          label={language === 'so' ? 'Sugaya Dib-u-eegis' : 'Pending Review'}
          icon={Clock}
          color="amber"
          subtitle={language === 'so' ? 'Codsiyada u baahan ansixinta' : 'Awaiting approval'}
        />
        <StatCard
          value={submissions.filter(s => s.review_status === 'APPROVED').length}
          label={language === 'so' ? 'La Ansixiyay' : 'Approved'}
          icon={FileCheck}
          color="emerald"
          subtitle={language === 'so' ? 'Warbixinnada la xaqiijiyay' : 'Verified reports'}
        />
        <StatCard
          value={submissions.filter(s => s.review_status === 'REJECTED').length}
          label={language === 'so' ? 'La Diiday' : 'Rejected'}
          icon={FileX}
          color="red"
          subtitle={language === 'so' ? 'U baahan dib-u-saxid' : 'Needs resubmission'}
        />
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        loading={loading}
        searchPlaceholder={language === 'so' ? 'Ku raadso foom, olole ama magac...' : 'Search submissions...'}
        onRowClick={(row) => setReviewSubmission(row)}
      />

      {/* Submission Detail Modal */}
      <Modal
        isOpen={!!reviewSubmission}
        onClose={() => setReviewSubmission(null)}
        title={language === 'so' ? 'Diiwaanka Hubinta ee Gudbinta Goobta' : 'Field Submission Audit Record'}
        subtitle={`Recorded by ${reviewSubmission?.volunteer_name || 'Volunteer'}`}
        maxWidth="max-w-2xl"
      >
        {reviewSubmission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Ololaha:' : 'Campaign:'}</p>
                <p className="font-bold text-slate-800 dark:text-white">{reviewSubmission.campaign_name || (language === 'so' ? 'Barnaamij Guud' : 'General Program')}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Hawl-wadeenka:' : 'Volunteer:'}</p>
                <p className="font-bold text-slate-800 dark:text-white">{reviewSubmission.volunteer_name}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Goobta GPS:' : 'GPS Location:'}</p>
                <p className="font-mono text-teal-700 dark:text-teal-400 font-semibold">
                  {reviewSubmission.latitude ? `${reviewSubmission.latitude}, ${reviewSubmission.longitude}` : (language === 'so' ? 'Lama diiwaangelin' : 'Not recorded')}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Xaaladda Dib-u-eegista:' : 'Review Status:'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {reviewSubmission.review_status || 'PENDING'}
                </p>
              </div>
            </div>

            {getSubmissionSupplies(reviewSubmission) && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      {language === 'so' ? 'Agab Caafimaad oo Qoyska La Siiyay' : 'Health Supplies Distributed to Household'}
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                      {getSubmissionSupplies(reviewSubmission).qty}x {getSubmissionSupplies(reviewSubmission).item}
                      {getSubmissionSupplies(reviewSubmission).notes && (
                        <span className="font-normal text-slate-600 dark:text-slate-400 ml-1.5">({getSubmissionSupplies(reviewSubmission).notes})</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md shrink-0">
                  {language === 'so' ? 'Gacanta laga bixiyay' : 'Distributed On-Site'}
                </span>
              </div>
            )}

            {getSubmissionPhoto(reviewSubmission) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{language === 'so' ? 'Sawirka Goobta' : 'Field Photo'}</p>
                <a href={getSubmissionPhoto(reviewSubmission)} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-lg">
                  <img
                    src={getSubmissionPhoto(reviewSubmission)}
                    alt="Field Submission Capture"
                    className="w-full max-h-56 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
                    {language === 'so' ? 'Riix si aad u weyneysid' : 'Click to enlarge'}
                  </span>
                </a>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{language === 'so' ? 'Xogtii La Ururiyay' : 'Collected Payload Data'}</p>
              <pre className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48">
                {typeof reviewSubmission.payload_data === 'string'
                  ? reviewSubmission.payload_data
                  : JSON.stringify(reviewSubmission.payload_data || reviewSubmission.data, null, 2)}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="success"
                  loading={actionLoading}
                  onClick={() => handleReview(reviewSubmission.id, 'APPROVED')}
                  icon={CheckCircle2}
                >
                  {language === 'so' ? 'Ansixi' : 'Approve'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={actionLoading}
                  onClick={() => handleReview(reviewSubmission.id, 'REJECTED')}
                  icon={XCircle}
                >
                  {language === 'so' ? 'Diid' : 'Reject'}
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={() => setReviewSubmission(null)}>
                {language === 'so' ? 'Xir' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deletingSubmission}
        onClose={() => setDeletingSubmission(null)}
        title={language === 'so' ? 'Xaqiiji Tirtiridda' : 'Confirm Deletion'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'so' ? 'Si joogto ah ma u tirtiraysaa gudbintan?' : 'Are you sure you want to permanently delete this field submission?'}
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setDeletingSubmission(null)}>
              {language === 'so' ? 'Ka Noqo' : 'Cancel'}
            </Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>
              {language === 'so' ? 'Tirtir' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

