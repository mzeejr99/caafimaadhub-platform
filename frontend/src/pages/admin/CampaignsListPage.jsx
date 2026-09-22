import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Megaphone, Plus, Calendar, MapPin, AlertCircle, Edit, Trash2, Activity, PlayCircle, ClipboardCheck } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { validateNumberOnly, validateFutureOrTodayDate, getTodayDateString } from '../../utils/validation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';


export default function CampaignsListPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: '',
    description: '',
    objective: '',
    start_date: '',
    end_date: '',
    target_region: '',
    target_beneficiaries: '',
    budget: '',
    status: ''
  });

  const campaignTypes = [
    { value: 'VACCINATION', label: language === 'so' ? 'Tallaal (Vaccination)' : 'Vaccination' },
    { value: 'MATERNAL_HEALTH', label: language === 'so' ? 'Caafimaadka Hooyada & Ilmaha (MCH)' : 'Maternal Health (MCH)' },
    { value: 'DISEASE_SURVEILLANCE', label: language === 'so' ? 'La socodka Cudurrada' : 'Disease Surveillance' },
    { value: 'NUTRITION', label: language === 'so' ? 'Baaritaanka Nafaqada (MUAC)' : 'Nutrition Screening (MUAC)' },
    { value: 'WASH', label: language === 'so' ? 'WASH & Biyaha/Nadaafadda' : 'WASH & Sanitation' },
    { value: 'HEALTH_EDUCATION', label: language === 'so' ? 'Wacyigelinta Caafimaadka' : 'Health Education' },
    { value: 'EMERGENCY_RESPONSE', label: language === 'so' ? 'Gurmadka Deg-degga ah' : 'Emergency Response' }
  ];

  const regions = [
    'Banadir', 'Hiran', 'Bari', 'Woqooyi Galbeed', 'Lower Juba', 'Bay', 'Galguduud',
    'Mudug', 'Nugaal', 'Sool', 'Togdheer', 'Sanaag', 'Middle Juba', 'Lower Shabelle',
    'Middle Shabelle', 'Bakool', 'Gedo', 'Awdal'
  ];

  const statuses = [
    { value: 'PLANNED', label: language === 'so' ? 'La Qorsheeyay (Planned)' : 'Planned' },
    { value: 'ACTIVE', label: language === 'so' ? 'Shaqeynaya (Active)' : 'Active' },
    { value: 'PAUSED', label: language === 'so' ? 'Hakad Kujira (Paused)' : 'Paused' },
    { value: 'COMPLETED', label: language === 'so' ? 'Waa La Dhameeyay (Completed)' : 'Completed' },
    { value: 'CANCELLED', label: language === 'so' ? 'La Joojiyay (Cancelled)' : 'Cancelled' }
  ];

  const fetchCampaigns = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/campaigns', {
        type: typeFilter || undefined,
        search: search || undefined
      });
      if (res && res.success) {
        setCampaigns(res.data || []);
      }
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Silent auto refresh every 15 seconds
  useAutoRefresh(fetchCampaigns, 15000, !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen);


  // CREATE Campaign
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!form.name || !form.name.trim()) {
      setModalError(language === 'so' ? 'Magaca ololaha waa qasab' : 'Campaign title is required');
      return;
    }

    if (!form.start_date) {
      setModalError(language === 'so' ? 'Taariikhda bilaabashada waa qasab' : 'Start date is required');
      return;
    }

    const startCheck = validateFutureOrTodayDate(form.start_date, language === 'so' ? 'Taariikhda bilaabashada (Start Date)' : 'Start Date', language);
    if (!startCheck.isValid) {
      setModalError(startCheck.message);
      return;
    }

    if (!form.end_date) {
      setModalError(language === 'so' ? 'Taariikhda dhammaadka waa qasab' : 'End date is required');
      return;
    }

    const endCheck = validateFutureOrTodayDate(form.end_date, language === 'so' ? 'Taariikhda dhammaadka (End Date)' : 'End Date', language, false, form.start_date);
    if (!endCheck.isValid) {
      setModalError(endCheck.message);
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code ? form.code.trim() : `CAMP-${Date.now().toString().slice(-4)}`,
        type: form.type || 'VACCINATION',
        description: form.description ? form.description.trim() : '',
        objective: form.objective ? form.objective.trim() : '',
        start_date: form.start_date,
        end_date: form.end_date,
        target_region: form.target_region || 'Banadir',
        target_beneficiaries: form.target_beneficiaries ? parseInt(form.target_beneficiaries, 10) : 0,
        budget: form.budget ? parseFloat(form.budget) : 0,
        status: form.status || 'PLANNED'
      };
      await api.post('/campaigns', payload);
      addToast(language === 'so' ? 'Ololaha si guul leh ayaa loo abuuray' : 'Campaign created successfully', 'success');
      setIsAddModalOpen(false);
      fetchCampaigns();
      setForm({
        name: '', code: '', type: '', description: '', objective: '',
        start_date: '', end_date: '', target_region: '',
        target_beneficiaries: '', budget: '', status: ''
      });
      setSubmitted(false);
    } catch (err) {
      setModalError(err.message || (language === 'so' ? 'Abuuridda ololuhu way fashilantay' : 'Failed to create campaign'));
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT Campaign
  const openEditModal = (camp, e) => {
    e.stopPropagation();
    setSelectedCampaign(camp);
    setForm({
      name: camp.name || '',
      code: camp.code || '',
      type: camp.type || 'VACCINATION',
      description: camp.description || '',
      objective: camp.objective || '',
      start_date: camp.start_date ? String(camp.start_date).split('T')[0].split(' ')[0] : '',
      end_date: camp.end_date ? String(camp.end_date).split('T')[0].split(' ')[0] : '',
      target_region: camp.target_region || camp.region_name || 'Banadir',
      target_beneficiaries: camp.target_population || camp.target_beneficiaries || '',
      budget: camp.target_budget || camp.budget || '',
      status: camp.status || 'PLANNED'
    });
    setModalError('');
    setSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!form.name || !form.name.trim()) {
      setModalError(language === 'so' ? 'Magaca ololaha waa qasab' : 'Campaign title is required');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description,
        objective: form.objective,
        startDate: form.start_date,
        endDate: form.end_date,
        targetRegion: form.target_region,
        targetPopulation: form.target_beneficiaries ? parseInt(form.target_beneficiaries, 10) : 0,
        targetBudget: form.budget ? parseFloat(form.budget) : 0,
        status: form.status
      };
      await api.put(`/campaigns/${selectedCampaign.id}`, payload);
      addToast(language === 'so' ? 'Ololaha si guul leh ayaa loo cusboonaysiiyay' : 'Campaign updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      setModalError(err.message || (language === 'so' ? 'Cusboonaysiintu way fashilantay' : 'Failed to update campaign'));
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE Campaign
  const openDeleteModal = (camp, e) => {
    e.stopPropagation();
    setSelectedCampaign(camp);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    setFormLoading(true);
    try {
      await api.delete(`/campaigns/${selectedCampaign.id}`);
      addToast(
        language === 'so'
          ? `Ololaha "${selectedCampaign.name}" si guul leh ayaa loo tirtiray`
          : `Campaign "${selectedCampaign.name}" deleted successfully`,
        'success'
      );
      setIsDeleteModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      addToast(err.message || (language === 'so' ? 'Tirtiriddu way fashilantay' : 'Failed to delete campaign'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Koodhka' : 'Code',
      accessor: 'code',
      render: (row) => <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">{row.code}</span>
    },
    {
      header: language === 'so' ? 'Magaca Ololaha' : 'Campaign Name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{row.objective || row.description}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Nooca' : 'Type',
      render: (row) => {
        const typeObj = campaignTypes.find(t => t.value === row.type);
        return <Badge variant="info">{typeObj ? typeObj.label : row.type}</Badge>;
      }
    },
    {
      header: language === 'so' ? 'Gobolka' : 'Region',
      render: (row) => (
        <span className="text-xs flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {row.target_region || row.region_name || (language === 'so' ? 'Qaran' : 'National')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Jadwalka' : 'Schedule',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          {row.start_date ? String(row.start_date).split('T')[0] : ''} {language === 'so' ? 'ilaa' : 'to'} {row.end_date ? String(row.end_date).split('T')[0] : ''}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => {
        const statText = language === 'so'
          ? (row.status === 'ACTIVE' ? 'Shaqeynaya' : (row.status === 'PLANNED' ? 'La Qorsheeyay' : (row.status === 'COMPLETED' ? 'Dhameystiran' : (row.status === 'PAUSED' ? 'Hakad Kujira' : row.status))))
          : row.status;
        return <Badge status={row.status}>{statText}</Badge>;
      }
    },
    {
      header: language === 'so' ? 'Ficillo' : 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={(e) => openEditModal(row, e)} icon={Edit}>
            {language === 'so' ? 'Wax Ka Beddel' : 'Edit'}
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
            <Megaphone className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            <span>{language === 'so' ? 'Ololayaasha Caafimaadka' : 'Health Campaigns'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so' ? 'Maamul, qorshee, oo la soco ololayaasha caafimaadka bulshada' : 'Manage, plan, and monitor public health campaigns'}
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              name: '', code: '', type: '', description: '', objective: '',
              start_date: '', end_date: '', target_region: '',
              target_beneficiaries: '', budget: '', status: ''
            });
            setModalError('');
            setSubmitted(false);
            setIsAddModalOpen(true);
          }}
          icon={Plus}
        >
          {language === 'so' ? '+ Abuur Olole Cusub' : '+ Create New Campaign'}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={campaigns.length}
          label={language === 'so' ? 'Wadarta Ololayaasha' : 'Total Campaigns'}
          icon={Megaphone}
          color="teal"
          subtitle={language === 'so' ? 'Dhammaan diiwaannada ololaha' : 'All campaign records'}
        />
        <StatCard
          value={campaigns.filter(c => c.status === 'ACTIVE').length}
          label={language === 'so' ? 'Ololayaal Firfircoon' : 'Active Campaigns'}
          icon={Activity}
          color="emerald"
          subtitle={language === 'so' ? 'Kuwa hadda socda' : 'Currently running'}
        />
        <StatCard
          value={campaigns.filter(c => c.status === 'PLANNED').length}
          label={language === 'so' ? 'La Qorsheeyay' : 'Planned'}
          icon={Calendar}
          color="blue"
          subtitle={language === 'so' ? 'Ololayaasha soo socda' : 'Upcoming campaigns'}
        />
        <StatCard
          value={campaigns.filter(c => c.status === 'COMPLETED').length}
          label={language === 'so' ? 'La Dhameeyay' : 'Completed'}
          icon={ClipboardCheck}
          color="slate"
          subtitle={language === 'so' ? 'Ololayaashii dhamaaday' : 'Finished campaigns'}
        />
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder={language === 'so' ? 'Raadi ololayaal...' : 'Search campaigns...'}
        filterComponent={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="" className="dark:bg-slate-800">
              {language === 'so' ? 'Dhammaan Noocyada Ololaha' : 'All Campaign Types'}
            </option>
            {campaignTypes.map((t) => (
              <option key={t.value} value={t.value} className="dark:bg-slate-800">{t.label}</option>
            ))}
          </select>
        }
        onRowClick={(row) => navigate(`/admin/campaigns/${row.id}`)}
        actions={
          <Button size="sm" variant="outline" onClick={fetchCampaigns}>
            {language === 'so' ? 'Raadi...' : 'Search...'}
          </Button>
        }
      />

      {/* CREATE CAMPAIGN MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={language === 'so' ? 'Samee Olole Caafimaad oo Cusub' : 'Create New Health Campaign'}
        size="lg"
      >
        <form noValidate onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={language === 'so' ? 'Magaca Ololaha *' : 'Campaign Title *'}
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={language === 'so' ? 'tusaale: Tallaalka Polio Qaranka 2026' : 'e.g. National Polio Days 2026'}
                required
                submitted={submitted}
              />
            </div>
            <Input
              label={language === 'so' ? 'Koodhka (Code)' : 'Campaign Code'}
              name="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder={language === 'so' ? 'tusaale: POLIO-2026' : 'e.g. POLIO-2026'}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Nooca Ololaha' : 'Campaign Type'}
              name="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={campaignTypes}
              submitted={submitted}
            />
            <Select
              label={language === 'so' ? 'Gobolka Bartilmaameedka' : 'Target Region'}
              name="target_region"
              value={form.target_region}
              onChange={(e) => setForm({ ...form, target_region: e.target.value })}
              options={regions.map(r => ({ value: r, label: r }))}
              placeholder={language === 'so' ? '-- Dooro Gobolka --' : '-- Select Region --'}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'so' ? 'Taariikhda Bilowga *' : 'Start Date *'}
              name="start_date"
              type="date"
              min={getTodayDateString()}
              validationType="future-date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
              submitted={submitted}
            />
            <Input
              label={language === 'so' ? 'Taariikhda Dhammaadka *' : 'End Date *'}
              name="end_date"
              type="date"
              min={form.start_date || getTodayDateString()}
              validationType="future-date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'so' ? 'Dadka La Hiigsanayo' : 'Target Beneficiaries'}
              name="target_beneficiaries"
              type="number"
              value={form.target_beneficiaries}
              onChange={(e) => setForm({ ...form, target_beneficiaries: e.target.value })}
              placeholder="e.g. 50000"
              submitted={submitted}
            />
            <Input
              label={language === 'so' ? 'Miisaaniyadda (USD)' : 'Budget (USD)'}
              name="budget"
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="e.g. 15000"
              submitted={submitted}
            />
          </div>

          <Textarea
            label={language === 'so' ? 'Ujeedada & Sharaxaadda' : 'Objectives & Description'}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={language === 'so' ? 'Ujeeddooyinka, da\'da bartilmaameedka, iyo faahfaahinta howlgalka...' : 'Objectives, target age groups, and operational details...'}
            rows={3}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              {language === 'so' ? 'Ka Noqo' : 'Cancel'}
            </Button>
            <Button type="submit" loading={formLoading}>
              {language === 'so' ? 'Kaydi Ololaha' : 'Save Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT CAMPAIGN MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'so' ? `Wax Ka Beddel Ololaha: ${selectedCampaign?.name}` : `Edit Campaign: ${selectedCampaign?.name}`}
        size="lg"
      >
        <form noValidate onSubmit={handleUpdate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={language === 'so' ? 'Magaca Ololaha *' : 'Campaign Title *'}
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                submitted={submitted}
              />
            </div>
            <Select
              label={language === 'so' ? 'Xaaladda' : 'Status'}
              name="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={statuses}
              required
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Nooca Ololaha' : 'Campaign Type'}
              name="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={campaignTypes}
              submitted={submitted}
            />
            <Select
              label={language === 'so' ? 'Gobolka' : 'Region'}
              name="target_region"
              value={form.target_region}
              onChange={(e) => setForm({ ...form, target_region: e.target.value })}
              options={regions.map(r => ({ value: r, label: r }))}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'so' ? 'Taariikhda Bilowga' : 'Start Date'}
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              submitted={submitted}
            />
            <Input
              label={language === 'so' ? 'Taariikhda Dhammaadka' : 'End Date'}
              name="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              submitted={submitted}
            />
          </div>

          <Textarea
            label={language === 'so' ? 'Sharaxaadda' : 'Description'}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {language === 'so' ? 'Ka Noqo' : 'Cancel'}
            </Button>
            <Button type="submit" loading={formLoading}>
              {language === 'so' ? 'Kaydi Isbeddelka' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CAMPAIGN MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={language === 'so' ? 'Xaqiiji Tirtiridda Ololaha' : 'Confirm Campaign Deletion'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'so' ? 'Ma hubtaa inaad si joogto ah u tirtirto ololaha' : 'Are you sure you want to permanently delete campaign'}{' '}
            <strong className="text-slate-900 dark:text-white">{selectedCampaign?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              {language === 'so' ? 'Ka Noqo' : 'Cancel'}
            </Button>
            <Button variant="danger" loading={formLoading} onClick={handleDelete}>
              {language === 'so' ? 'Si joogto ah u tirtir' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
