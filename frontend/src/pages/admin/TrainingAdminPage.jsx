import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { GraduationCap, BookOpen, Award, Plus, CheckCircle2, Edit, Trash2, AlertCircle, Globe, Users, User } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { enumLabel } from '../../i18n/enums';

export default function TrainingAdminPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'certificates'
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIssueCertModalOpen, setIsIssueCertModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [volSearch, setVolSearch] = useState('');

  const [form, setForm] = useState({
    code: '',
    title: '',
    category: '',
    description: '',
    durationHours: 2,
    passingScorePercentage: 80
  });

  const [issueForm, setIssueForm] = useState({
    volunteerId: '',
    courseId: '',
    score: 95,
    issueDate: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { value: 'VACCINATION', label: t('train_admin.cat_vaccination') },
    { value: 'MATERNAL_HEALTH', label: t('train_admin.cat_maternal') },
    { value: 'DISEASE_SURVEILLANCE', label: t('train_admin.cat_surveillance') },
    { value: 'NUTRITION', label: t('train_admin.cat_nutrition') },
    { value: 'WASH', label: t('train_admin.cat_wash') },
    { value: 'FIRST_AID', label: t('train_admin.cat_firstaid') },
    { value: 'GENERAL', label: t('train_admin.cat_general') }
  ];

  useEffect(() => {
    fetchCourses(false);
    fetchCertificates();
    fetchVolunteers();
  }, []);

  const fetchCourses = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/training');
      if (res.success) {
        setCourses(res.data || []);
      }
      if (isSilent) {
        fetchCertificates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useAutoRefresh(fetchCourses, 15000, !isAddModalOpen && !isEditModalOpen && !isDeleteModalOpen && !isIssueCertModalOpen);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/training/certificates/all');
      if (res.success) {
        setCertificates(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    }
  };

  const fetchVolunteers = async () => {
    try {
      // Load a large batch so the dropdown is never empty for large orgs
      const res = await api.get('/volunteers?limit=500&offset=0');
      if (res.success) {
        setVolunteers(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch volunteers:', err);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!issueForm.volunteerId || !issueForm.courseId) {
      setModalError(language === 'so' ? 'Fadlan dooro Volunteer-ka iyo Koorsada' : 'Please select both Volunteer and Course');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/training/certificates/issue', issueForm);
      addToast(t('train_admin.cert_issued_toast'), 'success', t('train_admin.cert_issued'));
      setIsIssueCertModalOpen(false);
      setVolSearch('');
      setIssueForm({
        volunteerId: '',
        courseId: '',
        score: 95,
        issueDate: new Date().toISOString().split('T')[0]
      });
      setSubmitted(false);
      fetchCertificates();
    } catch (err) {
      setModalError(err.message || t('train_admin.cert_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // CREATE Course
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!form.title) {
      setModalError(t('train_admin.need_title'));
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/training', form);
      addToast(t('train_admin.created'), 'success');
      setIsAddModalOpen(false);
      fetchCourses();
      setForm({ code: '', title: '', category: 'VACCINATION', description: '', durationHours: 2, passingScorePercentage: 80 });
      setSubmitted(false);
    } catch (err) {
      setModalError(err.message || t('train_admin.create_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT Course
  const openEditModal = (course, e) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setForm({
      code: course.code || '',
      title: course.title || '',
      category: course.category || 'VACCINATION',
      description: course.description || '',
      durationHours: course.duration_hours || 2,
      passingScorePercentage: course.passing_score_percentage || course.passing_score || 80
    });
    setModalError('');
    setSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    setFormLoading(true);
    try {
      await api.put(`/training/${selectedCourse.id}`, form);
      addToast(t('train_admin.updated'), 'success');
      setIsEditModalOpen(false);
      fetchCourses();
    } catch (err) {
      setModalError(err.message || t('train_admin.update_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE Course
  const openDeleteModal = (course, e) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setFormLoading(true);
    try {
      await api.delete(`/training/${selectedCourse.id}`);
      addToast(`Course "${selectedCourse.title}" deleted successfully from MySQL`, 'success');
      setIsDeleteModalOpen(false);
      fetchCourses();
    } catch (err) {
      addToast(err.message || t('train_admin.delete_failed'), 'error');
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
      header: language === 'so' ? 'Cinwaanka & Qeybta' : 'Title & Category',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{row.title}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">{enumLabel(t, row.category)}</p>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Dhibcaha Baasitaanka' : 'Passing Score',
      render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.passing_score_percentage || row.passing_score || 80}%</span>
    },
    {
      header: language === 'so' ? 'Casharrada' : 'Lessons',
      render: (row) => <span className="text-xs text-slate-600 dark:text-slate-300">{row.total_lessons || row.lesson_count || 4} {language === 'so' ? 'Cashar' : 'Lessons'}</span>
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      render: (row) => (
        <Badge status={row.is_published === 1 ? 'ACTIVE' : 'PLANNED'}>
          {row.is_published === 1 ? (language === 'so' ? 'La Daabacay' : 'PUBLISHED') : (language === 'so' ? 'Qabyo' : 'DRAFT')}
        </Badge>
      )
    },
    {
      header: t('common.actions'),
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={(e) => openEditModal(row, e)} icon={Edit}>
            {t('common.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => openDeleteModal(row, e)} icon={Trash2}>
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ];

  const certificateColumns = [
    {
      header: t('train_admin.col_cert_code'),
      render: (row) => (
        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-1 rounded-lg">
          {row.certificate_number}
        </span>
      )
    },
    {
      header: t('train_admin.col_vol_name'),
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {row.volunteer_name || 'Volunteer'}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{row.volunteer_code || row.volunteer_email}</p>
        </div>
      )
    },
    {
      header: t('train_admin.col_course'),
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{row.course_title}</span>
          <p className="text-xs text-teal-700 dark:text-teal-400">{row.course_category}</p>
        </div>
      )
    },
    {
      header: t('train_admin.col_score'),
      render: (row) => (
        <Badge variant={row.score_achieved >= 90 ? 'success' : 'teal'}>
          {row.score_achieved}% Pass
        </Badge>
      )
    },
    {
      header: t('train_admin.col_issued'),
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.issue_date ? new Date(row.issue_date).toLocaleDateString() : 'Recent'}
        </span>
      )
    },
    {
      header: t('train_admin.col_verify'),
      render: (row) => (
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          {row.verification_code}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.training')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Curriculum modules, competency quizzes, and digital credential certification management
          </p>
        </div>
        {activeTab === 'courses' ? (
          <Button onClick={() => { setModalError(''); setSubmitted(false); setIsAddModalOpen(true); }} icon={Plus}>
            {t('train_admin.add')}
          </Button>
        ) : (
          <Button onClick={() => { setModalError(''); setSubmitted(false); setVolSearch(''); setIsIssueCertModalOpen(true); }} icon={Award}>
            {t('train_admin.issue_btn')}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-300 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'so' ? 'Koorsooyinka Manhajka' : 'Curriculum Courses'} ({courses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'certificates'
              ? 'border-teal-600 dark:border-teal-400 text-teal-700 dark:text-teal-300 font-extrabold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{language === 'so' ? 'Shahaadooyinka La Bixiyay' : 'Issued Certificates'} ({certificates.length})</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          value={courses.length} 
          label={t('train_admin.total_courses')} 
          icon={BookOpen} 
          color="teal" 
          subtitle={language === 'so' ? 'Dhammaan qeybaha tababarka' : 'All training modules'} 
        />
        <StatCard 
          value={certificates.length} 
          label={t('train_admin.issued_certs')} 
          icon={Award} 
          color="emerald" 
          subtitle={language === 'so' ? 'Hawl-wadeennada la aqoonsaday' : 'Accredited volunteers'} 
        />
        <StatCard 
          value={volunteers.length} 
          label={t('train_admin.registered_chvs')} 
          icon={Users} 
          color="blue" 
          subtitle={language === 'so' ? 'Hawl-wadeennada firfircoon' : 'Active volunteers'} 
        />
        <StatCard 
          value={[...new Set(courses.map(c => c.category).filter(Boolean))].length} 
          label={t('train_admin.categories')} 
          icon={GraduationCap} 
          color="purple" 
          subtitle={language === 'so' ? 'Qeybaha mawduucyada' : 'Subject areas'} 
        />
      </div>

      {activeTab === 'courses' ? (
        <DataTable columns={columns} data={courses} loading={loading} />
      ) : (
        <DataTable columns={certificateColumns} data={certificates} loading={loading} />
      )}

      {/* ISSUE CERTIFICATE MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={isIssueCertModalOpen}
        onClose={() => {
          setIsIssueCertModalOpen(false);
          setVolSearch('');
        }}
        title={t('train_admin.issue_title')}
        subtitle={t('train_admin.sub_issue')}
        size="md"
      >
        <form noValidate onSubmit={handleIssueCertificate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Volunteer search + select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              {t('train_admin.select_volunteer')} <span className="text-red-500">*</span>
              <span className="ml-2 text-slate-400 font-normal normal-case">({volunteers.length} {language === 'so' ? 'volunteer' : 'volunteers'})</span>
            </label>
            <input
              type="text"
              placeholder={language === 'so' ? '🔍  Raadi magaca volunteer-ka...' : '🔍  Search volunteer by name or ID...'}
              value={volSearch}
              onChange={(e) => setVolSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              name="volunteerId"
              value={issueForm.volunteerId}
              onChange={(e) => setIssueForm({ ...issueForm, volunteerId: e.target.value })}
              required
              className={`w-full px-3 py-2.5 text-sm rounded-xl border ${
                submitted && !issueForm.volunteerId
                  ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
              } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
            >
              <option value="">-- {language === 'so' ? 'Dooro Volunteer-ka' : 'Select Volunteer'} --</option>
              {volunteers
                .filter(v => {
                  if (!volSearch.trim()) return true;
                  const q = volSearch.toLowerCase();
                  return (
                    (v.full_name || '').toLowerCase().includes(q) ||
                    (v.volunteer_id || '').toLowerCase().includes(q) ||
                    (v.email || '').toLowerCase().includes(q) ||
                    (v.phone || '').toLowerCase().includes(q)
                  );
                })
                .map(v => (
                  <option key={v.id} value={v.id}>
                    {v.full_name || v.volunteer_id || 'CHV'} — {v.volunteer_id || v.email || v.phone || 'Volunteer'}
                  </option>
                ))
              }
            </select>
            {submitted && !issueForm.volunteerId && (
              <p className="text-xs text-red-500 font-semibold">{language === 'so' ? 'Volunteer-ka dooro' : 'Please select a volunteer'}</p>
            )}
          </div>

          <Select
            label={t('train_admin.select_course')}
            name="courseId"
            value={issueForm.courseId}
            onChange={(e) => setIssueForm({ ...issueForm, courseId: e.target.value })}
            options={courses.map(c => ({
              value: c.id,
              label: `${c.code} - ${c.title}`
            }))}
            required
            submitted={submitted}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('train_admin.score')}
              name="score"
              type="number"
              value={issueForm.score}
              onChange={(e) => setIssueForm({ ...issueForm, score: parseInt(e.target.value, 10) || 0 })}
              validationType="number-only"
              min="0"
              max="100"
              required
              submitted={submitted}
            />
            <Input
              label={t('train_admin.issue_date')}
              name="issueDate"
              type="date"
              allowPast={true}
              value={issueForm.issueDate}
              onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
              required
              submitted={submitted}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsIssueCertModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={formLoading} icon={Award}>
              {t('train_admin.issue_confirm')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATE COURSE MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('train_admin.create_title')} size="lg">
        <form noValidate onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={t('train_admin.course_title')}
                name="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('train_admin.title_ph')}
                required
                submitted={submitted}
              />
            </div>
            <Input
              label={t('train_admin.course_code')}
              name="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder={t('train_admin.code_ph')}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={t('train_admin.category')}
              name="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categories}
              required
              submitted={submitted}
            />
            <Input
              label={t('train_admin.duration')}
              name="durationHours"
              type="number"
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
              required
              submitted={submitted}
            />
            <Input
              label={t('train_admin.passing_score')}
              name="passingScorePercentage"
              type="number"
              value={form.passingScorePercentage}
              onChange={(e) => setForm({ ...form, passingScorePercentage: e.target.value })}
              required
              submitted={submitted}
            />
          </div>

          <Textarea
            label={t('train_admin.syllabus')}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('train_admin.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT COURSE MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Course: ${selectedCourse?.title}`} size="lg">
        <form noValidate onSubmit={handleUpdate} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label={t('train_admin.course_title')}
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            submitted={submitted}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('train_admin.category')}
              name="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categories}
              required
              submitted={submitted}
            />
            <Input
              label={t('train_admin.passing_score')}
              name="passingScorePercentage"
              type="number"
              value={form.passingScorePercentage}
              onChange={(e) => setForm({ ...form, passingScorePercentage: e.target.value })}
              required
              submitted={submitted}
            />
          </div>

          <Textarea
            label={t('train_admin.syllabus')}
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('train_admin.update')}</Button>
          </div>
        </form>
      </Modal>

      {/* DELETE COURSE MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('train_admin.confirm_delete')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('train_admin.confirm_text')} <strong className="text-slate-900">{selectedCourse?.title}</strong> ({selectedCourse?.code})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={formLoading} onClick={handleDelete}>{t('train_admin.delete_permanent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
