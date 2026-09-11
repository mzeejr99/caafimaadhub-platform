import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Users, UserPlus, Trash2, Edit, CheckCircle2, XCircle, AlertCircle, Phone, Mail, MapPin, UserCheck, Clock, UserX } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { validateTextOnly, validateEmail, validatePhone, validatePassword, validateAge18Plus } from '../../utils/validation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';


export default function VolunteersListPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState({
    full_name: '', email: '', phone: '', password: '', date_of_birth: '',
    gender: '', region_name: '', district_name: '', village_name: '',
    education_level: '', languages_spoken: 'Somali', motivation: '',
    emergency_contact_name: '', emergency_contact_phone: ''
  });

  const [editForm, setEditForm] = useState({
    fullName: '', phone: '', gender: '', dateOfBirth: '',
    region_name: '', district_name: '', village_name: '',
    educationLevel: '', availabilityStatus: '', status: ''
  });

  const educationLevels = [
    { value: 'PRIMARY', label: language === 'so' ? 'Dugsiga Hoose/Dhexe (Primary School)' : 'Primary School' },
    { value: 'SECONDARY', label: language === 'so' ? 'Dugsiga Sare (Secondary School)' : 'Secondary School' },
    { value: 'DIPLOMA', label: language === 'so' ? 'Diblooma (Diploma)' : 'Diploma' },
    { value: 'DEGREE', label: language === 'so' ? 'Shahaadada Koowaad (Bachelor Degree)' : 'University Degree' },
    { value: 'POSTGRADUATE', label: language === 'so' ? 'Shahaadada Sare (Postgraduate/Masters)' : 'Postgraduate' },
    { value: 'NONE', label: language === 'so' ? 'Aan Laheyn Waxbarasho Rasmi ah' : 'No Formal Education' }
  ];

  const regions = [
    'Banadir', 'Hiran', 'Bari', 'Woqooyi Galbeed', 'Lower Juba', 'Bay', 'Galguduud',
    'Mudug', 'Nugaal', 'Sool', 'Togdheer', 'Sanaag', 'Middle Juba', 'Lower Shabelle',
    'Middle Shabelle', 'Bakool', 'Gedo', 'Awdal'
  ];

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const [totalRes, approvedRes, activeRes, pendingRes, suspendedRes] = await Promise.all([
        api.get('/volunteers', { limit: 1 }),
        api.get('/volunteers', { limit: 1, status: 'APPROVED' }),
        api.get('/volunteers', { limit: 1, status: 'ACTIVE' }),
        api.get('/volunteers', { limit: 1, status: 'PENDING' }),
        api.get('/volunteers', { limit: 1, status: 'SUSPENDED' }),
      ]);
      setStats({
        total: totalRes.pagination?.total ?? totalRes.total ?? 0,
        active: (approvedRes.pagination?.total ?? approvedRes.total ?? 0) + (activeRes.pagination?.total ?? activeRes.total ?? 0),
        pending: pendingRes.pagination?.total ?? pendingRes.total ?? 0,
        suspended: suspendedRes.pagination?.total ?? suspendedRes.total ?? 0,
      });
    } catch (err) {}
  };

  const fetchVolunteers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/volunteers', {
        offset: pagination.offset,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined
      });
      if (res && res.success) {
        setVolunteers(res.data || []);
        setPagination(prev => ({ ...prev, total: res.pagination?.total ?? res.total ?? res.data?.length ?? 0 }));
      }
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [pagination.offset, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  // Silent auto refresh every 12 seconds
  useAutoRefresh(fetchVolunteers, 12000, !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen);


  const handleSearch = () => { setPagination(p => ({ ...p, offset: 0 })); fetchVolunteers(); };

  // CREATE Volunteer (SuperAdmin / Admin)
  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    const nameCheck = validateTextOnly(addForm.full_name, 'Magaca Buuxa (Full Name)', language);
    if (!nameCheck.isValid) { setModalError(nameCheck.message); return; }

    const emailCheck = validateEmail(addForm.email, language);
    if (!emailCheck.isValid) { setModalError(emailCheck.message); return; }

    const phoneCheck = validatePhone(addForm.phone, language);
    if (!phoneCheck.isValid) { setModalError(phoneCheck.message); return; }

    const pwdCheck = validatePassword(addForm.password, language);
    if (!pwdCheck.isValid) { setModalError(pwdCheck.message); return; }

    const dobCheck = validateAge18Plus(addForm.date_of_birth, language, language === 'so' ? 'Taariikhda dhalashada' : 'Date of birth');
    if (!dobCheck.isValid) { setModalError(dobCheck.message); return; }

    if (!addForm.gender) {
      setModalError(language === 'so' ? 'Fadlan dooro jinsiga' : 'Please select gender');
      return;
    }

    if (!addForm.region_name) {
      setModalError(language === 'so' ? 'Fadlan dooro gobolka' : 'Please select region');
      return;
    }

    if (!addForm.district_name.trim()) {
      setModalError(language === 'so' ? 'Fadlan geli degmada' : 'Please enter district');
      return;
    }

    if (!addForm.education_level) {
      setModalError(language === 'so' ? 'Fadlan dooro heerka waxbarashada' : 'Please select education level');
      return;
    }

    if (addForm.emergency_contact_name) {
      const contactNameCheck = validateTextOnly(addForm.emergency_contact_name, 'Magaca Qofka Deg-degga', language);
      if (!contactNameCheck.isValid) { setModalError(contactNameCheck.message); return; }
    }

    if (addForm.emergency_contact_phone) {
      const contactPhoneCheck = validatePhone(addForm.emergency_contact_phone, language);
      if (!contactPhoneCheck.isValid) { setModalError(contactPhoneCheck.message); return; }
    }

    setFormLoading(true);
    try {
      await api.post('/volunteers', addForm);
      addToast(t('vol_admin.created'), 'success');
      setIsAddModalOpen(false);
      fetchVolunteers();
      fetchStats();
      setAddForm({
        full_name: '', email: '', phone: '', password: '', date_of_birth: '',
        gender: '', region_name: '', district_name: '', village_name: '',
        education_level: '', languages_spoken: 'Somali', motivation: '',
        emergency_contact_name: '', emergency_contact_phone: ''
      });
      setSubmitted(false);
    } catch (err) {
      setModalError(err.message || t('vol_admin.create_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT Volunteer
  const openEditModal = (vol, e) => {
    e.stopPropagation();
    setSelectedVolunteer(vol);
    setEditForm({
      fullName: vol.full_name || '',
      phone: vol.phone || '',
      gender: vol.gender || 'FEMALE',
      dateOfBirth: vol.date_of_birth || '',
      region_name: vol.region_name || 'Banadir',
      district_name: vol.district_name || '',
      village_name: vol.village_name || '',
      educationLevel: vol.education_level || 'SECONDARY',
      availabilityStatus: vol.availability_status || 'AVAILABLE',
      status: vol.status || 'ACTIVE'
    });
    setModalError('');
    setSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateVolunteer = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    setFormLoading(true);
    try {
      await api.put(`/volunteers/${selectedVolunteer.id}/profile`, editForm);
      if (editForm.status !== selectedVolunteer.status) {
        await api.put(`/volunteers/${selectedVolunteer.id}/status`, { status: editForm.status });
      }
      addToast(t('vol_admin.updated'), 'success');
      setIsEditModalOpen(false);
      fetchVolunteers();
      fetchStats();
    } catch (err) {
      setModalError(err.message || t('vol_admin.update_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE Volunteer
  const openDeleteModal = (vol, e) => {
    e.stopPropagation();
    setSelectedVolunteer(vol);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteVolunteer = async () => {
    if (!selectedVolunteer) return;
    setFormLoading(true);
    try {
      await api.delete(`/volunteers/${selectedVolunteer.id}`);
      addToast(`Volunteer ${selectedVolunteer.full_name} deleted successfully`, 'success');
      setIsDeleteModalOpen(false);
      fetchVolunteers();
      fetchStats();
    } catch (err) {
      addToast(err.message || t('vol_admin.delete_failed'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/volunteers/${id}/approve`, { reviewNotes: 'Approved by Super Admin' });
      addToast(t('vol_admin.approved'), 'success');
      fetchVolunteers();
      fetchStats();
    } catch (err) { addToast(err.message, 'error'); }
  };

  const columns = [
    { header: t('vol_admin.vol_id'), accessor: 'volunteer_id', render: (row) => <span className="font-mono text-xs font-bold text-teal-700">{row.volunteer_id}</span> },
    { header: t('vol_admin.col_name'), render: (row) => (
      <div className="flex items-center gap-3">
        {row.avatar_url || row.profile_image_url ? (
          <img
            src={row.avatar_url || row.profile_image_url}
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
            }}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs ring-1 ring-teal-500/20"
          />
        ) : null}
        <div className={`w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 items-center justify-center text-teal-700 dark:text-teal-400 text-xs font-bold shrink-0 shadow-2xs ${row.avatar_url || row.profile_image_url ? 'hidden' : 'flex'}`}>
          {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'V'}
        </div>
        <div className="min-w-0">
          <span className="font-bold text-slate-900 dark:text-white block truncate">{row.full_name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.email}</p>
        </div>
      </div>
    )},
    { header: t('vol_admin.col_phone'), accessor: 'phone' },
    { header: t('common.region'), accessor: 'region_name' },
    { header: t('common.status'), render: (row) => <Badge status={row.status}>{t(`status.${row.status}`) || row.status}</Badge> },
    { header: t('common.actions'), render: (row) => (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {row.status === 'PENDING' && (
          <Button size="sm" variant="success" onClick={(e) => handleApprove(row.id, e)}>
            {t('common.approve')}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={(e) => openEditModal(row, e)} icon={Edit}>
          {t('common.edit')}
        </Button>
        <Button size="sm" variant="danger" onClick={(e) => openDeleteModal(row, e)} icon={Trash2}>
          {t('common.delete')}
        </Button>
      </div>
    )}
  ];

  const statusOptions = ['PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.volunteers')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('vol_admin.subtitle')}</p>
        </div>
        <Button onClick={() => { setModalError(''); setSubmitted(false); setIsAddModalOpen(true); }} icon={UserPlus}>
          {t('vol_admin.add')}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={stats.total} label={t('vol_admin.total')} icon={Users} color="teal" subtitle={t('vol_admin.sub_total')} />
        <StatCard value={stats.active} label={t('vol_admin.active')} icon={UserCheck} color="emerald" subtitle={t('vol_admin.sub_active')} />
        <StatCard value={stats.pending} label={t('vol_admin.pending')} icon={Clock} color="amber" subtitle={t('vol_admin.sub_pending')} />
        <StatCard value={stats.suspended} label={t('vol_admin.suspended')} icon={UserX} color="red" subtitle={t('vol_admin.sub_suspended')} />
      </div>

      <DataTable
        columns={columns}
        data={volunteers}
        loading={loading}
        searchQuery={search}
        onSearchChange={(q) => { setSearch(q); }}
        searchPlaceholder={language === 'so' ? 'Ku raadso magac ama ID...' : 'Search by name or volunteer ID...'}
        filterComponent={
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({...p, offset: 0})); }} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500">
            <option value="" className="dark:bg-slate-800">{t('common.all')} {t('common.status')}</option>
            {statusOptions.map(s => <option key={s} value={s} className="dark:bg-slate-800">{t(`status.${s}`)}</option>)}
          </select>
        }
        pagination={pagination}
        onPageChange={(offset) => setPagination(p => ({ ...p, offset }))}
        onRowClick={(row) => navigate(`/admin/volunteers/${row.id}`)}
        actions={<Button size="sm" variant="outline" onClick={handleSearch}>{t('common.search')}</Button>}
      />

      {/* ADD VOLUNTEER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('vol_admin.register_title')} size="xl">
        <form noValidate onSubmit={handleCreateVolunteer} className="space-y-6">
          {modalError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Section 1: Account & Credentials */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>{language === 'so' ? '1. Xogta Akoonka & Galitaanka' : '1. Account & Credentials'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('vol_admin.full_name')}
                name="full_name"
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                placeholder={t('vol_admin.name_ph')}
                validationType="text-only"
                required
                submitted={submitted}
              />
              <Input
                label={t('login.email')}
                name="email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder={t('vol_admin.email_ph')}
                validationType="email"
                required
                submitted={submitted}
              />
              <Input
                label={t('vol_admin.phone')}
                name="phone"
                type="tel"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                placeholder="+252 61..."
                validationType="phone"
                required
                submitted={submitted}
              />
              <Input
                label={t('login.password')}
                name="password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="••••••••"
                validationType="password"
                showPasswordRules={true}
                required
                submitted={submitted}
              />
            </div>
          </div>

          {/* Section 2: Personal & Location Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{language === 'so' ? '2. Xogta Shakhsiga & Deegaanka' : '2. Personal & Location'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('vol_admin.gender')}
                name="gender"
                value={addForm.gender}
                onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                options={[{ value: 'FEMALE', label: t('vol_admin.female') }, { value: 'MALE', label: t('vol_admin.male') }]}
                required
                submitted={submitted}
              />
              <Input
                label={`${language === 'so' ? 'Taariikhda Dhalashada' : 'Date of Birth'} (18+ Sano)`}
                name="date_of_birth"
                type="date"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                value={addForm.date_of_birth}
                onChange={(e) => setAddForm({ ...addForm, date_of_birth: e.target.value })}
                helperText={language === 'so' ? 'Waa inuu jiraa 18 sano ama ka weyn' : 'Must be 18 years or older'}
                required
                submitted={submitted}
              />
              <Select
                label={t('vol_admin.region_label')}
                name="region_name"
                value={addForm.region_name}
                onChange={(e) => setAddForm({ ...addForm, region_name: e.target.value })}
                options={regions.map(r => ({ value: r, label: r }))}
                required
                submitted={submitted}
              />
              <Input
                label={t('vol_admin.district_label')}
                name="district_name"
                value={addForm.district_name}
                onChange={(e) => setAddForm({ ...addForm, district_name: e.target.value })}
                validationType="text-only"
                placeholder={t('vol_admin.district_ph')}
                required
                submitted={submitted}
              />
              <Input
                label={language === 'so' ? 'Xaafadda / Tuulada' : 'Village / Neighbourhood'}
                name="village_name"
                value={addForm.village_name}
                onChange={(e) => setAddForm({ ...addForm, village_name: e.target.value })}
                placeholder="e.g. Taleex"
                validationType="text-only"
                submitted={submitted}
              />
              <Select
                label={language === 'so' ? 'Heerka Waxbarashada' : 'Education Level'}
                name="education_level"
                value={addForm.education_level}
                onChange={(e) => setAddForm({ ...addForm, education_level: e.target.value })}
                options={educationLevels}
                required
                submitted={submitted}
              />
              <div className="sm:col-span-2">
                <Input
                  label={language === 'so' ? 'Luqadaha aad ku hadasho' : 'Languages Spoken'}
                  name="languages_spoken"
                  value={addForm.languages_spoken}
                  onChange={(e) => setAddForm({ ...addForm, languages_spoken: e.target.value })}
                  placeholder="e.g. Somali, Arabic, English"
                  validationType="text-only"
                  submitted={submitted}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency & Motivation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{language === 'so' ? '3. Xaaladda Degdegga & Khibradda' : '3. Emergency & Motivation'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={language === 'so' ? 'Magaca Qofka Deg-degga (Emergency Contact)' : 'Emergency Contact Name'}
                name="emergency_contact_name"
                value={addForm.emergency_contact_name}
                onChange={(e) => setAddForm({ ...addForm, emergency_contact_name: e.target.value })}
                placeholder="e.g. Axmed Cali Warsame"
                validationType="text-only"
                submitted={submitted}
              />
              <Input
                label={language === 'so' ? 'Taleefanka Qofka Deg-degga' : 'Emergency Contact Phone'}
                name="emergency_contact_phone"
                type="tel"
                value={addForm.emergency_contact_phone}
                onChange={(e) => setAddForm({ ...addForm, emergency_contact_phone: e.target.value })}
                placeholder="+252 61..."
                validationType="phone"
                submitted={submitted}
              />
            </div>
            <Textarea
              label={language === 'so' ? 'Sababta & Khibradda (Motivation / Experience)' : 'Motivation & Background'}
              name="motivation"
              value={addForm.motivation}
              onChange={(e) => setAddForm({ ...addForm, motivation: e.target.value })}
              placeholder={language === 'so' ? 'Faahfaahi khibradda ama sababta aad ugu adeegayso caafimaadka bulshada...' : 'Describe why you want to serve your community...'}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('vol_admin.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT VOLUNTEER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Volunteer: ${selectedVolunteer?.full_name}`} size="lg">
        <form noValidate onSubmit={handleUpdateVolunteer} className="space-y-4">
          {modalError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('vol_admin.col_name')}
              name="fullName"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              validationType="text-only"
              required
              submitted={submitted}
            />
            <Input
              label={t('vol_admin.col_phone')}
              name="phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              validationType="phone"
              required
              submitted={submitted}
            />
            <Select
              label={t('common.status')}
              name="status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={statusOptions.map(s => ({ value: s, label: s }))}
              required
              submitted={submitted}
            />
            <Select
              label={t('vol_admin.availability')}
              name="availabilityStatus"
              value={editForm.availabilityStatus}
              onChange={(e) => setEditForm({ ...editForm, availabilityStatus: e.target.value })}
              options={[
                { value: 'AVAILABLE', label: t('vol_admin.avail') },
                { value: 'BUSY', label: t('vol_admin.busy') },
                { value: 'UNAVAILABLE', label: t('vol_admin.unavail') }
              ]}
              required
              submitted={submitted}
            />
            <div className="sm:col-span-2">
              <Select
                label={t('common.region')}
                name="region_name"
                value={editForm.region_name}
                onChange={(e) => setEditForm({ ...editForm, region_name: e.target.value })}
                options={regions.map(r => ({ value: r, label: r }))}
                required
                submitted={submitted}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('vol_admin.update')}</Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('vol_admin.confirm_delete')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('vol_admin.confirm_text')} <strong className="text-slate-900">{selectedVolunteer?.full_name}</strong> ({selectedVolunteer?.volunteer_id})?
            This will remove all associated user accounts and records from the MySQL database.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={formLoading} onClick={handleDeleteVolunteer}>{t('vol_admin.delete_permanent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
