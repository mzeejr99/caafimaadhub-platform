import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ScrollText, Shield, User, Clock } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import api from '../../services/api';

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: t('audit.timestamp'),
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {row.created_at ? new Date(row.created_at).toLocaleString() : t('audit.just_now')}
        </span>
      )
    },
    {
      header: t('audit.actor'),
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <User className="w-3 h-3 text-teal-700 dark:text-teal-400" /> {row.user_name || t('audit.system_auto')}
          </span>
          <p className="text-slate-400 dark:text-slate-500">{row.ip_address || '127.0.0.1'}</p>
        </div>
      )
    },
    {
      header: t('audit.action'),
      render: (row) => (
        <Badge variant={row.action?.includes('CREATE') ? 'success' : row.action?.includes('DELETE') ? 'danger' : 'info'}>
          {row.action}
        </Badge>
      )
    },
    {
      header: t('audit.entity'),
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-white">
          {row.entity_type} {row.entity_id ? `(#${row.entity_id})` : ''}
        </span>
      )
    },
    {
      header: t('audit.details'),
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-1">
          {row.details || t('audit.executed')}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ScrollText className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.audit_logs')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable audit trail recording security events, data modifications, and administrative decisions
        </p>
      </div>

      <DataTable columns={columns} data={logs} loading={loading} />
    </div>
  );
}
