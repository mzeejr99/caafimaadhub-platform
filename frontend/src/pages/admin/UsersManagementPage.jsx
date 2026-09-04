import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  Users, Plus, Shield, UserCheck, UserX, AlertCircle,
  Mail, Phone, Lock, User, Edit3, Trash2, KeyRound,
  ShieldCheck, Info, Sparkles, Filter, CheckCircle2,
  Building2, MapPin, Search, Eye, Clock, Check, RefreshCw, X
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import FormModal from '../../components/common/FormModal';
import UserFormModal from '../../components/common/UserFormModal';
import api from '../../services/api';

export default function UsersManagementPage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const { t, language } = useLanguage();
  const { addToast } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', {
        search: search || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      if (res.success || Array.isArray(res.data) || Array.isArray(res)) {
        const list = res.data || res.users || (Array.isArray(res) ? res : []);
        setUsers(list);
      }
    } catch (err) {
      console.error('[UsersManagementPage] Fetch error:', err);
      addToast(language === 'so' ? 'Khalad baa ku yimid soo dejinta isticmaalayaasha' : 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Open User Modal in various modes
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsUserModalOpen(true);
  };

  const handleOpenEdit = (user, e) => {
    if (e) e.stopPropagation();
    setSelectedUser(user);
    setModalMode('edit');
    setIsUserModalOpen(true);
  };

  const handleOpenView = (user) => {
    setSelectedUser(user);
    setModalMode('view');
    setIsUserModalOpen(true);
  };

  const handleOpenDelete = (user, e) => {
    if (e) e.stopPropagation();
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Quick Approval / Status Update
  const handleQuickStatusChange = async (userId, newStatus, e) => {
    if (e) e.stopPropagation();
    setActionLoadingId(userId);
    try {
      const res = await api.patch(`/users/${userId}/status`, { status: newStatus });
      if (res.success || res.data) {
        addToast(
          newStatus === 'active'
            ? (language === 'so' ? 'Akoonka si guul leh ayaa loo ansixiyay!' : 'Account approved successfully!')
            : (language === 'so' ? 'Xaaladda akoonka waa la beddelay.' : 'Account status updated.'),
          'success'
        );
        fetchUsers();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update user status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete User Confirm
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      const res = await api.delete(`/users/${selectedUser.id}`);
      if (res.success || res.message) {
        addToast(language === 'so' ? 'Isticmaalaha si guul leh ayaa loo tirtiray' : 'User deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Role pill badge styling with active language translation
  const renderRoleBadge = (roleName) => {
    const role = (roleName || '').toUpperCase();
    if (role === 'SUPER_ADMIN' || role === 'SUPERADMIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{language === 'so' ? 'Maamulka Sare' : 'Superadmin'}</span>
        </span>
      );
    }
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/80 shadow-xs">
          <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{language === 'so' ? 'Maamule' : 'Admin'}</span>
        </span>
      );
    }
    if (role === 'DATA_ANALYST' || role === 'DATAANALYST' || role === 'ANALYST') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80 shadow-xs">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{language === 'so' ? 'Falanqeeye Xogta' : 'Data Analyst'}</span>
        </span>
      );
    }
    if (role === 'VOLUNTEER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 shadow-xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'so' ? 'Hawl-wadeen (CHV)' : 'Volunteer (CHV)'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-xs">
        <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        <span>{language === 'so' ? 'Bulshada' : 'Public User'}</span>
      </span>
    );
  };

  // Status pill badge styling with active language translation
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'so' ? 'Shaqeynaya' : 'Active'}</span>
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600/60">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>{language === 'so' ? 'Sugaya Ansixin' : 'Pending Approval'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60">
        <UserX className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        <span>{language === 'so' ? 'La Hakiyay' : 'Deactivated'}</span>
      </span>
    );
  };

  // Stats Counters
  const totalCount = users.length;
  const pendingCount = users.filter(u => (u.status || '').toLowerCase() === 'pending').length;
  const volunteerCount = users.filter(u => (u.role || '').toUpperCase() === 'VOLUNTEER').length;
  const publicCount = users.filter(u => (u.role || '').toUpperCase() === 'PUBLIC' || (u.role || '').toUpperCase() === 'PUBLIC_USER').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1E293B]/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 backdrop-blur-md shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{language === 'so' ? 'Maamulka Isticmaalayaasha' : 'User Management'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30">
                5 Roles
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'so'
                ? 'Maamul Superadmin, Admin, Data Analyst, Volunteers (CHVs), iyo Public Users.'
                : 'Manage system staff, approvals, field volunteers, and public user accounts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#0D9488] to-[#10B981] hover:from-teal-600 hover:to-emerald-500 text-white shadow-lg shadow-teal-700/20 dark:shadow-teal-900/40 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'so' ? 'Kudar Isticmaale' : 'Register User'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-xs dark:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'so' ? 'Wadarta Akoonnada' : 'Total Accounts'}
            </span>
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">{totalCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'so' ? 'Dhammaan isticmaalayaasha nidaamka' : 'All registered platform users'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-xs dark:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {language === 'so' ? 'Sugaya Ansixin' : 'Pending Approvals'}
            </span>
            <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'so' ? 'Codsiyada hawl-wadeennada' : 'Volunteer signup requests'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-xs dark:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {language === 'so' ? 'CHVs Firfircoon' : 'Active CHVs'}
            </span>
            <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300 mt-2">{volunteerCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'so' ? 'Hawl-wadeennada caafimaadka goobta' : 'Frontline health volunteers'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-xs dark:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              {language === 'so' ? 'Dadweynaha' : 'Public Citizens'}
            </span>
            <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-2">{publicCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {language === 'so' ? 'Akoonnada xubnaha bulshada' : 'Community portal accounts'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-sm shadow-xs dark:shadow-lg space-y-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-700/60 scrollbar-none">
          {[
            { key: 'ALL', label: language === 'so' ? 'Dhammaan (All)' : 'All Roles' },
            { key: 'Superadmin', label: language === 'so' ? 'Maamulka Sare' : 'Superadmin' },
            { key: 'Admin', label: language === 'so' ? 'Maamule' : 'Admin' },
            { key: 'DataAnalyst', label: language === 'so' ? 'Falanqeeye Xogta' : 'Data Analyst' },
            { key: 'Volunteer', label: language === 'so' ? 'Hawl-wadeen (CHV)' : 'Volunteer (CHV)' },
            { key: 'Public', label: language === 'so' ? 'Bulshada' : 'Public User' }
          ].map(tab => {
            const isActive = roleFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 overflow-hidden shadow-2xs focus-within:border-teal-500">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'so' ? 'Ku raadso magac, email, telefoon, ama degmo...' : 'Search by name, email, phone, district...'}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 py-2.5 pr-3 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchUsers(); }}
                className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="w-full sm:w-60">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-xs sm:text-sm text-slate-800 dark:text-slate-200 px-3 py-2.5 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">{language === 'so' ? 'Dhammaan Xaaladaha (All Status)' : 'All Statuses'}</option>
              <option value="pending">{language === 'so' ? 'Sugaya Ansixin (Pending Approval)' : 'Pending Approval'}</option>
              <option value="active">{language === 'so' ? 'Shaqeynaya (Active)' : 'Active'}</option>
              <option value="deactivated">{language === 'so' ? 'La Hakiyay (Deactivated)' : 'Deactivated'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1E293B]/70 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden shadow-sm dark:shadow-2xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4 sm:px-6">{language === 'so' ? 'Isticmaalaha / Xiriirka' : 'User / Contact'}</th>
                <th className="py-3.5 px-4">{language === 'so' ? 'Doorka' : 'Role'}</th>
                <th className="py-3.5 px-4">{language === 'so' ? 'Goobta' : 'Location'}</th>
                <th className="py-3.5 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{language === 'so' ? 'Tallaabooyinka' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs uppercase font-bold tracking-wider">{language === 'so' ? 'Soo dejinaya xogta...' : 'Loading users...'}</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Users className="w-12 h-12 stroke-[1.5] mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{language === 'so' ? 'Lama helin isticmaaleyaal' : 'No users found'}</p>
                    <p className="text-xs text-slate-400 mt-1">{language === 'so' ? 'Isku day inaad beddesho shaandhada ama raadinta' : 'Try adjusting your search or filters'}</p>
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isPending = (u.status || '').toLowerCase() === 'pending';
                  const isActing = actionLoadingId === u.id;
                  const canEdit = isSuperAdmin || (u.role === 'Volunteer' || u.role === 'Public' || u.role === 'VOLUNTEER' || u.role === 'PUBLIC_USER');

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenView(u)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {u.avatar_url || u.profile_image_url ? (
                            <img
                              src={u.avatar_url || u.profile_image_url}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                              }}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs ring-1 ring-teal-500/20"
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center text-teal-600 dark:text-teal-400 font-bold shrink-0 shadow-2xs group-hover:border-teal-500/50 transition-colors ${u.avatar_url || u.profile_image_url ? 'hidden' : 'flex'}`}>
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                              {u.full_name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="truncate">{u.email}</span>
                              {u.phone && <span>• {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(u.role)}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>{u.region || 'Banadir'} {u.district ? `(${u.district})` : ''}</span>
                        </div>
                        {u.village_neighbourhood && (
                          <p className="text-[11px] text-slate-400 ml-5">{u.village_neighbourhood}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(u.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approve / Reject for Pending Volunteers */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={(e) => handleQuickStatusChange(u.id, 'active', e)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-300 dark:border-emerald-700/80 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Approve volunteer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">{language === 'so' ? 'Ansixi' : 'Approve'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={(e) => handleQuickStatusChange(u.id, 'deactivated', e)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-300 text-[11px] font-bold uppercase tracking-wider border border-rose-300 dark:border-rose-700/80 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Reject registration"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">{language === 'so' ? 'Diid' : 'Reject'}</span>
                              </button>
                            </>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => handleOpenView(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Profile Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit user */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenEdit(u, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete user */}
                          {canEdit && u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenDelete(u, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create / Edit / View Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        mode={modalMode}
        userData={selectedUser}
        onSuccess={() => {
          fetchUsers();
          addToast(
            modalMode === 'create'
              ? (language === 'so' ? 'Isticmaalaha si guul leh ayaa loo diiwaangeliyay' : 'User registered successfully')
              : (language === 'so' ? 'Isbeddelka si guul leh ayaa loo kaydiyay' : 'Changes saved successfully'),
            'success'
          );
        }}
      />

      {/* Delete User Confirmation Modal */}
      <FormModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title={language === 'so' ? 'Hubi Tirtirista Isticmaalaha' : 'Confirm User Deletion'}
        subtitle={selectedUser?.email}
        icon={Trash2}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs">
            <p className="font-bold">
              {language === 'so'
                ? `Ma hubtaa inaad tirtirto isticmaalaha "${selectedUser?.full_name}"?`
                : `Are you sure you want to permanently delete "${selectedUser?.full_name}"?`}
            </p>
            <p className="mt-1 text-rose-600 dark:text-rose-400/80">
              {language === 'so'
                ? 'Tallaabadan dib looma noqon karo. Dhammaan xogta akoonka waa la tirtiri doonaa.'
                : 'This action cannot be undone and will permanently remove user access.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#334155] dark:text-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={handleConfirmDelete}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleteLoading ? (language === 'so' ? 'Tirtiraya...' : 'Deleting...') : (language === 'so' ? 'Haa, Tirtir' : 'Yes, Delete')}
            </button>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
