import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  CheckSquare, ClipboardList, BookOpen, Award, Truck, ArrowRight,
  MapPin, Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchCertificates()]);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/board');
      if (res.success) setBoard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/training/certificates/me');
      if (res.success && Array.isArray(res.data)) {
        setCertificatesCount(res.data.length);
      }
    } catch (err) {
      // certificates count stays 0 if unavailable
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const todayTasks = board?.today || [];
  const upcomingTasks = board?.upcoming || [];
  const completedTasks = board?.completed || [];

  return (
    <div className="space-y-6 w-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
              {t('roles.VOLUNTEER')}
            </span>
            <h1 className="text-2xl font-bold mt-1">
              {t('dashboard.welcome')}, {user?.fullName || user?.full_name}
            </h1>
            <p className="text-xs text-teal-100/80 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {t('vol_dash.assigned_district')}: {user?.region || 'Banadir'} / {t('vol_dash.field_operations')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/volunteer/field-data')}
            className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold border-none shadow-lg"
            icon={ClipboardList}
          >
            {t('volunteer_portal.submit_report')}
          </Button>
        </div>
      </div>

      {/* Quick Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div
          onClick={() => navigate('/volunteer/tasks')}
          className="stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group hover:border-teal-300 dark:hover:border-teal-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('volunteer_portal.my_tasks_today')}</p>
          <p className="text-3xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">{todayTasks.length}</p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-2 flex items-center gap-1">
            <span>{t('vol_dash.view_today')} &rarr;</span>
          </p>
        </div>
        <div
          onClick={() => navigate('/volunteer/tasks')}
          className="stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group hover:border-blue-300 dark:hover:border-blue-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('volunteer_portal.upcoming_tasks')}</p>
          <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">{upcomingTasks.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 flex items-center gap-1">
            <span>{t('vol_dash.view_upcoming')} &rarr;</span>
          </p>
        </div>
        <div
          onClick={() => navigate('/volunteer/tasks')}
          className="stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group hover:border-emerald-300 dark:hover:border-emerald-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('volunteer_portal.completed_tasks')}</p>
          <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{completedTasks.length}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
            <span>{t('vol_dash.completed_history')} &rarr;</span>
          </p>
        </div>
        <div
          onClick={() => navigate('/volunteer/certificates')}
          className="stat-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group hover:border-purple-300 dark:hover:border-purple-700"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{t('volunteer_portal.certificates_earned')}</p>
          <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">{certificatesCount}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-2 flex items-center gap-1">
            <span>{t('vol_dash.view_wallet')} &rarr;</span>
          </p>
        </div>
      </div>

      {/* Today's Tasks */}
      <Card
        title={t('volunteer_portal.my_tasks_today')}
        subtitle={t('vol_dash.today_subtitle')}
        icon={CheckSquare}
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate('/volunteer/tasks')}>
            {t('adash.view_all')} ({todayTasks.length + upcomingTasks.length})
          </Button>
        }
      >
        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            {t('vol_dash.no_pending')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {todayTasks.map((task) => (
              <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{task.title}</span>
                    <Badge status={task.priority}>{task.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {task.target_location_name || t('vol_dash.field_site')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {task.start_datetime ? new Date(task.start_datetime).toLocaleTimeString() : t('vol_dash.anytime')}
                    </span>
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/volunteer/field-data')} icon={ArrowRight}>
                  {t('volunteer_portal.start_task')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="grid sm:grid-cols-3 gap-4 w-full">
        <div
          onClick={() => navigate('/volunteer/training')}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/60 rounded-2xl text-purple-700 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">{t('nav.my_training')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('vol_dash.lessons_quizzes')}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/volunteer/certificates')}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">{t('nav.certificates')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('vol_dash.verified_certs')}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/volunteer/supplies')}
          className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center gap-4 group"
        >
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-blue-700 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">{t('nav.my_supplies')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('vol_dash.request_supplies')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
