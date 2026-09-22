import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOffline } from '../../contexts/OfflineContext';
import {
  LayoutGrid, Users, Megaphone, CheckSquare, ClipboardList, CalendarDays,
  GraduationCap, Package, MessageSquare, AlertTriangle, BarChart3,
  Map, Settings, Shield, ShieldCheck, ScrollText, Heart, X,
  Building2, KeyRound, ChevronsLeft, Send, User, Mail
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isSuperAdmin, isOperational, isAnalyst, isVolunteer } = useAuth();
  const { t, language } = useLanguage();
  const { isOnline } = useOffline();

  const { logout } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold shadow-lg shadow-sky-950/40 ring-1 ring-sky-300/30'
        : 'text-sky-100/80 hover:bg-sky-800/40 hover:text-white'
    }`;

  const mainMenuItems = [
    { to: '/admin/dashboard', icon: LayoutGrid, label: language === 'so' ? 'Dashboard-ka Guud' : 'Dashboard' },
    { to: '/admin/volunteers', icon: Users, label: language === 'so' ? 'Hawl-wadeennada (CHVs)' : 'Volunteers (CRM)' },
    { to: '/admin/campaigns', icon: Megaphone, label: language === 'so' ? 'Ololayaasha Caafimaadka' : 'Health Campaigns' },
    { to: '/admin/tasks', icon: CheckSquare, label: language === 'so' ? 'Hawlaha & Xilsaaridda' : 'Tasks & Assignments' },
    { to: '/admin/schedules', icon: CalendarDays, label: language === 'so' ? 'Jadwalka & Kalandarka' : 'Schedule & Calendar' },
    { to: '/admin/field-data', icon: ClipboardList, label: language === 'so' ? 'Xog-ururinta Goobta' : 'Field Data Collection' },
    { to: '/admin/training', icon: GraduationCap, label: language === 'so' ? 'Tababarka & Shahaadooyinka' : 'Training & Certificates' },
    { to: '/admin/inventory', icon: Package, label: language === 'so' ? 'Dawooyinka & Qalabka' : 'Supplies & Inventory' },
    { to: '/admin/supply-requests', icon: ShieldCheck, label: language === 'so' ? 'Dalabaadka Sahayda' : 'Supply Requests' },
    { to: '/admin/sms', icon: Send, label: language === 'so' ? 'Farriimaha SMS-ka' : 'SMS Broadcasts' },
    { to: '/admin/emergencies', icon: AlertTriangle, label: language === 'so' ? 'Digniinaha Cudurrada' : 'Outbreak Alerts' },
    { to: '/admin/feedback', icon: MessageSquare, label: language === 'so' ? 'Aragtiyaha Dadweynaha' : 'Community Feedback' },
    { to: '/admin/subscribers', icon: Mail, label: language === 'so' ? 'Is-qorashada Wararka' : 'Newsletter Subscribers' },
    { to: '/admin/map', icon: Map, label: language === 'so' ? 'Khariidadda GIS' : 'GIS Map Explorer' },
    { to: '/admin/analytics', icon: BarChart3, label: language === 'so' ? 'Warbixinada & Analytics' : 'Analytics & Reports' },
    { to: '/admin/reports', icon: ScrollText, label: language === 'so' ? 'Xarunta Warbixinta (DHIS2)' : 'Reports & Exports' },
  ];

  const operationalMenuItems = [
    { to: '/admin/dashboard', icon: LayoutGrid, label: language === 'so' ? 'Dashboard-ka Hawlgalka' : 'Operations Dashboard' },
    { to: '/admin/campaigns', icon: Megaphone, label: language === 'so' ? 'Ololayaasha Caafimaadka' : 'Health Campaigns' },
    { to: '/admin/tasks', icon: CheckSquare, label: language === 'so' ? 'Hawlaha & Xilsaaridda' : 'Tasks & Dispatch' },
    { to: '/admin/volunteers', icon: Users, label: language === 'so' ? 'Hawl-wadeennada (CHVs)' : 'Volunteers Roster' },
    { to: '/admin/schedules', icon: CalendarDays, label: language === 'so' ? 'Jadwalka Goobta' : 'Field Schedule' },
    { to: '/admin/field-data', icon: ClipboardList, label: language === 'so' ? 'Xog-ururinta Goobta' : 'Field Data Submissions' },
    { to: '/admin/sms', icon: Send, label: language === 'so' ? 'Farriimaha SMS-ka' : 'SMS Broadcasts' },
    { to: '/admin/inventory', icon: Package, label: language === 'so' ? 'Dawooyinka & Qalabka' : 'Supplies & Stock' },
    { to: '/admin/supply-requests', icon: ShieldCheck, label: language === 'so' ? 'Dalabaadka Sahayda' : 'Supply Orders' },
    { to: '/admin/emergencies', icon: AlertTriangle, label: language === 'so' ? 'Digniinaha Cudurrada' : 'Outbreak Alerts' },
    { to: '/admin/feedback', icon: MessageSquare, label: language === 'so' ? 'Aragtiyaha Dadweynaha' : 'Community Feedback' },
    { to: '/admin/map', icon: Map, label: language === 'so' ? 'Khariidadda GIS' : 'GIS Map Explorer' },
    { to: '/admin/reports', icon: ScrollText, label: language === 'so' ? 'Xarunta Warbixinta (DHIS2)' : 'Reports & Exports' },
    { to: '/admin/profile', icon: User, label: language === 'so' ? 'Xogtayda & Amniga' : 'My Profile & Security' },
  ];

  const analystMenuItems = [
    { to: '/admin/dashboard', icon: LayoutGrid, label: language === 'so' ? 'Dashboard-ka' : 'Dashboard' },
    { to: '/admin/analytics', icon: BarChart3, label: language === 'so' ? 'Warbixinada & Trends' : 'Analytics & Trends' },
    { to: '/admin/reports', icon: ScrollText, label: language === 'so' ? 'Xarunta Warbixinta (DHIS2)' : 'Reports & Exports' },
    { to: '/admin/field-data', icon: ClipboardList, label: language === 'so' ? 'Xogta Goobta' : 'Field Data Submissions' },
    { to: '/admin/campaigns', icon: Megaphone, label: language === 'so' ? 'Ololayaasha Caafimaadka' : 'Health Campaigns' },
    { to: '/admin/emergencies', icon: AlertTriangle, label: language === 'so' ? 'Digniinaha Cudurrada' : 'Disease Surveillance' },
    { to: '/admin/volunteers', icon: Users, label: language === 'so' ? 'Hawl-wadeennada' : 'Volunteers Directory' },
    { to: '/admin/map', icon: Map, label: language === 'so' ? 'Khariidadda GIS' : 'GIS Health Map' },
    { to: '/admin/feedback', icon: MessageSquare, label: language === 'so' ? 'Aragtiyaha Bulshada' : 'Community Feedback' },
    { to: '/admin/profile', icon: User, label: language === 'so' ? 'Xogtayda & Amniga' : 'My Profile & Security' },
  ];

  const volunteerMenuItems = [
    { to: '/volunteer/dashboard', icon: LayoutGrid, label: language === 'so' ? 'Dashboard-ka' : 'Dashboard' },
    { to: '/volunteer/tasks', icon: CheckSquare, label: language === 'so' ? 'Hawlahayga' : 'My Tasks' },
    { to: '/volunteer/schedule', icon: CalendarDays, label: language === 'so' ? 'Jadwalkayga' : 'My Schedule' },
    { to: '/volunteer/field-data', icon: ClipboardList, label: language === 'so' ? 'Geli Xogta Goobta' : 'Field Data Collection' },
    { to: '/volunteer/outbreak', icon: AlertTriangle, label: language === 'so' ? 'Digniin Cudur (Outbreak)' : 'Report Outbreak' },
    { to: '/volunteer/training', icon: GraduationCap, label: language === 'so' ? 'Tababarkayga' : 'My Training' },
    { to: '/volunteer/certificates', icon: Shield, label: language === 'so' ? 'Shahaadooyinkayga' : 'Certificates Wallet' },
    { to: '/volunteer/supplies', icon: Package, label: language === 'so' ? 'Dalbo Qalab / Dawo' : 'Supplies Request' },
    { to: '/volunteer/profile', icon: Settings, label: language === 'so' ? 'Xogtayda & Settings' : 'My Profile & Settings' },
  ];

  const publicMenuItems = [
    { to: '/community/portal', icon: LayoutGrid, label: language === 'so' ? 'Bogga Bulshada' : 'Community Portal' },
    { to: '/community/campaigns', icon: Megaphone, label: language === 'so' ? 'Ololayaasha Caafimaadka' : 'Health Campaigns' },
    { to: '/community/emergencies', icon: AlertTriangle, label: language === 'so' ? 'Gudbi Xaalad Deg-deg' : 'Report Emergency' },
    { to: '/community/feedback', icon: MessageSquare, label: language === 'so' ? 'Gudbi Fikrad' : 'Submit Feedback' },
    { to: '/community/verify', icon: ShieldCheck, label: language === 'so' ? 'Hubi Shahaado' : 'Verify Certificate' },
    { to: '/community/settings', icon: Settings, label: language === 'so' ? 'Xogtayda & Settings' : 'Profile & Settings' },
  ];

  const adminMenuItems = [
    { to: '/admin/users', icon: Users, label: language === 'so' ? 'Maamulka Isticmaalayaasha' : 'User Management' },
    { to: '/admin/audit-logs', icon: ScrollText, label: language === 'so' ? 'Diiwaanka Dhaqdhaqaaqa' : 'Audit Trail' },
    { to: '/admin/profile', icon: User, label: language === 'so' ? 'Xogtayda & Amniga' : 'My Profile & Security' },
  ];

  const displayName = user?.fullName || user?.full_name || user?.email?.split('@')[0] || 'User';
  const roleCode = (user?.role || (Array.isArray(user?.roles) ? user.roles[0] : '') || '').toUpperCase();
  const displayRole = (roleCode === 'SUPER_ADMIN' || roleCode === 'SUPERADMIN')
    ? (language === 'so' ? 'Super Maamule' : 'Super Administrator')
    : ((roleCode === 'ADMIN')
      ? (language === 'so' ? 'Maamule' : 'Administrator')
      : ((roleCode === 'OPERATIONAL')
        ? (language === 'so' ? 'Hawl-geliye Guud' : 'Operations Manager')
        : ((roleCode === 'DATA_ANALYST' || roleCode === 'DATAANALYST')
          ? (language === 'so' ? 'Falanqeeye Xogta' : 'Data Analyst')
          : ((roleCode === 'VOLUNTEER')
            ? (language === 'so' ? 'Hawl-wadeen Caafimaad' : 'Community Volunteer')
            : (language === 'so' ? 'Xubin Bulsho' : 'Community Member')))));
  const initial = displayName.charAt(0).toUpperCase();

  const activeMenuItems = (isSuperAdmin || (isAdmin && !isOperational && !isAnalyst))
    ? mainMenuItems
    : (isOperational
      ? operationalMenuItems
      : (isAnalyst
        ? analystMenuItems
        : (isVolunteer ? volunteerMenuItems : publicMenuItems)));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Aqua Blue (Biyo-Biyo) Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#0c4a6e] via-[#082f49] to-[#0a1e33] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out shrink-0 h-full border-r border-sky-900/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto select-none`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 shrink-0 border-b border-sky-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-950/40">
              <Heart className="w-5 h-5 fill-white text-sky-500" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">CaafimaadHub</h1>
              <p className="text-[10px] text-sky-300/80 font-medium tracking-wide">{isSuperAdmin ? 'Super Admin Panel' : t('login.tagline')}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 text-sky-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-none">
          {/* MAIN MENU */}
          <div>
            <p className="text-[10px] font-bold text-sky-300/60 uppercase tracking-wider px-3 mb-2">
              {t('nav_group.main_menu')}
            </p>
            <div className="space-y-1">
              {activeMenuItems.map((item, idx) => (
                <NavLink key={idx} to={item.to} className={navLinkClass} onClick={onClose}>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.08] group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
                    <item.icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* ADMINISTRATION (Super Admin Only) */}
          {isSuperAdmin && (
            <div>
              <p className="text-[10px] font-bold text-sky-300/60 uppercase tracking-wider px-3 mb-2">
                {t('nav_group.administration')}
              </p>
              <div className="space-y-1">
                {adminMenuItems.map((item, idx) => (
                  <NavLink key={idx} to={item.to} className={navLinkClass} onClick={onClose}>
                    <div className="w-8 h-8 rounded-lg bg-white/[0.08] group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors">
                      <item.icon className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3.5 border-t border-sky-900/60 shrink-0 bg-[#0a1e33]/80 space-y-2.5">
          <div className="flex items-center gap-3">
            {user?.avatarUrl || user?.avatar_url || user?.profile_image_url ? (
              <img
                src={user.avatarUrl || user.avatar_url || user.profile_image_url}
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-sky-400/40 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-sm font-extrabold text-white shadow-md ring-2 ring-sky-400/30 shrink-0">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-sky-300/80 truncate">{displayRole}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-sky-900/60 text-[11px] text-sky-200/80 px-1">
            <div className="flex items-center gap-2 font-semibold">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-amber-400'}`} />
              <span className={isOnline ? 'text-sky-300' : 'text-amber-300'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-[10px] text-sky-300/60 font-mono tracking-tight">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
