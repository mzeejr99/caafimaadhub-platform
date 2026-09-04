import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MessageSquare, CheckCircle2, Eye, User, Trash2, Edit, AlertCircle, Inbox, Loader, CircleCheck } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { enumLabel } from '../../i18n/enums';

export default function FeedbackAdminPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({ status: '', adminNotes: '' });
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback');
      if (res.success) {
        setFeedbackList(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolving(true);
    try {
      await api.put(`/feedback/${selectedTicket.id}/status`, {
        status: resolutionForm.status,
        adminNotes: resolutionForm.adminNotes
      });
      addToast(t('feedback_admin.saved'), 'success');
      setSelectedTicket(null);
      fetchFeedback();
    } catch (err) {
      addToast(err.message || t('feedback_admin.update_failed'), 'error');
    } finally {
      setResolving(false);
    }
  };

  const openDeleteModal = (ticket, e) => {
    e.stopPropagation();
    setSelectedTicket(ticket);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    setResolving(true);
    try {
      await api.delete(`/feedback/${selectedTicket.id}`);
      addToast(`Feedback ticket ${selectedTicket.ticket_number} deleted successfully from MySQL`, 'success');
      setIsDeleteModalOpen(false);
      fetchFeedback();
    } catch (err) {
      addToast(err.message || t('feedback_admin.delete_failed'), 'error');
    } finally {
      setResolving(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Tixraaca' : 'Ticket No',
      accessor: 'ticket_number',
      render: (row) => <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">{row.ticket_number}</span>
    },
    {
      header: language === 'so' ? 'Qeybta & Faahfaahinta' : 'Category & Details',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{enumLabel(t, row.category)}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{row.description}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Qofka Soo Diray' : 'Submitted By',
      render: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{row.reporter_name || row.full_name || (language === 'so' ? 'Qof Bulshada Ka Mid Ah' : 'Anonymous Citizen')}</p>
          <p className="text-slate-400 dark:text-slate-500">{row.reporter_phone || row.reporter_email || row.location_name || 'Somalia'}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => <Badge status={row.status}>{t(`status.${row.status}`) || row.status}</Badge>
    },
    {
      header: language === 'so' ? 'Taariikhda' : 'Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : (language === 'so' ? 'Dhowaan' : 'Recent')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Ficillo' : 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedTicket(row);
              setResolutionForm({ status: row.status || 'RESOLVED', adminNotes: row.admin_notes || '' });
            }}
            icon={Eye}
          >
            {language === 'so' ? 'Ka Jawaab' : 'Respond'}
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => openDeleteModal(row, e)} icon={Trash2}>
            {language === 'so' ? 'Tirtir' : 'Delete'}
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
            <MessageSquare className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.feedback')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so' ? 'Aragtiyaha bulshada, cabashooyinka, talooyinka adeegga caafimaadka, iyo dabagalka isla-xisaabtanka' : 'Community complaints, service suggestions, healthcare feedback, and accountability tracking'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={feedbackList.length} label={language === 'so' ? 'Wadarta Farriimaha' : 'Total Submissions'} icon={MessageSquare} color="teal" subtitle={language === 'so' ? 'Dhammaan aragtiyaha bulshada' : 'All community submissions'} />
        <StatCard value={feedbackList.filter(f => ['NEW','RECEIVED'].includes(f.status)).length} label={language === 'so' ? 'Kuwa Cusub' : 'Awaiting Response'} icon={Inbox} color="blue" subtitle={language === 'so' ? 'Sugaya jawaab' : 'Awaiting response'} />
        <StatCard value={feedbackList.filter(f => f.status === 'IN_PROGRESS').length} label={language === 'so' ? 'Gacanta Ku Jira' : 'In Progress'} icon={Loader} color="amber" subtitle={language === 'so' ? 'Hadda la baarayo' : 'Being handled'} />
        <StatCard value={feedbackList.filter(f => f.status === 'RESOLVED').length} label={language === 'so' ? 'La Xalliyay' : 'Resolved'} icon={CircleCheck} color="emerald" subtitle={language === 'so' ? 'Si guul leh loo xiray' : 'Successfully closed'} />
      </div>

      <DataTable
        columns={columns}
        data={feedbackList}
        loading={loading}
        searchPlaceholder="Search feedback tickets..."
      />

      {/* RESOLVE / RESPOND MODAL */}
      <Modal
        isOpen={!!selectedTicket && !isDeleteModalOpen}
        onClose={() => setSelectedTicket(null)}
        title={`Respond to Feedback Ticket: ${selectedTicket?.ticket_number}`}
        size="lg"
      >
        {selectedTicket && (
          <form noValidate onSubmit={handleResolve} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">{t('feedback_admin.category')} <strong className="text-slate-900 dark:text-white">{selectedTicket.category}</strong></span>
                <span className="text-slate-500 dark:text-slate-400">{t('feedback_admin.from')} <strong className="text-slate-900 dark:text-white">{selectedTicket.reporter_name || t('feedback_admin.anonymous')}</strong></span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                "{selectedTicket.description}"
              </p>
            </div>

            <Select
              label={t('feedback_admin.ticket_status')}
              name="status"
              value={resolutionForm.status}
              onChange={(e) => setResolutionForm({ ...resolutionForm, status: e.target.value })}
              options={[
                { value: 'NEW', label: t('feedback_admin.st_new') },
                { value: 'IN_PROGRESS', label: t('feedback_admin.st_review') },
                { value: 'RESOLVED', label: t('feedback_admin.st_resolved') },
                { value: 'CLOSED', label: t('feedback_admin.st_closed') }
              ]}
              required
            />

            <Textarea
              label={t('feedback_admin.official_response')}
              name="adminNotes"
              value={resolutionForm.adminNotes}
              onChange={(e) => setResolutionForm({ ...resolutionForm, adminNotes: e.target.value })}
              placeholder={t('feedback_admin.response_ph')}
              rows={3}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>{t('common.cancel')}</Button>
              <Button type="submit" loading={resolving}>{t('feedback_admin.save_response')}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('feedback_admin.confirm_delete')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('feedback_admin.confirm_text')} <strong className="text-slate-900 dark:text-white">{selectedTicket?.ticket_number}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={resolving} onClick={handleDeleteTicket}>{t('feedback_admin.delete_permanent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
