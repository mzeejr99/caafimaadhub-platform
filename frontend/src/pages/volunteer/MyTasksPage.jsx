import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckSquare, MapPin, Clock, CheckCircle2, Play, Check, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

export default function MyTasksPage() {
  const { t } = useLanguage();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [board, setBoard] = useState({ today: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/tasks/board');
      if (res && res.success && res.data) {
        setBoard(res.data);
        setLoadError(false);
      } else if (res && res.data) {
        setBoard(res.data);
        setLoadError(false);
      }
    } catch (err) {
      if (!isSilent) {
        console.error(err);
        setLoadError(true);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Silent auto refresh every 10 seconds
  useAutoRefresh(fetchTasks, 10000);

  const handleAccept = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/accept`);
      addToast(t('my_tasks.accepted'), 'success');
      fetchTasks(true);
    } catch (err) {
      addToast(err.message || t('my_tasks.accept_failed'), 'error');
    }
  };

  const handleStart = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/start`);
      addToast(t('my_tasks.started'), 'info');
      navigate('/volunteer/field-data');
    } catch (err) {
      addToast(err.message || t('my_tasks.start_failed'), 'error');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/complete`);
      addToast(t('my_tasks.completed'), 'success');
      fetchTasks(true);
    } catch (err) {
      addToast(err.message || t('my_tasks.complete_failed'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Guard: only if explicit error and zero board data
  if (loadError && !board) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {t('my_tasks.load_error') || 'Could not load tasks. Please try again.'}
        </p>
        <button
          onClick={() => fetchTasks()}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
        >
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  const todayList = Array.isArray(board?.today)
    ? board.today
    : (Array.isArray(board?.assigned) ? board.assigned : []);
  const upcomingList = Array.isArray(board?.upcoming)
    ? board.upcoming
    : (Array.isArray(board?.accepted) ? board.accepted : []);
  const completedList = Array.isArray(board?.completed)
    ? board.completed
    : [];

  const renderTaskCard = (task) => {
    if (!task) return null;
    return (
      <div key={task.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{task.title || 'Untitled Task'}</h4>
            <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">{task.campaign_name || t('my_tasks.operation')}</p>
          </div>
          {task.priority && <Badge status={task.priority}>{task.priority}</Badge>}
        </div>

        {task.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{task.description}</p>
        )}

        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.target_location_name || t('my_tasks.field_location')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{task.start_datetime ? new Date(task.start_datetime).toLocaleString() : t('my_tasks.open_schedule')}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Badge status={task.status || 'PENDING'}>{t(`status.${task.status}`) || task.status || 'PENDING'}</Badge>

          <div className="flex items-center gap-2">
            {task.status === 'ASSIGNED' && (
              <Button size="sm" variant="outline" onClick={() => handleAccept(task.id)}>
                {t('volunteer_portal.accept_task')}
              </Button>
            )}
            {(task.status === 'ACCEPTED' || task.status === 'ASSIGNED') && (
              <Button size="sm" onClick={() => handleStart(task.id)} icon={Play}>
                {t('volunteer_portal.start_task')}
              </Button>
            )}
            {task.status === 'IN_PROGRESS' && (
              <Button size="sm" variant="success" onClick={() => handleComplete(task.id)} icon={Check}>
                {t('my_tasks.complete')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <CheckSquare className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.my_tasks')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('my_tasks.subtitle')}</p>
      </div>

      {/* 3 Full-Width Responsive Columns */}
      <div className="grid md:grid-cols-3 gap-6 w-full">
        {/* Today's Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{t('volunteer_portal.my_tasks_today')}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold">
              {todayList.length}
            </span>
          </div>
          {todayList.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">{t('my_tasks.none_today')}</p>
          ) : (
            todayList.map(renderTaskCard)
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{t('volunteer_portal.upcoming_tasks')}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold">
              {upcomingList.length}
            </span>
          </div>
          {upcomingList.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">{t('my_tasks.none_upcoming')}</p>
          ) : (
            upcomingList.map(renderTaskCard)
          )}
        </div>

        {/* Completed Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">{t('volunteer_portal.completed_tasks')}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
              {completedList.length}
            </span>
          </div>
          {completedList.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 text-center">{t('my_tasks.none_completed')}</p>
          ) : (
            completedList.map(renderTaskCard)
          )}
        </div>
      </div>
    </div>
  );
}
