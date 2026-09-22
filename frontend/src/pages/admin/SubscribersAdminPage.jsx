import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Mail, Users, UserX, Trash2, RefreshCw, Download } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';

function StatCard({ value, label, subtitle, icon: Icon, color = 'teal' }) {
  const colors = {
    teal:    'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400',
    blue:    'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    amber:   'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    slate:   'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  };
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{label}</p>
        {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function SubscribersAdminPage() {
  const { language } = useLanguage();
  const { addToast } = useNotification();
  const isSo = language === 'so';

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingItem, setDeletingItem] = useState(null);
  const [acting, setActing] = useState(false);

  const fetchSubscribers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/subscribers');
      if (res.success) setSubscribers(res.data || []);
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);
  useAutoRefresh(fetchSubscribers, 20000, !deletingItem);

  const handleUnsubscribe = async (item) => {
    setActing(true);
    try {
      await api.put(`/subscribers/${item.id}/unsubscribe`);
      addToast(isSo ? 'Email-ka waa la hakiyay' : 'Subscriber unsubscribed', 'success');
      fetchSubscribers(true);
    } catch (err) {
      addToast(err.message || 'Failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setActing(true);
    try {
      await api.delete(`/subscribers/${deletingItem.id}`);
      addToast(isSo ? 'Email-ka waa la tirtiray' : 'Subscriber deleted', 'success');
      setDeletingItem(null);
      fetchSubscribers(true);
    } catch (err) {
      addToast(err.message || 'Failed', 'error');
    } finally {
      setActing(false);
    }
  };

  const exportCSV = () => {
    const rows = [['Email', 'Status', 'Subscribed At']];
    subscribers.forEach(s => rows.push([s.email, s.status, new Date(s.subscribed_at).toLocaleString()]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const unsubCount = subscribers.filter(s => s.status === 'unsubscribed').length;

  const columns = [
    {
      header: isSo ? 'Cinwaanka Email' : 'Email Address',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
            {row.email[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{row.email}</span>
        </div>
      )
    },
    {
      header: isSo ? 'Xaaladda' : 'Status',
      render: (row) => (
        <Badge status={row.status === 'active' ? 'active' : 'deactivated'}>
          {row.status === 'active' ? (isSo ? 'Firfircoon' : 'Active') : (isSo ? 'La Hakiyay' : 'Unsubscribed')}
        </Badge>
      )
    },
    {
      header: isSo ? 'Taariikhda Is-qorashada' : 'Subscribed Date',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(row.subscribed_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: isSo ? 'Ficilada' : 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'active' && (
            <button
              onClick={() => handleUnsubscribe(row)}
              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              title={isSo ? 'Hakinta Is-qorashada' : 'Unsubscribe'}
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDeletingItem(row)}
            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title={isSo ? 'Tirtir' : 'Delete'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            {isSo ? 'Maamulka Is-qorashada Wararka' : 'Newsletter Subscribers'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSo
              ? 'Liiska dadka is-diiwaangeliyay si ay u helaan wararka caafimaadka'
              : 'Manage people who signed up to receive health campaign updates'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={() => fetchSubscribers(false)} size="sm">
            {isSo ? 'Cusboonee' : 'Refresh'}
          </Button>
          <Button variant="outline" icon={Download} onClick={exportCSV} size="sm">
            {isSo ? 'CSV Soo Daji' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard value={subscribers.length} label={isSo ? 'Wadarta Is-qorashada' : 'Total Subscribers'} subtitle={isSo ? 'Dhammaan dadka is-diiwaangeliyay' : 'All registered emails'} icon={Users} color="teal" />
        <StatCard value={activeCount} label={isSo ? 'Firfircoon' : 'Active'} subtitle={isSo ? 'Weli helaya wararka' : 'Currently receiving updates'} icon={Mail} color="blue" />
        <StatCard value={unsubCount} label={isSo ? 'La Hakiyay' : 'Unsubscribed'} subtitle={isSo ? 'Ka baxay liiska' : 'Opted out'} icon={UserX} color="amber" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <DataTable
          data={subscribers}
          columns={columns}
          loading={loading}
          searchKeys={['email', 'status']}
          searchPlaceholder={isSo ? 'Ku raadso email-ka...' : 'Search by email...'}
          emptyIcon={Mail}
          emptyTitle={isSo ? 'Wali Ma Jiraan Is-qorasho' : 'No Subscribers Yet'}
          emptyDescription={isSo
            ? 'Dadka is-diiwaangeliya "Stay Updated" webpage-ka halkan ayay ka soo muuqanayaan'
            : 'People who subscribe via the "Stay Updated" form on the homepage will appear here'}
        />
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title={isSo ? 'Xaqiiji Tirtirka' : 'Confirm Delete'}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
          {isSo
            ? `Ma hubtaa inaad tirtirayso ${deletingItem?.email}?`
            : `Are you sure you want to permanently delete ${deletingItem?.email}?`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeletingItem(null)}>
            {isSo ? 'Ka noqo' : 'Cancel'}
          </Button>
          <Button variant="danger" loading={acting} onClick={handleDelete}>
            {isSo ? 'Tirtir' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
