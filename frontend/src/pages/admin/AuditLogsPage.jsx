import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import {
  ScrollText,
  Shield,
  User,
  Clock,
  Search,
  Filter,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Key,
  Activity,
  Layers,
  Laptop,
  Globe,
  X,
  FileText
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import api from '../../services/api';

export default function AuditLogsPage() {
  const { t, isSomali } = useLanguage();
  const { isSuperAdmin } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedActionType, setSelectedActionType] = useState('ALL');

  // Inspection Modal State
  const [activeLog, setActiveLog] = useState(null);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  // Clear Confirmation Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState('');

  useEffect(() => {
    fetchLogs(false);
  }, []);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/audit-logs?limit=250');
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useAutoRefresh(fetchLogs, 20000);

  // Handle Clearing All Audit Logs (Superadmin Only)
  const handleClearAllLogs = async () => {
    setClearing(true);
    try {
      const res = await api.delete('/audit-logs');
      if (res.success) {
        setLogs([]);
        setIsClearModalOpen(false);
        setClearSuccessMsg(isSomali ? 'Dhammaan Audit Logs-ka si guul leh ayaa loo tirtiray!' : 'All audit logs have been successfully purged!');
        setTimeout(() => setClearSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to clear audit logs:', err);
      alert(err.message || 'Failed to clear logs');
    } finally {
      setClearing(false);
    }
  };

  // Distinct Modules available in the loaded logs
  const availableModules = useMemo(() => {
    const set = new Set();
    logs.forEach(l => {
      if (l.module) set.add(l.module.toUpperCase());
    });
    return Array.from(set).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (selectedModule !== 'ALL' && (log.module || '').toUpperCase() !== selectedModule) {
        return false;
      }
      if (selectedActionType !== 'ALL') {
        const act = (log.action || '').toUpperCase();
        if (selectedActionType === 'LOGIN' && !act.includes('LOGIN') && !act.includes('LOGOUT')) return false;
        if (selectedActionType === 'CREATE' && !act.includes('CREATE') && !act.includes('REGISTER')) return false;
        if (selectedActionType === 'UPDATE' && !act.includes('UPDATE') && !act.includes('APPROVE') && !act.includes('ISSUE')) return false;
        if (selectedActionType === 'DELETE' && !act.includes('DELETE')) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const actorName = (log.user_name || '').toLowerCase();
        const actorEmail = (log.user_email || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const module = (log.module || '').toLowerCase();
        const entity = (log.entity_name || log.entity_type || '').toLowerCase();
        const entityId = (log.entity_id || '').toLowerCase();
        const details = (log.details || '').toLowerCase();

        return (
          actorName.includes(query) ||
          actorEmail.includes(query) ||
          action.includes(query) ||
          module.includes(query) ||
          entity.includes(query) ||
          entityId.includes(query) ||
          details.includes(query)
        );
      }
      return true;
    });
  }, [logs, selectedModule, selectedActionType, searchQuery]);

  // KPI Metrics Summary
  const stats = useMemo(() => {
    const total = logs.length;
    let authCount = 0;
    let mutationCount = 0;
    let criticalCount = 0;

    logs.forEach(l => {
      const act = (l.action || '').toUpperCase();
      if (act.includes('LOGIN') || act.includes('LOGOUT') || l.module === 'AUTH') authCount++;
      if (act.includes('CREATE') || act.includes('REGISTER') || act.includes('UPDATE') || act.includes('APPROVE')) mutationCount++;
      if (act.includes('DELETE') || act.includes('EMERGENCY')) criticalCount++;
    });

    return { total, authCount, mutationCount, criticalCount };
  }, [logs]);

  // Helper for Action Badge Styling
  const getActionBadgeVariant = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('SUSPEND') || act.includes('EMERGENCY')) return 'danger';
    if (act.includes('CREATE') || act.includes('REGISTER') || act.includes('APPROVED')) return 'success';
    if (act.includes('UPDATE') || act.includes('ISSUE')) return 'warning';
    if (act.includes('LOGIN') || act.includes('LOGOUT')) return 'info';
    return 'neutral';
  };

  // Helper for Action Icon
  const getActionIcon = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('LOGOUT')) return <Key className="w-3 h-3 mr-1" />;
    if (act.includes('CREATE') || act.includes('REGISTER')) return <CheckCircle2 className="w-3 h-3 mr-1" />;
    if (act.includes('DELETE')) return <Trash2 className="w-3 h-3 mr-1" />;
    if (act.includes('EMERGENCY')) return <AlertTriangle className="w-3 h-3 mr-1" />;
    return <Activity className="w-3 h-3 mr-1" />;
  };

  const columns = [
    {
      header: isSomali ? 'Waqtiga & Taariikhda' : 'Timestamp',
      render: (row) => {
        const dateObj = row.created_at ? new Date(row.created_at) : new Date();
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block pl-4">
              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: isSomali ? 'Qofka / Isticmaalaha' : 'Actor / User',
      render: (row) => {
        const isSystem = !row.user_name || row.user_name === 'System' || row.user_name === 'System Auto';
        return (
          <div className="text-xs max-w-[200px]">
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded-full ${isSystem ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'}`}>
                <User className="w-3 h-3" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white truncate">
                {row.user_name || (row.user_email ? row.user_email.split('@')[0] : (isSomali ? 'Nidaamka' : 'System Auto'))}
              </span>
            </div>
            
            {row.user_email && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {row.user_email}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1">
              {row.user_role && (
                <span className="inline-block px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                  {row.user_role}
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-mono">
                {row.ip_address || '127.0.0.1'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: isSomali ? 'Ficilka & Qeybta' : 'Action Performed',
      render: (row) => (
        <div className="space-y-1">
          <Badge variant={getActionBadgeVariant(row.action)} size="sm">
            <span className="flex items-center">
              {getActionIcon(row.action)}
              {row.action}
            </span>
          </Badge>
          {row.module && (
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded">
              {row.module}
            </span>
          )}
        </div>
      )
    },
    {
      header: isSomali ? 'Bartilmaameedka' : 'Entity / Target',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {row.entity_type || row.entity_name || (isSomali ? 'Nidaamka' : 'System')}
          </span>
          {row.entity_id && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate max-w-[140px]" title={row.entity_id}>
              #{row.entity_id.length > 16 ? `${row.entity_id.substring(0, 8)}...` : row.entity_id}
            </span>
          )}
        </div>
      )
    },
    {
      header: isSomali ? 'Faahfaahinta Dhacdada' : 'Details & Context',
      render: (row) => (
        <div className="text-xs max-w-sm">
          <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
            {row.details || (isSomali ? 'Howlgal nidaam oo guuleystay' : 'Executed operation')}
          </p>
          {(row.new_values || row.old_values) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-mono mt-0.5">
              <FileText className="w-2.5 h-2.5" />
              {isSomali ? 'Payload xog leh' : 'Has payload data'}
            </span>
          )}
        </div>
      )
    },
    {
      header: isSomali ? 'Faahfaahin' : 'Action',
      render: (row) => (
        <button
          onClick={() => {
            setActiveLog(row);
            setShowJsonRaw(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 transition-colors cursor-pointer"
          title={isSomali ? 'Eeg dhammaan faahfaahinta dhacdadan' : 'View full event details'}
        >
          <Eye className="w-3.5 h-3.5" />
          {isSomali ? 'Eeg' : 'View'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
              <ScrollText className="w-6 h-6" />
            </div>
            {isSomali ? 'Diiwaanka Dabagalka (Audit Trail)' : 'Security Audit Trail & Event Logs'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSomali
              ? 'Diiwaan rasmi ah oo muujinaya dhacdo kasta, gelitaanka isticmaalaha, iyo wax-ka-beddelka xogta dhabta ah ee nidaamka.'
              : 'Immutable event audit trail recording security authentications, volunteer activities, and data mutations.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(false)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isSomali ? 'Cusbooneysii' : 'Refresh'}
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
              title={isSomali ? 'Tirtir dhammaan diiwaanka Audit Trail' : 'Clear all audit logs'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isSomali ? 'Tirtir Logs-ka' : 'Clear Trail'}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {clearSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {clearSuccessMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isSomali ? 'Wadarta Logs-ka' : 'Total Events'}
            </span>
            <ScrollText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSomali ? 'Dhacdooyin diiwaangashan' : 'Tracked system events'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isSomali ? 'Gelitaanka (Auth)' : 'Auth & Logins'}
            </span>
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.authCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSomali ? 'Isku dayada gelitaanka' : 'User authentication sessions'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isSomali ? 'Abuuris & Cusbooneysiin' : 'Creates & Updates'}
            </span>
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.mutationCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSomali ? 'Xogta la beddelay' : 'Data mutations logged'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isSomali ? 'Ficillo Muhiim ah' : 'Critical / Alerts'}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.criticalCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isSomali ? 'Tirtirid & Dhacdooyin deg-deg' : 'Deletions & outbreak reports'}
          </p>
        </div>
      </div>

      {/* Toolbar: Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isSomali
                ? 'Ka raadi magac, iimayl, ficil, ID, ama faahfaahinta dhacdada...'
                : 'Search by user, email, action, entity ID, or description...'
            }
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
          >
            <option value="ALL">{isSomali ? 'Dhammaan Qeybaha (Modules)' : 'All Modules'}</option>
            {availableModules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={selectedActionType}
            onChange={(e) => setSelectedActionType(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
          >
            <option value="ALL">{isSomali ? 'Dhammaan Ficillada' : 'All Action Types'}</option>
            <option value="LOGIN">{isSomali ? 'Gelitaanka (Logins)' : 'Logins / Sessions'}</option>
            <option value="CREATE">{isSomali ? 'Abuuris (Creations)' : 'Creations'}</option>
            <option value="UPDATE">{isSomali ? 'Wax-ka-beddel (Updates)' : 'Updates'}</option>
            <option value="DELETE">{isSomali ? 'Tirtirid (Deletions)' : 'Deletions'}</option>
          </select>

          {(selectedModule !== 'ALL' || selectedActionType !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedModule('ALL');
                setSelectedActionType('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              {isSomali ? 'Dib u celi' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        emptyMessage={
          isSomali
            ? 'Wax audit log ah lama helin oo waafaqsan shuruudahaaga baadhitaanka.'
            : 'No audit logs found matching your criteria.'
        }
      />

      {/* Detail Inspection Modal */}
      <Modal
        isOpen={!!activeLog}
        onClose={() => setActiveLog(null)}
        title={
          <div className="flex items-center gap-2">
            <Badge variant={getActionBadgeVariant(activeLog?.action)}>
              {activeLog?.action}
            </Badge>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {isSomali ? 'Faahfaahinta Dhacdada' : 'Event Audit Inspection'}
            </span>
          </div>
        }
        subtitle={
          activeLog?.created_at
            ? `${isSomali ? 'Waqtiga' : 'Recorded at'}: ${new Date(activeLog.created_at).toLocaleString()}`
            : ''
        }
        size="lg"
      >
        {activeLog && (
          <div className="space-y-4 text-xs">
            {/* Summary Banner */}
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40">
              <span className="text-[11px] font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider block">
                {isSomali ? 'Sharaxaadda Guud' : 'Event Summary'}
              </span>
              <p className="text-sm font-medium text-teal-950 dark:text-teal-100 mt-1">
                {activeLog.details}
              </p>
            </div>

            {/* Grid of details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Actor Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {isSomali ? 'Qofka Ficilka Sameeyay (Actor)' : 'Actor Identity'}
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Magaca' : 'Full Name'}:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{activeLog.user_name || 'System'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Iimaylka' : 'Email'}:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{activeLog.user_email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Doorka' : 'System Role'}:</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-400">{activeLog.user_role || 'System Service'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{isSomali ? 'IP Address' : 'Client IP'}:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{activeLog.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>
              </div>

              {/* Target Entity Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {isSomali ? 'Shayga & Qeybta (Target & Module)' : 'Entity Target'}
                </span>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Qeybta' : 'Module'}:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{activeLog.module || 'SYSTEM'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Nooca Shayga' : 'Entity Type'}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeLog.entity_type || activeLog.entity_name || 'System'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">{isSomali ? 'Aqoonsiga (ID)' : 'Entity ID'}:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{activeLog.entity_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">{isSomali ? 'Aqoonsiga Log-ka' : 'Log ID'}:</span>
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">{activeLog.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Agent Device Info */}
            {activeLog.user_agent && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" />
                  {isSomali ? 'Aaladda & Browser-ka (User Agent)' : 'Browser & Client Environment'}
                </span>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">
                  {activeLog.user_agent}
                </p>
              </div>
            )}

            {/* Changed Payload Data (new_values) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isSomali ? 'Xogta Isbeddelka (Payload / Changes)' : 'State & Mutation Payload'}
                </span>
                {(activeLog.new_values || activeLog.old_values) && (
                  <button
                    onClick={() => setShowJsonRaw(!showJsonRaw)}
                    className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {showJsonRaw ? (isSomali ? 'Muuji Qaabka Fudud' : 'Show Simple View') : (isSomali ? 'Muuji Raw JSON' : 'Show Raw JSON')}
                  </button>
                )}
              </div>

              {activeLog.new_values || activeLog.old_values ? (
                showJsonRaw ? (
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-56">
                    {JSON.stringify(
                      {
                        new_values: activeLog.new_values,
                        old_values: activeLog.old_values
                      },
                      null,
                      2
                    )}
                  </pre>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {activeLog.new_values && typeof activeLog.new_values === 'object' && (
                      Object.entries(activeLog.new_values)
                        .filter(([k]) => !['password', 'password_hash', 'token'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">{k}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs break-all">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                )
              ) : (
                <p className="text-slate-400 italic text-[11px] py-1">
                  {isSomali
                    ? 'Dhacdadani ma lahayn xog-beddel gaar ah (tusaale ahaan: gelitaan ammaan ah ama fariin nidaam).'
                    : 'No state modification payload associated with this event (e.g. security login session).'}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal to Clear All Audit Logs */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => !clearing && setIsClearModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span>{isSomali ? 'Tirtir Dhammaan Audit Logs-ka' : 'Purge All Audit Logs'}</span>
          </div>
        }
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsClearModalOpen(false)}
              disabled={clearing}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {isSomali ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              onClick={handleClearAllLogs}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
            >
              {clearing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {isSomali ? 'Haa, Tirtir Dhammaan' : 'Yes, Purge All Logs'}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            {isSomali
              ? 'Ma hubtaa inaad tirtirto dhammaan diiwaanka Audit Trail-ka ee database-ka?'
              : 'Are you sure you want to permanently delete all audit trail entries?'}
          </p>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
            <p className="font-bold">
              {isSomali ? 'Digniin Amni:' : 'Security Warning:'}
            </p>
            <p className="mt-1 text-[11px]">
              {isSomali
                ? 'Tallaabadan dib looma noqon karo. Waxaa gebi ahaanba la tirtiri doonaa dhammaan 180+ dhacdo ee hore u dhacay, diiwaankuna wuxuu noqon doonaa mid eber ah oo bilow cusub ah.'
                : 'This action cannot be undone. All recorded security events, user logins, and data modification history will be permanently deleted from the database.'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
