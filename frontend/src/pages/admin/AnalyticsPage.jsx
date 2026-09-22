import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart3, TrendingUp, Users, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import api from '../../services/api';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

const STATUS_COLORS = {
  ACTIVE: '#10b981',
  APPROVED: '#0d9488',
  PENDING: '#f59e0b',
  UNDER_REVIEW: '#3b82f6',
  SUSPENDED: '#ef4444',
  INACTIVE: '#94a3b8',
  REJECTED: '#f97316',
};

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, trendRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/trends').catch(() => ({ success: false }))
      ]);
      if (dashRes.success) setDashboard(dashRes.data);
      if (trendRes.success) setTrends(trendRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // ── Chart 1: Field Submissions Trend (last 30 days from DB) ──────────────
  const trendRows = dashboard?.submissionsTrend || [];
  const submissionsChartData = {
    labels: trendRows.map(r => r.date),
    datasets: [
      {
        label: t('analytics.field_submissions'),
        data: trendRows.map(r => Number(r.submissions_count)),
        borderColor: 'rgb(13,148,136)',
        backgroundColor: 'rgba(13,148,136,0.1)',
        fill: true, tension: 0.3
      }
    ]
  };

  // ── Chart 2: Regional Volunteer Deployment (from DB) ──────────────────────
  const regions = (dashboard?.regionalDistribution || []);
  const regionalChartData = {
    labels: regions.map(r => r.region_name),
    datasets: [
      {
        label: t('analytics.deployed'),
        data: regions.map(r => Number(r.volunteer_count)),
        backgroundColor: 'rgba(37,99,235,0.75)',
        borderRadius: 6
      }
    ]
  };

  // ── Chart 3: Volunteer Status Breakdown (from /analytics/trends) ──────────
  const volStatuses = trends?.volunteerStatuses || [];
  const volunteerStatusData = {
    labels: volStatuses.map(s => s.status),
    datasets: [
      {
        data: volStatuses.map(s => Number(s.count)),
        backgroundColor: volStatuses.map(s => STATUS_COLORS[s.status] || '#94a3b8')
      }
    ]
  };

  // ── Performance metrics computed from real data ───────────────────────────
  const taskBreakdown = dashboard?.taskBreakdown || [];
  const completedTasks = taskBreakdown.find(t => t.status === 'COMPLETED');
  const totalTasks = taskBreakdown.reduce((s, t) => s + Number(t.count), 0);
  const taskCompletionRate = totalTasks > 0
    ? Math.round((Number(completedTasks?.count || 0) / totalTasks) * 100)
    : null;

  const trainingRows = dashboard?.trainingProgress || [];
  const totalEnrolled = trainingRows.reduce((s, c) => s + Number(c.enrolled_count), 0);
  const totalCompleted = trainingRows.reduce((s, c) => s + Number(c.completed_count), 0);
  const trainingPassRate = totalEnrolled > 0
    ? Math.round((totalCompleted / totalEnrolled) * 100)
    : null;

  const dataAccuracy = dashboard?.dataAccuracy;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.analytics')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('analytics.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Field Submissions Trend */}
        <Card title={t('analytics.submissions_30')} icon={TrendingUp}>
          <div className="h-64">
            {trendRows.length > 0 ? (
              <Line
                data={submissionsChartData}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No field submissions in the last 30 days
              </div>
            )}
          </div>
        </Card>

        {/* Regional Volunteer Deployment */}
        <Card title={t('analytics.regional_deployment')} icon={Users}>
          <div className="h-64">
            {regions.length > 0 ? (
              <Bar
                data={regionalChartData}
                options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                {t('analytics.no_volunteer_data')}
              </div>
            )}
          </div>
        </Card>

        {/* Volunteer Status Breakdown */}
        <Card title={t('analytics.workforce_status')} icon={Shield}>
          <div className="h-64 flex items-center justify-center">
            {volStatuses.length > 0 ? (
              <div className="w-56 h-56">
                <Doughnut
                  data={volunteerStatusData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t('analytics.no_status_data')}</p>
            )}
          </div>
        </Card>

        {/* Operational Performance Summary */}
        <Card title={t('analytics.performance_summary')} icon={CheckCircle2}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('analytics.task_rate')}</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                {taskCompletionRate != null ? `${taskCompletionRate}%` : '—'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('analytics.total_tasks')}</span>
              <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                {totalTasks > 0 ? totalTasks.toLocaleString() : '0'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('analytics.accuracy')}</span>
              <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">
                {dataAccuracy != null ? `${dataAccuracy}%` : '—'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('analytics.training_rate')}</span>
              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                {trainingPassRate != null ? `${trainingPassRate}%` : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
