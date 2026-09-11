import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckSquare, Plus, MapPin, Calendar, Clock, Edit, Trash2, AlertCircle, ListTodo, PlayCircle, CheckCircle, Flame } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { validateFutureOrTodayDate } from '../../utils/validation';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';


export default function TasksListPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    task_type: '',
    campaign_id: '',
    assigned_volunteer_id: '',
    priority: '',
    start_datetime: '',
    end_datetime: '',
    target_location_name: '',
    target_latitude: '',
    target_longitude: '',
    status: ''
  });

  const taskTypes = [
    { value: 'HOUSEHOLD_VISIT', label: language === 'so' ? 'Booqashada Qoyska' : 'Household Visit' },
    { value: 'VACCINATION_POST', label: language === 'so' ? 'Goobta Tallaalka' : 'Vaccination Post' },
    { value: 'COMMUNITY_MEETING', label: language === 'so' ? 'Wadahadalka Bulshada' : 'Community Dialogue' },
    { value: 'SURVEILLANCE_SWEEP', label: language === 'so' ? 'Baaritaanka La socodka' : 'Surveillance Sweep' },
    { value: 'SUPPLY_DISTRIBUTION', label: language === 'so' ? 'Qaybinta Agabka / Dawooyinka' : 'Supply Distribution' }
  ];

  const priorities = [
    { value: 'LOW', label: language === 'so' ? 'Hoose (Low)' : 'Low' },
    { value: 'MEDIUM', label: language === 'so' ? 'Dhexdhexaad (Medium)' : 'Medium' },
    { value: 'HIGH', label: language === 'so' ? 'Sare (High)' : 'High' },
    { value: 'URGENT', label: language === 'so' ? 'Deg-deg ah (Urgent)' : 'Urgent' }
  ];

  const taskStatuses = [
    { value: 'ASSIGNED', label: language === 'so' ? 'Lagula Xilsaaray (Assigned)' : 'Assigned' },
    { value: 'ACCEPTED', label: language === 'so' ? 'Waa La Aqbalay (Accepted)' : 'Accepted' },
    { value: 'IN_PROGRESS', label: language === 'so' ? 'Socda (In Progress)' : 'In Progress' },
    { value: 'SUBMITTED', label: language === 'so' ? 'Waa La Gudbiyay (Submitted)' : 'Submitted' },
    { value: 'UNDER_REVIEW', label: language === 'so' ? 'Dib-u-eegis ayaa ku socota' : 'Under Review' },
    { value: 'COMPLETED', label: language === 'so' ? 'Waa La Dhameystiray (Completed)' : 'Completed' },
    { value: 'CANCELLED', label: language === 'so' ? 'La Joojiyay (Cancelled)' : 'Cancelled' }
  ];

  useEffect(() => {
    fetchMetadata();
  }, []);


  const fetchMetadata = async () => {
    try {
      const [campRes, volRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/volunteers')
      ]);
      if (campRes.success) setCampaigns(campRes.data || []);
      if (volRes.success) setVolunteers(volRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/tasks', {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined
      });
      if (res && res.success) {
        setTasks(res.data || []);
      }
    } catch (err) {
      if (!isSilent) console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Silent auto refresh every 12 seconds
  useAutoRefresh(fetchTasks, 12000, !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen);


  // CREATE Task
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!form.title || !form.title.trim()) {
      setModalError(language === 'so' ? 'Ciwaanka hawsha waa qasab' : 'Task title is required');
      return;
    }

    if (!form.start_datetime) {
      setModalError(language === 'so' ? 'Taariikhda bilaabashada waa qasab' : 'Start date is required');
      return;
    }

    const startCheck = validateFutureOrTodayDate(form.start_datetime, 'Taariikhda bilaabashada (Start Date)', language);
    if (!startCheck.isValid) {
      setModalError(startCheck.message);
      return;
    }

    if (!form.end_datetime) {
      setModalError(language === 'so' ? 'Taariikhda kama dambaysta ah waa qasab' : 'Deadline date is required');
      return;
    }

    if (new Date(form.end_datetime) < new Date(form.start_datetime)) {
      setModalError(language === 'so' ? 'Taariikhda kama dambaysta ah kama horreyn karto taariikhda bilaabashada' : 'Deadline date cannot be earlier than start date');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description ? form.description.trim() : '',
        taskType: form.task_type || 'HOUSEHOLD_VISIT',
        campaignId: form.campaign_id || null,
        volunteerId: form.assigned_volunteer_id || null,
        priority: form.priority || 'MEDIUM',
        startDatetime: form.start_datetime,
        deadlineDatetime: form.end_datetime,
        targetLocationName: form.target_location_name || (language === 'so' ? 'Goobta Shaqada' : 'Field Location'),
        regionId: form.region_id || 'reg-banadir',
        districtId: form.district_id || 'dist-hodan',
        latitude: form.target_latitude ? parseFloat(form.target_latitude) : 2.0469,
        longitude: form.target_longitude ? parseFloat(form.target_longitude) : 45.3182
      };
      await api.post('/tasks', payload);
      addToast(language === 'so' ? 'Hawsha si guul leh ayaa loo abuuray' : 'Task created successfully', 'success');
      setIsAddModalOpen(false);
      fetchTasks();
      setForm({
        title: '', description: '', task_type: '', campaign_id: '',
        assigned_volunteer_id: '', priority: '', start_datetime: '', end_datetime: '',
        target_location_name: '', target_latitude: '', target_longitude: '', status: ''
      });
      setSubmitted(false);
    } catch (err) {
      setModalError(err.message || (language === 'so' ? 'Abuuridda hawsha way fashilantay' : 'Failed to create task'));
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT Task
  const openEditModal = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      task_type: task.task_type || 'HOUSEHOLD_VISIT',
      campaign_id: task.campaign_id || '',
      assigned_volunteer_id: task.assigned_volunteer_id || task.volunteer_id || '',
      priority: task.priority || 'MEDIUM',
      start_datetime: task.start_datetime ? String(task.start_datetime).split('T')[0].split(' ')[0] : '',
      end_datetime: task.deadline_datetime ? String(task.deadline_datetime).split('T')[0].split(' ')[0] : '',
      target_location_name: task.target_location_name || '',
      status: task.status || 'ASSIGNED'
    });
    setModalError('');
    setSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!form.title || !form.title.trim()) {
      setModalError(language === 'so' ? 'Ciwaanka hawsha waa qasab' : 'Task title is required');
      return;
    }

    setFormLoading(true);
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        title: form.title.trim(),
        description: form.description ? form.description.trim() : '',
        taskType: form.task_type,
        priority: form.priority,
        status: form.status,
        targetLocationName: form.target_location_name,
        startDatetime: form.start_datetime,
        deadlineDatetime: form.end_datetime
      });
      addToast(language === 'so' ? 'Hawsha si guul leh ayaa loo cusboonaysiiyay' : 'Task updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchTasks();
    } catch (err) {
      setModalError(err.message || (language === 'so' ? 'Cusboonaysiintu way fashilantay' : 'Failed to update task'));
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE Task
  const openDeleteModal = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTask) return;
    setFormLoading(true);
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      addToast(
        language === 'so'
          ? `Hawsha "${selectedTask.title}" si guul leh ayaa loo tirtiray`
          : `Task "${selectedTask.title}" deleted successfully`,
        'success'
      );
      setIsDeleteModalOpen(false);
      fetchTasks();
    } catch (err) {
      addToast(err.message || (language === 'so' ? 'Tirtiriddu way fashilantay' : 'Failed to delete task'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Magaca Hawsha' : 'Task Title',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{row.title}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{row.description}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Ololaha' : 'Campaign',
      render: (row) => (
        <span className="text-xs font-medium text-teal-700 dark:text-teal-400">
          {row.campaign_name || (language === 'so' ? 'Caafimaad Guud' : 'General Health')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Hawl-wadeenka La Xilsaaray' : 'Assigned Volunteer',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {row.volunteer_name || (language === 'so' ? 'Aan la qoondeyn' : 'Unassigned')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Goobta' : 'Location',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {row.target_location_name || (language === 'so' ? 'Goobta' : 'Field')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Mudnaanta' : 'Priority',
      render: (row) => {
        const prioText = language === 'so'
          ? (row.priority === 'URGENT' ? 'Deg-deg' : (row.priority === 'HIGH' ? 'Sare' : (row.priority === 'LOW' ? 'Hoose' : 'Dhexdhexaad')))
          : row.priority;
        return <Badge status={row.priority}>{prioText}</Badge>;
      }
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => {
        const statText = language === 'so'
          ? (row.status === 'COMPLETED' ? 'Dhameystiran' : (row.status === 'IN_PROGRESS' ? 'Socda' : (row.status === 'ASSIGNED' ? 'Lagula Xilsaaray' : (row.status === 'CANCELLED' ? 'La Joojiyay' : row.status))))
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
            <CheckSquare className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            <span>{language === 'so' ? 'Hawlaha & Xilsaaridda' : 'Tasks & Assignments'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so' ? 'Qoondee, qorshee, oo kormeer hawlaha howlgalka goobta' : 'Assign, schedule, and oversee field operations tasks'}
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              title: '', description: '', task_type: '', campaign_id: '',
              assigned_volunteer_id: '', priority: '', start_datetime: '', end_datetime: '',
              target_location_name: '', target_latitude: '', target_longitude: '', status: ''
            });
            setModalError('');
            setSubmitted(false);
            setIsAddModalOpen(true);
          }}
          icon={Plus}
        >
          {language === 'so' ? '+ Qoondee Hawl Cusub' : '+ Assign New Task'}
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={tasks.length}
          label={language === 'so' ? 'Wadarta Hawlaha' : 'Total Tasks'}
          icon={ListTodo}
          color="teal"
          subtitle={language === 'so' ? 'Dhammaan howlaha goobta' : 'All field operations'}
        />
        <StatCard
          value={tasks.filter(t => ['ASSIGNED','ACCEPTED','IN_PROGRESS'].includes(t.status)).length}
          label={language === 'so' ? 'Hawlaha Socda' : 'In Progress'}
          icon={PlayCircle}
          color="blue"
          subtitle={language === 'so' ? 'Hawlaha hadda socda' : 'Active assignments'}
        />
        <StatCard
          value={tasks.filter(t => t.status === 'COMPLETED').length}
          label={language === 'so' ? 'La Dhameeyay' : 'Completed'}
          icon={CheckCircle}
          color="emerald"
          subtitle={language === 'so' ? 'Si guul leh loo dhameeyay' : 'Successfully done'}
        />
        <StatCard
          value={tasks.filter(t => t.priority === 'URGENT').length}
          label={language === 'so' ? 'Mudnaan Deg-deg ah' : 'Urgent Priority'}
          icon={Flame}
          color="red"
          subtitle={language === 'so' ? 'U baahan gurmad deg-deg ah' : 'Needs immediate action'}
        />
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder={language === 'so' ? 'Ku raadso magaca hawsha...' : 'Search task title...'}
        actions={
          <Button size="sm" variant="outline" onClick={fetchTasks}>
            {language === 'so' ? 'Raadi...' : 'Search...'}
          </Button>
        }
      />

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={language === 'so' ? 'Qoondee Hawl Cusub oo Goobeed' : 'Assign New Field Task'}
        size="lg"
      >
        <form noValidate onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label={language === 'so' ? 'Magaca Hawsha *' : 'Task Title *'}
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={language === 'so' ? 'tusaale: Booqasho tallaal polio oo guri-guri ah' : 'e.g. Door-to-door polio sweep'}
            required
            submitted={submitted}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Nooca Hawsha' : 'Task Type'}
              name="task_type"
              value={form.task_type}
              onChange={(e) => setForm({ ...form, task_type: e.target.value })}
              options={taskTypes}
              submitted={submitted}
            />
            <Select
              label={language === 'so' ? 'Mudnaanta' : 'Priority'}
              name="priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={priorities}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Ololaha La Xiriira' : 'Associated Campaign'}
              name="campaign_id"
              value={form.campaign_id}
              onChange={(e) => setForm({ ...form, campaign_id: e.target.value })}
              options={campaigns.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))}
              placeholder={language === 'so' ? '-- Dooro Olole --' : '-- Select Campaign --'}
              submitted={submitted}
            />
            <Select
              label={language === 'so' ? 'U Qoondee Hawl-wadeen' : 'Assign To Volunteer'}
              name="assigned_volunteer_id"
              value={form.assigned_volunteer_id}
              onChange={(e) => setForm({ ...form, assigned_volunteer_id: e.target.value })}
              options={volunteers.map(v => ({ value: v.id, label: `${v.full_name} (${v.volunteer_id})` }))}
              placeholder={language === 'so' ? '-- Dooro Hawl-wadeen --' : '-- Select Volunteer --'}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'so' ? 'Taariikhda Bilowga *' : 'Start Date *'}
              name="start_datetime"
              type="date"
              value={form.start_datetime}
              onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
              required
              submitted={submitted}
            />
            <Input
              label={language === 'so' ? 'Taariikhda Ugu Dambaysa *' : 'Deadline Date *'}
              name="end_datetime"
              type="date"
              value={form.end_datetime}
              onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
              required
              submitted={submitted}
            />
          </div>

          <Input
            label={language === 'so' ? 'Magaca Goobta Bartilmaameedka' : 'Target Location Name'}
            name="target_location_name"
            value={form.target_location_name}
            onChange={(e) => setForm({ ...form, target_location_name: e.target.value })}
            placeholder={language === 'so' ? 'tusaale: Taleex Zone A, Hodan' : 'e.g. Taleex Zone A, Hodan'}
            submitted={submitted}
          />

          <Textarea
            label={language === 'so' ? 'Tilmaamaha & Sharaxaadda' : 'Instructions & Description'}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              {language === 'so' ? 'Ka Noqo' : 'Cancel'}
            </Button>
            <Button type="submit" loading={formLoading}>
              {language === 'so' ? 'Qoondee Hawsha' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={language === 'so' ? `Wax Ka Beddel Hawsha: ${selectedTask?.title}` : `Edit Task: ${selectedTask?.title}`}
        size="lg"
      >
        <form noValidate onSubmit={handleUpdate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label={language === 'so' ? 'Magaca Hawsha *' : 'Task Title *'}
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            submitted={submitted}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Xaaladda Hawsha' : 'Task Status'}
              name="status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={taskStatuses}
              required
              submitted={submitted}
            />
            <Select
              label={language === 'so' ? 'Mudnaanta' : 'Priority'}
              name="priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={priorities}
              required
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={language === 'so' ? 'Taariikhda Bilowga' : 'Start Date'}
              name="start_datetime"
              type="date"
              value={form.start_datetime}
              onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
              submitted={submitted}
            />
            <Input
              label={language === 'so' ? 'Taariikhda Ugu Dambaysa' : 'Deadline Date'}
              name="end_datetime"
              type="date"
              value={form.end_datetime}
              onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
              submitted={submitted}
            />
          </div>

          <Input
            label={language === 'so' ? 'Magaca Goobta' : 'Location Name'}
            name="target_location_name"
            value={form.target_location_name}
            onChange={(e) => setForm({ ...form, target_location_name: e.target.value })}
            submitted={submitted}
          />

          <Textarea
            label={language === 'so' ? 'Sharaxaadda' : 'Description'}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
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

      {/* DELETE TASK MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={language === 'so' ? 'Xaqiiji Tirtiridda Hawsha' : 'Confirm Task Deletion'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {language === 'so' ? 'Ma hubtaa inaad si joogto ah u tirtirto hawsha' : 'Are you sure you want to permanently delete task'}{' '}
            <strong className="text-slate-900 dark:text-white">{selectedTask?.title}</strong>?
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
