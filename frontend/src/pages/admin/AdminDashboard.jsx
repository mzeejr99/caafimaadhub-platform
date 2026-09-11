import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

import {
  Users, Megaphone, CheckSquare, ClipboardList, AlertTriangle,
  Package, MessageSquare, TrendingUp, Calendar, ChevronDown,
  UserPlus, BellRing, FileText, MapPin,
  Clock, CheckCircle2, Shield, Activity, Wifi, PhoneCall,
  Send, RotateCcw
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import InteractiveLeafletMap from '../../components/maps/InteractiveLeafletMap';
import { enumLabel } from '../../i18n/enums';
import { formatLongDate, formatShortDate } from '../../i18n/dates';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr, t) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('adash.just_now');
  if (mins < 60) return `${mins} ${t('adash.minutes_ago')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t('adash.hours_ago')}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${t('adash.days_ago')}`;
}

function formatTaskDate(dateStr, t, language) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (target.getTime() === today.getTime()) {
    return `${t('adash.today')}, ${d.toLocaleTimeString(language === 'so' ? 'so-SO' : 'en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (target.getTime() === tomorrow.getTime()) return t('adash.tomorrow');
  return formatShortDate(d, language);
}

const PRIORITY_COLORS = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-slate-400 dark:bg-slate-600',
};

const SEVERITY_COLORS = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-blue-400',
};

const CAMPAIGN_STATUS_COLORS = {
  ACTIVE: '#0d9488',
  PLANNED: '#3b82f6',
  COMPLETED: '#ec4899',
  PAUSED: '#f97316',
  DRAFT: '#94a3b8',
  CANCELLED: '#ef4444',
};

const AUDIT_ACTION_ICONS = {
  TASK_CREATED: CheckSquare,
  TASK_UPDATED: CheckSquare,
  VOLUNTEER_REGISTERED: UserPlus,
  VOLUNTEER_APPROVED: UserPlus,
  CAMPAIGN_CREATED: Megaphone,
  CAMPAIGN_UPDATED: Megaphone,
  FIELD_SUBMISSION: ClipboardList,
  LOW_INVENTORY: Package,
  EMERGENCY_REPORTED: BellRing,
};

// ─── component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayName = user?.fullName || user?.full_name || 'Admin';

  const currentDate = new Date();
  const dateStr = formatLongDate(currentDate, language);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/analytics/dashboard');
      if (res && res.success) setStats(res.data);
    } catch (err) {
      if (!isSilent) console.error('Failed to fetch dashboard stats:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Automatic background refresh every 10 seconds without flickering
  useAutoRefresh(fetchDashboardData, 10000);


  // ── Line chart: field submissions trend (last 30 days) ───────────────────
  const trendDates = stats?.submissionsTrend?.map(d => d.date) || [];
  const trendSubmissions = stats?.submissionsTrend?.map(d => Number(d.submissions_count)) || [];
  const trendApproved = stats?.submissionsTrend?.map(d => Number(d.approved_count)) || [];

  const lineChartData = {
    labels: trendDates,
    datasets: [
      {
        label: t('adash.reports_submitted'),
        data: trendSubmissions,
        borderColor: '#10b981',
        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)',
        fill: true, tension: 0.45, borderWidth: 2.5,
        pointBackgroundColor: '#10b981', pointBorderColor: isDark ? '#0f172a' : '#fff',
        pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
      },
      {
        label: t('adash.reports_approved'),
        data: trendApproved,
        borderColor: '#3b82f6',
        backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)',
        fill: true, tension: 0.45, borderWidth: 2.5,
        pointBackgroundColor: '#3b82f6', pointBorderColor: isDark ? '#0f172a' : '#fff',
        pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: isDark ? '#0f172a' : '#1e293b', 
        padding: 10, cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 11 } 
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: { font: { size: 10 }, color: isDark ? '#94a3b8' : '#64748b' },
        grid: { color: isDark ? '#334155' : '#f1f5f9', drawBorder: false } 
      },
      x: {
        ticks: { font: { size: 10 }, color: isDark ? '#94a3b8' : '#64748b', maxTicksLimit: 8 },
        grid: { display: false, drawBorder: false }
      }
    }
  };

  // ── Donut chart: campaign status breakdown ────────────────────────────────
  const campaignBreakdown = stats?.campaignStatusBreakdown || [];
  const donutLabels = campaignBreakdown.map(s => s.status);
  const donutCounts = campaignBreakdown.map(s => Number(s.count));
  const totalCampaigns = donutCounts.reduce((a, b) => a + b, 0);

  const donutChartData = {
    labels: donutLabels,
    datasets: [{
      data: donutCounts,
      backgroundColor: donutLabels.map(s => CAMPAIGN_STATUS_COLORS[s] || '#94a3b8'),
      borderWidth: 0, hoverOffset: 4, cutout: '72%'
    }]
  };

  const donutChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: isDark ? '#0f172a' : '#1e293b', padding: 8, cornerRadius: 8 }
    }
  };

  // ── Map markers: real data from DB ───────────────────────────────────────
  const mapMarkers = [
    ...(stats?.mapData?.facilities || []).map(f => ({
      latitude: parseFloat(f.latitude),
      longitude: parseFloat(f.longitude),
      color: '#06b6d4',
      popup: `${f.name} (${f.facility_type})`
    })),
    ...(stats?.mapData?.emergencies || []).map(e => ({
      latitude: parseFloat(e.latitude),
      longitude: parseFloat(e.longitude),
      color: '#ef4444',
      popup: `${(e.emergency_type || '').replace(/_/g, ' ')}: ${e.location_name || ''}`
    })),
    ...(stats?.mapData?.volunteers || []).map(v => ({
      latitude: parseFloat(v.latitude),
      longitude: parseFloat(v.longitude),
      color: '#10b981',
      popup: `${v.full_name} — ${v.region_name || ''}`
    }))
  ].filter(m => !isNaN(m.latitude) && !isNaN(m.longitude));

  const liveVolunteers = (stats?.mapData?.volunteers || []).length;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {t('adash.welcome_back')}, {displayName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {t('adash.today_summary')}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* 2. Top 6 Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        <div
          onClick={() => navigate('/admin/volunteers')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.active_volunteers')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.activeVolunteers ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /><span>{t('adash.active_in_field')} &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/campaigns')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.active_campaigns')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.activeCampaigns ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <Activity className="w-3 h-3" /><span>{t('adash.live_programs')} &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/field-data')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:bg-cyan-100 transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.pending_reports')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.pendingReports ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
            <Clock className="w-3 h-3" /><span>{t('adash.awaiting_review')} &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/tasks')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.today_tasks')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.todayTasks ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
            <Calendar className="w-3 h-3" /><span>{t('adash.scheduled_today')} &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/feedback')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.open_feedback')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.openFeedback ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
            <PhoneCall className="w-3 h-3" /><span>{t('adash.community_tickets')} &rarr;</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/inventory')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] active:scale-[0.99] cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight">{t('adash.low_stock')}</p>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats?.cards?.lowStockItems ?? 0}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" /><span>{t('adash.restock')} &rarr;</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Charts + Map + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Line Chart: Field Reporting Trend */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.reporting_overview')}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium">
              {t('adash.last_30')}
            </span>
          </div>
          <div className="flex items-center gap-4 mb-2 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t('adash.reports_submitted')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t('adash.reports_approved')}</span>
            </div>
          </div>
          <div className="h-56 w-full">
            {trendDates.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t('adash.no_submission_data')}
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Campaign Status */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{t('adash.campaign_overview')}</h3>
          {totalCampaigns > 0 ? (
            <>
              <div className="relative h-44 my-auto flex items-center justify-center">
                <Doughnut data={donutChartData} options={donutChartOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{totalCampaigns}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('adash.total_campaigns')}</span>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
                {campaignBreakdown.map(s => (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAMPAIGN_STATUS_COLORS[s.status] || '#94a3b8' }} />
                      {t(`status.${s.status}`)}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {s.count} ({totalCampaigns > 0 ? Math.round((Number(s.count) / totalCampaigns) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              {t('adash.no_campaigns')}
            </div>
          )}
        </div>

        {/* Activity Map */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.activity_map')}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg font-medium">
              Somalia
            </span>
          </div>
          <div className="relative h-48 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <InteractiveLeafletMap
              center={[5.1521, 46.1996]}
              zoom={5}
              markers={mapMarkers}
              height="100%"
            />
            <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm z-[1000] text-[9px] font-semibold space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-700 dark:text-slate-300">{t('adash.active_volunteers')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-slate-700 dark:text-slate-300">{t('adash.facilities')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-700 dark:text-slate-300">{t('adash.outbreak_alerts')}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t('adash.mapped_facilities')}</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              {(stats?.mapData?.facilities || []).length} {t('adash.sites')}
            </span>
          </div>
        </div>

        {/* Quick Actions + Upcoming Tasks */}
        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">{t('adash.quick_actions')}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/admin/volunteers')}
                className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-emerald-100 dark:border-emerald-800">
                <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold">{t('adash.add_volunteer')}</span>
              </button>
              <button onClick={() => navigate('/admin/campaigns')}
                className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/90 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-blue-100 dark:border-blue-800">
                <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold">{t('adash.create_campaign')}</span>
              </button>
              <button onClick={() => navigate('/admin/tasks')}
                className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100/90 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-purple-100 dark:border-purple-800">
                <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-bold">{t('adash.assign_task')}</span>
              </button>
              <button onClick={() => navigate('/admin/field-data')}
                className="p-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100/90 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-teal-100 dark:border-teal-800">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-[10px] font-bold">{t('adash.field_report')}</span>
              </button>
              <button onClick={() => navigate('/admin/emergencies')}
                className="p-2.5 rounded-xl bg-red-50/80 dark:bg-red-950/40 hover:bg-red-100/90 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-red-100 dark:border-red-800">
                <BellRing className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-[10px] font-bold">{t('adash.send_alert')}</span>
              </button>
              <button onClick={() => navigate('/admin/reports')}
                className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/90 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex flex-col items-center justify-center gap-1.5 transition-colors border border-amber-100 dark:border-amber-800">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold">{t('adash.view_reports')}</span>
              </button>
            </div>
          </div>

          {/* Upcoming Tasks (from DB) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('adash.upcoming_tasks')}</h3>
              <button onClick={() => navigate('/admin/tasks')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                {t('adash.view_all')}
              </button>
            </div>
            <div className="space-y-2.5">
              {(stats?.upcomingTasks || []).length > 0 ? (
                (stats.upcomingTasks).map(task => (
                  <div key={task.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className={`w-1.5 h-3.5 ${PRIORITY_COLORS[task.priority] || 'bg-slate-400'} rounded-sm mt-0.5 shrink-0`} />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{task.title}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">{task.region_name || task.district_name || 'Field'}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                      {formatTaskDate(task.start_datetime, t, language)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">{t('adash.no_upcoming')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Recent System Activity (from audit_logs) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.recent_activity')}</h3>
            <button onClick={() => navigate('/admin/audit-logs')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t('adash.view_all')}
            </button>
          </div>
          <div className="space-y-3 text-xs flex-1">
            {(stats?.recentActivity || []).length > 0 ? (
              stats.recentActivity.map(log => {
                const Icon = AUDIT_ACTION_ICONS[log.action] || Activity;
                return (
                  <div key={log.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                        {enumLabel(t, log.action)} — {log.entity_name}
                        {log.user_name ? ` by ${log.user_name}` : (log.user_email ? ` by ${log.user_email}` : '')}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-medium">{timeAgo(log.created_at, t)}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">{t('adash.no_activity')}</p>
            )}
          </div>
        </div>

        {/* Volunteer Distribution (from DB) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.distribution')}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg font-medium">
              <span>{t('adash.by_region')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-1.5">{t('adash.region')}</th>
                <th className="pb-1.5 text-center">{t('adash.total')}</th>
                <th className="pb-1.5 text-center">{t('adash.active')}</th>
                <th className="pb-1.5 text-right">{t('adash.rate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
              {(stats?.regionalDistribution || []).filter(r => Number(r.volunteer_count) > 0).map(region => (
                <tr key={region.region_name}>
                  <td className="py-1.5 font-bold text-slate-900 dark:text-white">{region.region_name}</td>
                  <td className="py-1.5 text-center">{region.volunteer_count}</td>
                  <td className="py-1.5 text-center">{region.active_volunteers}</td>
                  <td className="py-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {Number(region.volunteer_count) > 0
                      ? Math.round((Number(region.active_volunteers) / Number(region.volunteer_count)) * 100) + '%'
                      : '0%'}
                  </td>
                </tr>
              ))}
              {(() => {
                const rows = (stats?.regionalDistribution || []);
                const total = rows.reduce((s, r) => s + Number(r.volunteer_count), 0);
                const active = rows.reduce((s, r) => s + Number(r.active_volunteers), 0);
                if (total === 0) return (
                  <tr><td colSpan={4} className="py-3 text-center text-slate-400 dark:text-slate-500 text-[10px]">{t('adash.no_volunteers')}</td></tr>
                );
                return (
                  <tr className="border-t border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                    <td className="py-1.5">{t('adash.total')}</td>
                    <td className="py-1.5 text-center">{total.toLocaleString()}</td>
                    <td className="py-1.5 text-center">{active.toLocaleString()}</td>
                    <td className="py-1.5 text-right text-emerald-600 dark:text-emerald-400">
                      {total > 0 ? Math.round((active / total) * 100) + '%' : '0%'}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Training Progress (from DB) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.training_progress')}</h3>
            <button onClick={() => navigate('/admin/training')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t('adash.view_all')}
            </button>
          </div>
          <div className="space-y-2.5 text-xs flex-1">
            {(stats?.trainingProgress || []).length > 0 ? (
              stats.trainingProgress.map(course => {
                const pct = Number(course.enrolled_count) > 0
                  ? Math.round((Number(course.completed_count) / Number(course.enrolled_count)) * 100)
                  : 0;
                return (
                  <div key={course.id}>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span className="truncate mr-2">{course.title}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-normal shrink-0">
                        {pct}% <strong className="text-slate-700 dark:text-slate-200 ml-1">{course.completed_count}/{course.enrolled_count}</strong>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">{t('adash.no_training')}</p>
            )}
          </div>
        </div>

        {/* Alerts & Notifications (from DB) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('adash.alerts')}</h3>
            <button onClick={() => navigate('/admin/emergencies')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t('adash.view_all')}
            </button>
          </div>
          <div className="space-y-3 text-xs flex-1">
            {(stats?.emergencyAlerts || []).length > 0 ? (
              stats.emergencyAlerts.map(alert => (
                <div key={alert.id} className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[alert.severity] || 'bg-slate-400'} mt-1 shrink-0`} />
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">
                      {enumLabel(t, alert.emergency_type)}
                      {alert.region_name ? ` — ${alert.region_name}` : ''}
                      {alert.community_name ? `, ${alert.community_name}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">{timeAgo(alert.created_at, t)}</span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{t('adash.no_alerts')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. KPI Performance Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        <div
          onClick={() => navigate('/admin/volunteers')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {stats?.cards?.activeVolunteers ?? '—'}
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.field_volunteers')}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{t('adash.active')} &rarr;</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/volunteers')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {stats?.cards?.pendingVolunteers ?? '—'}
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.pending_approvals')}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{t('adash.field_volunteers_short')} &rarr;</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/sms')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {stats?.smsStats?.sentToday ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.sms_today')}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
              {stats?.smsStats?.deliveredToday ?? 0} {t('adash.delivered')} &rarr;
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/emergencies')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {stats?.cards?.criticalEmergencies ?? 0}
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.critical_alerts')}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{t('adash.unresolved')} &rarr;</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/field-data')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {stats?.dataAccuracy != null ? `${stats.dataAccuracy}%` : '—'}
            </p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.data_accuracy')}</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-tight">{t('adash.approved_reports')} &rarr;</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/feedback')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">24/7</p>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{t('adash.support_status')}</p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold leading-tight">{t('adash.active')} &rarr;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
