import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import PublicCampaignsPage from './pages/public/PublicCampaignsPage';
import FeedbackPage from './pages/public/FeedbackPage';
import EmergencyReportPage from './pages/public/EmergencyReportPage';
import VerifyCertificatePage from './pages/public/VerifyCertificatePage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterVolunteerPage from './pages/auth/RegisterVolunteerPage';
import RegisterPublicPage from './pages/auth/RegisterPublicPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VolunteersListPage from './pages/admin/VolunteersListPage';
import VolunteerDetailPage from './pages/admin/VolunteerDetailPage';
import CampaignsListPage from './pages/admin/CampaignsListPage';
import CampaignDetailPage from './pages/admin/CampaignDetailPage';
import TasksListPage from './pages/admin/TasksListPage';
import FieldSubmissionsPage from './pages/admin/FieldSubmissionsPage';
import TrainingAdminPage from './pages/admin/TrainingAdminPage';
import InventoryListPage from './pages/admin/InventoryListPage';
import SupplyRequestsAdminPage from './pages/admin/SupplyRequestsAdminPage';
import EmergencyReportsPage from './pages/admin/EmergencyReportsPage';
import FeedbackAdminPage from './pages/admin/FeedbackAdminPage';
import MapExplorerPage from './pages/admin/MapExplorerPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import ReportsCenterPage from './pages/admin/ReportsCenterPage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import SmsDispatchPage from './pages/admin/SmsDispatchPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

// Shared Pages
import SchedulePage from './pages/schedule/SchedulePage';

// Community (Public User) Pages
import CommunityPortalPage from './pages/community/CommunityPortalPage';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import MyTasksPage from './pages/volunteer/MyTasksPage';
import FieldDataFormPage from './pages/volunteer/FieldDataFormPage';
import MyTrainingPage from './pages/volunteer/MyTrainingPage';
import CourseDetailPage from './pages/volunteer/CourseDetailPage';
import QuizPage from './pages/volunteer/QuizPage';
import CertificateWalletPage from './pages/volunteer/CertificateWalletPage';
import VolunteerSupplyRequestsPage from './pages/volunteer/VolunteerSupplyRequestsPage';
import VolunteerProfilePage from './pages/volunteer/VolunteerProfilePage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleRaw = String(user?.role || '').toUpperCase().replace(/[\s-_]/g, '');
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map(r => String(r?.name || r).toUpperCase().replace(/[\s-_]/g, ''))
      : [];

    const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase().replace(/[\s-_]/g, ''));

    const hasRole = normalizedAllowed.some(allowed =>
      allowed === userRoleRaw ||
      userRoles.includes(allowed) ||
      (allowed === 'SUPERADMIN' && (userRoleRaw === 'SUPERADMIN' || userRoleRaw === 'SUPER_ADMIN')) ||
      (allowed === 'ADMIN' && (userRoleRaw === 'ADMIN' || userRoleRaw === 'OPERATIONAL' || userRoleRaw === 'SUPERADMIN')) ||
      (allowed === 'DATAANALYST' && (userRoleRaw === 'DATAANALYST' || userRoleRaw === 'DATA_ANALYST' || userRoleRaw === 'ANALYST')) ||
      (allowed === 'VOLUNTEER' && userRoleRaw === 'VOLUNTEER') ||
      (allowed === 'PUBLICUSER' && (userRoleRaw === 'PUBLICUSER' || userRoleRaw === 'PUBLIC'))
    );

    if (!hasRole) {
      if (userRoleRaw === 'PUBLICUSER' || userRoleRaw === 'PUBLIC') {
        return <Navigate to="/community/portal" replace />;
      }
      if (userRoleRaw === 'VOLUNTEER') {
        return <Navigate to="/volunteer/dashboard" replace />;
      }
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/public/campaigns" element={<PublicCampaignsPage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/emergency-report" element={<EmergencyReportPage />} />
      <Route path="/verify-certificate" element={<VerifyCertificatePage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterVolunteerPage />} />
      <Route path="/register-public" element={<RegisterPublicPage />} />

      {/* Admin / Operations / Analyst Protected App Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL', 'DATA_ANALYST']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="volunteers" element={<VolunteersListPage />} />
        <Route path="volunteers/:id" element={<VolunteerDetailPage />} />
        <Route path="campaigns" element={<CampaignsListPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="tasks" element={<TasksListPage />} />
        <Route path="schedules" element={<SchedulePage />} />
        <Route path="field-data" element={<FieldSubmissionsPage />} />
        <Route path="training" element={<TrainingAdminPage />} />
        <Route path="inventory" element={<InventoryListPage />} />
        <Route path="supply-requests" element={<SupplyRequestsAdminPage />} />
        <Route path="emergencies" element={<EmergencyReportsPage />} />
        <Route path="feedback" element={<FeedbackAdminPage />} />
        <Route path="map" element={<MapExplorerPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsCenterPage />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="sms" element={<SmsDispatchPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="settings" element={<AdminProfilePage />} />
      </Route>

      {/* Volunteer Protected App Layout */}
      <Route
        path="/volunteer"
        element={
          <ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN', 'SUPER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/volunteer/dashboard" replace />} />
        <Route path="dashboard" element={<VolunteerDashboard />} />
        <Route path="tasks" element={<MyTasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="field-data" element={<FieldDataFormPage />} />
        <Route path="training" element={<MyTrainingPage />} />
        <Route path="training/:courseId" element={<CourseDetailPage />} />
        <Route path="quiz/:courseId" element={<QuizPage />} />
        <Route path="certificates" element={<CertificateWalletPage />} />
        <Route path="supplies" element={<VolunteerSupplyRequestsPage />} />
        <Route path="profile" element={<VolunteerProfilePage />} />
      </Route>

      {/* Community (Public User) Protected App Layout */}
      <Route
        path="/community"
        element={
          <ProtectedRoute allowedRoles={['PUBLIC_USER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/community/portal" replace />} />
        <Route path="portal" element={<CommunityPortalPage />} />
        <Route path="campaigns" element={<PublicCampaignsPage />} />
        <Route path="emergencies" element={<EmergencyReportPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="verify" element={<VerifyCertificatePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
