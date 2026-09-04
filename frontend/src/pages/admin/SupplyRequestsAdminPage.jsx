import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Truck, CheckCircle2, XCircle, Trash2, Clock, User, Package, AlertCircle, ListOrdered } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';

export default function SupplyRequestsAdminPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/requests');
      if (res.success) {
        setRequests(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setActionLoading(true);
    try {
      await api.post(`/inventory/requests/${id}/review`, {
        status,
        adminRemarks: status === 'APPROVED' ? t('supply_admin.approved_by') : status === 'ISSUED' ? t('supply_admin.dispatched') : 'Rejected'
      });
      addToast(`Supply request ${status.toLowerCase()} successfully in MySQL`, 'success');
      fetchRequests();
    } catch (err) {
      addToast(err.message || `Failed to update request`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await api.delete(`/inventory/requests/${selectedRequest.id}`);
      addToast(t('supply_admin.deleted'), 'success');
      setIsDeleteModalOpen(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      addToast(err.message || t('supply_admin.delete_failed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Hawl-wadeenka' : 'Volunteer',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
          {row.volunteer_name || 'Volunteer'}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Agabka & Tirada' : 'Item & Quantity',
      render: (row) => (
        <div>
          <span className="font-bold text-teal-800 dark:text-teal-300">{row.item_name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'so' ? 'Tirada:' : 'Quantity:'} <strong>{row.requested_quantity || row.quantity_requested || 0}</strong> {row.unit_of_measure || ''}
          </p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Ujeedada' : 'Reason / Urgency',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">{row.urgency || 'MEDIUM'}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{row.reason || (language === 'so' ? 'Buuxinta Bakhaarka' : 'Replenishment')}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => {
        const st = row.status || 'PENDING';
        return (
          <Badge variant={st === 'ISSUED' || st === 'APPROVED' ? 'success' : st === 'REJECTED' ? 'danger' : 'warning'}>
            {st}
          </Badge>
        );
      }
    },
    {
      header: language === 'so' ? 'Taariikhda Codsiga' : 'Requested Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : (language === 'so' ? 'Dhowaan' : 'Recent')}
        </span>
      )
    },
    {
      header: t('common.actions'),
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {(row.status === 'PENDING' || row.status === 'REQUESTED') && (
            <>
              <Button size="sm" variant="success" onClick={() => handleReview(row.id, 'APPROVED')} loading={actionLoading}>
                {t('common.approve')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleReview(row.id, 'REJECTED')} loading={actionLoading}>
                {t('common.reject')}
              </Button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <Button size="sm" variant="primary" onClick={() => handleReview(row.id, 'ISSUED')} icon={Truck} loading={actionLoading}>
              {t('supply_admin.issue_stock')}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            onClick={() => { setSelectedRequest(row); setIsDeleteModalOpen(true); }}
            icon={Trash2}
          >
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Truck className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.supply_requests')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('supply_admin.subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={requests.length} label={t('supply_admin.total')} icon={ListOrdered} color="teal" subtitle="All supply requests" />
        <StatCard value={requests.filter(r => r.status === 'REQUESTED' || r.status === 'PENDING').length} label={t('supply_admin.pending')} icon={Clock} color="amber" subtitle="Awaiting approval" />
        <StatCard value={requests.filter(r => r.status === 'ISSUED' || r.status === 'ACCEPTED').length} label={t('supply_admin.approved')} icon={CheckCircle2} color="emerald" subtitle="Fulfilled requests" />
        <StatCard value={requests.filter(r => r.status === 'REJECTED').length} label={t('supply_admin.rejected')} icon={XCircle} color="red" subtitle="Denied requests" />
      </div>

      <DataTable columns={columns} data={requests} loading={loading} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('supply_admin.delete_title')}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('supply_admin.confirm_delete_q')}</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Are you sure you want to remove request for "{selectedRequest?.item_name}" from MySQL?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              icon={Trash2}
              loading={actionLoading}
              onClick={handleDelete}
            >
              {t('supply_admin.confirm_delete_btn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
