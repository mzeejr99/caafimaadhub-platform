import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import {
  Heart, Mail, Lock, ArrowRight, Users, Shield, User,
  AlertCircle, Globe, Sun, Moon, CheckCircle2, ClipboardList,
  BarChart3, ShieldCheck, MapPin, Building, Eye, EyeOff,
  Sparkles, KeyRound, Smartphone, Radio, Activity, ChevronDown, Check
} from 'lucide-react';

export default function LoginPage() {
  const { login, user: authUser, isAuthenticated } = useAuth();
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);

  // Auto-redirect if already logged in (Stay Logged In)
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const roleUpper = String(authUser.role || '').toUpperCase().replace(/[\s-_]/g, '');
      if (roleUpper === 'PUBLICUSER' || roleUpper === 'PUBLIC') {
        navigate('/community/portal', { replace: true });
      } else if (roleUpper === 'VOLUNTEER') {
        navigate('/volunteer/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, authUser, navigate]);

  const [publicStats, setPublicStats] = useState({
    totalVolunteers: 10,
    activeCampaigns: 4,
    totalFieldSubmissions: 5,
    totalRegions: 18
  });

  const isSomali = language === 'so';

  useEffect(() => {
    api.get('/analytics/public')
      .then(d => {
        if (d && d.success && d.data) {
          setPublicStats({
            totalVolunteers: d.data.totalVolunteers || 10,
            activeCampaigns: d.data.activeCampaigns || 4,
            totalFieldSubmissions: d.data.totalFieldSubmissions || 5,
            totalRegions: d.data.totalRegions || 18
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    const identifier = (emailOrPhone || '').trim();
    if (!identifier || !password || password.trim() === '') {
      setError(isSomali ? 'Fadlan geli email-kaaga ama taleefankaaga iyo furaha sirta ah' : 'Please enter your email or phone and password');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === 'PUBLIC_USER' || user.role === 'Public') {
        navigate('/community/portal');
      } else if (user.role === 'VOLUNTEER' || user.role === 'Volunteer') {
        navigate('/volunteer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        (isSomali ? 'Email-ka/Telefoonka ama furaha sirta ah waa khalad. Fadlan hubi xogtaada.' : 'Invalid email/phone or password credentials. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      
      {/* Top Header Row with Logo & Controls */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between z-20 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-white/20 stroke-white stroke-2" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-1">
              Caafimaad<span className="text-emerald-700 dark:text-emerald-400">Hub</span>
            </span>
            <span className="hidden sm:block text-[10px] font-semibold text-slate-500 dark:text-slate-400 -mt-0.5">
              {isSomali ? 'Madasha Iskaashiga Caafimaadka Bulshada' : 'Community Health Volunteer Coordination'}
            </span>
          </div>
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{isSomali ? 'SO' : 'EN'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => { setLanguage('so'); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSomali ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Af-Soomaali</span>
                  {isSomali && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                    !isSomali ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>English</span>
                  {!isSomali && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 shadow-xs transition-colors cursor-pointer"
            title={isSomali ? 'Beddel Theme-ka' : 'Toggle Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Two-Column Container */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-4">
        
        {/* Left Side: Brand Showcase & Verified Platform Credentials */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{isSomali ? 'Wasaaradda Caafimaadka & Daryeelka Bulshada' : 'Federal Ministry of Health Somalia'}</span>
          </div>

          {/* Headlines */}
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-950 dark:text-white tracking-tight leading-[1.15]">
              {isSomali ? 'Awood-siinta Bulshada,' : 'Empowering Frontline Teams,'}<br />
              <span className="text-emerald-700 dark:text-emerald-400">
                {isSomali ? 'Badbaadinta Nolosha.' : 'Saving Lives Together.'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 max-w-lg leading-relaxed font-normal">
              {isSomali
                ? 'Ku soo dhawoow albaabka rasmiga ah ee nidaamka CaafimaadHub. Ka gal akoonkaaga si aad u maareyso hawlaha caafimaadka, xog-ururinta goobta, iyo qaybinta sahayda.'
                : 'Welcome to the official CaafimaadHub operations gateway. Sign in to coordinate field health outreach, clinical surveillance, logistics, and certified volunteer assignments.'}
            </p>
          </div>

          {/* 4 Professional Capability Pillars */}
          <div className="grid grid-cols-2 gap-3.5 max-w-lg pt-1">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isSomali ? 'Offline First' : 'Offline Ready'}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isSomali ? 'Xog-ururin bilaa internet' : 'Zero data loss sync'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isSomali ? 'Digniino Toos ah' : 'Live Alerts'}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isSomali ? 'SMS & Cudurrada degdegga' : 'Instant outbreak SMS'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isSomali ? 'Analytics & BI' : 'Real-time BI'}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isSomali ? 'Warbixino Muuqaal ah' : 'Visual dashboards'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{isSomali ? 'Amaan & Sugan' : 'Enterprise'}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isSomali ? 'RBAC & SSL 256-bit' : 'Role-based access'}</p>
              </div>
            </div>
          </div>

          {/* Live Platform Stats Card */}
          <div className="rounded-2xl bg-[#083a2d] p-5 text-white shadow-xl max-w-lg border border-emerald-600/30">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <span className="font-bold text-emerald-200">{isSomali ? 'Xogta Tooska ah ee Nidaamka' : 'Live Platform Coverage'}</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{isSomali ? 'Xaqiiqo' : 'Verified'}</span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-3 text-left">
              <div>
                <p className="text-lg font-black text-white">{publicStats.totalVolunteers}</p>
                <p className="text-[10px] text-emerald-200/90 font-medium">{isSomali ? 'Volunteers' : 'CHVs'}</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">{publicStats.activeCampaigns}</p>
                <p className="text-[10px] text-emerald-200/90 font-medium">{isSomali ? 'Kampaaniyo' : 'Campaigns'}</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">{publicStats.totalFieldSubmissions}</p>
                <p className="text-[10px] text-emerald-200/90 font-medium">{isSomali ? 'Warbixinno' : 'Submissions'}</p>
              </div>
              <div>
                <p className="text-lg font-black text-white">{publicStats.totalRegions}</p>
                <p className="text-[10px] text-emerald-200/90 font-medium">{isSomali ? 'Gobolada' : 'Regions'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: High-End Sign In Card */}
        <div className="lg:col-span-6 flex justify-center w-full">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-5 sm:p-8 md:p-9 border border-slate-200/90 dark:border-slate-800 w-full max-w-lg transition-colors">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5 shadow-xs border border-emerald-100 dark:border-emerald-900/60">
                <KeyRound className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                {isSomali ? 'Ku Soo Dhawoow!' : 'Welcome Back!'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {isSomali ? 'Geli iimaylkaaga iyo password-kaaga si aad u gasho' : 'Enter your email and password to sign in'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email or Phone Floating Outlined Input (Matching Image 3 & 4) */}
              <div>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  emailFocused
                    ? 'border-emerald-700 dark:border-emerald-400 ring-2 ring-emerald-600/20 bg-white dark:bg-slate-900'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
                }`}>
                  <label
                    htmlFor="login_identifier"
                    className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
                      emailFocused || (emailOrPhone && emailOrPhone.trim() !== '')
                        ? '-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] font-bold tracking-wider leading-none text-emerald-700 dark:text-emerald-400'
                        : 'top-1/2 -translate-y-1/2 left-3.5 text-sm font-normal text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {isSomali ? 'Email ama Telefoon' : 'Email or phone'}
                  </label>
                  <input
                    id="login_identifier"
                    type="text"
                    required
                    value={emailOrPhone}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    autoComplete="username"
                    className="w-full py-3.5 px-3.5 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="mt-1.5 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setError(isSomali ? 'Fadlan la xiriir Maamulaha Sare: admin@caafimaadhub.so' : 'Please contact System Administrator at admin@caafimaadhub.so')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isSomali ? 'Ma ilowday email-ka?' : 'Forgot email?'}
                  </button>
                </div>
              </div>

              {/* Password Floating Outlined Input (Matching Image 3 & 4) */}
              <div>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  pwdFocused
                    ? 'border-emerald-700 dark:border-emerald-400 ring-2 ring-emerald-600/20 bg-white dark:bg-slate-900'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
                }`}>
                  <label
                    htmlFor="login_password"
                    className={`absolute pointer-events-none transition-all duration-150 select-none z-10 ${
                      pwdFocused || (password && password.trim() !== '')
                        ? '-top-2.5 left-3 px-1.5 rounded-md bg-white dark:bg-slate-900 text-[11px] font-bold tracking-wider leading-none text-emerald-700 dark:text-emerald-400'
                        : 'top-1/2 -translate-y-1/2 left-3.5 text-sm font-normal text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {isSomali ? 'Furaha sirta ah' : 'Password'}
                  </label>
                  <input
                    id="login_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setPwdFocused(true)}
                    onBlur={() => setPwdFocused(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full py-3.5 pl-3.5 pr-11 text-sm bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-1.5 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setError(isSomali ? 'Fadlan la xiriir Maamulaha Sare: admin@caafimaadhub.so' : 'Please contact System Administrator at admin@caafimaadhub.so')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isSomali ? 'Ma ilowday furaha?' : 'Forgot password?'}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>{isSomali ? 'I xasuusnoow qalabkan' : 'Remember me on this device'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#0a382c] hover:bg-[#072a21] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-950/15 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>{isSomali ? 'Gelitaanka ayaa socda...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isSomali ? 'Gal Nidaamka' : 'Sign In to Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registration Options Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSomali ? 'Ma doonaysaa inaad tabarruc bixiso?' : 'Want to join as a health volunteer?'}{' '}
                <Link to="/register" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                  {isSomali ? 'Noqo Volunteer' : 'Register as Volunteer'}
                </Link>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSomali ? 'Xubin ka tirsan bulshada?' : 'Community member or citizen?'}{' '}
                <Link to="/register-public" className="text-blue-700 dark:text-blue-400 font-bold hover:underline">
                  {isSomali ? 'Isku Diiwaangeli Shacab' : 'Register as Public User'}
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Footer Note */}
      <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        <span>{isSomali ? 'Nidaam sugan oo ku dhisan shuruucda caafimaadka heer qaran' : '256-Bit SSL Encrypted • Federal Ministry of Health Compliant'}</span>
      </div>

    </div>
  );
}
