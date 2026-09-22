import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Send, PhoneCall, Radio, CheckCircle2, AlertCircle, Clock,
  Smartphone, Filter, ShieldAlert, Sparkles, MessageSquare,
  Users, Check, X, Shield, Settings2, Zap
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Card from '../../components/common/Card';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';


const QUICK_TEMPLATES = {
  so: [
    {
      label: 'Digniin Degdeg ah (Outbreak Alert)',
      text: 'DIGNIIN DEGDEG AH: Waxaa degmada laga helay calaamado cudurka Shuban Biyoodka (AWD). Dhammaan tabarucayaasha fadlan u diyaar-garooba gargaarka degdegga ah.'
    },
    {
      label: 'Wargelin Hawleed (Task Assignment)',
      text: 'Ogeysiis Hawleed: Waxaa laguu xilsaaray hawl cusub oo ah tallaalka carruurta. Fadlan ka fur app-ka CaafimaadHub si aad u bilowdo.'
    },
    {
      label: 'Ololaha Tallaalka (Immunization Kickoff)',
      text: 'Ololaha Tallaalka Qaran ee Carruurta ayaa bilaabanaya berri 8:00 Subaxnimo. Fadlan ka soo qaado xirmooyinka tallaalka xarunta ugu dhow.'
    },
    {
      label: 'Kulan Degdeg ah (Emergency Briefing)',
      text: 'Waxaa jiri doona kulan degdeg ah oo ku saabsan hawlgalada goobaha fogfog maanta 2:00 PM. Dhammaan kormeerayaasha iyo CHVs waa qasab.'
    }
  ],
  en: [
    {
      label: 'Urgent Outbreak Alert',
      text: 'URGENT ALERT: Suspected Acute Watery Diarrhea (AWD) cases identified in the district. All CHVs please prepare immediate oral rehydration response.'
    },
    {
      label: 'Task Assignment Notice',
      text: 'Operational Notice: You have been assigned a new field task. Please log into the CaafimaadHub mobile portal to begin data collection.'
    },
    {
      label: 'Immunization Campaign Kickoff',
      text: 'National Child Immunization Campaign kicks off tomorrow at 8:00 AM. Please collect cold chain kits and vaccine carriers from the district depot.'
    },
    {
      label: 'Emergency Volunteer Briefing',
      text: 'Emergency operational briefing scheduled for today at 2:00 PM regarding rapid field deployment. Attendance is required for all active CHVs.'
    }
  ]
};

export default function SmsDispatchPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, provider: 'HORMUUD', senderId: 'CaafimaadHub' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Compose modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeError, setComposeError] = useState('');
  const [composeForm, setComposeForm] = useState({
    audience: 'ALL_VOLUNTEERS',
    targetRegion: 'Banadir',
    customNumbers: '',
    senderId: 'CaafimaadHub',
    message: ''
  });

  // Gateway configuration state
  const [gatewayConfig, setGatewayConfig] = useState({
    provider: 'HORMUUD',
    senderId: 'CaafimaadHub',
    autoOutbreakAlert: true,
    autoLowStockAlert: true,
    autoTaskAssignAlert: true
  });
  const [savingGateway, setSavingGateway] = useState(false);

  // View Log Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const templates = QUICK_TEMPLATES[language] || QUICK_TEMPLATES.so;

  const fetchSmsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/notifications/sms-logs', { limit: 100 }).catch(() => ({ success: false, data: [] })),
        api.get('/notifications/sms-stats').catch(() => ({ success: false, data: null }))
      ]);

      if (logsRes && logsRes.data) {
        setLogs(logsRes.data || []);
      }
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
        if (statsRes.data.provider) {
          setGatewayConfig(prev => ({
            ...prev,
            provider: statsRes.data.provider,
            senderId: statsRes.data.senderId || 'CaafimaadHub'
          }));
        }
      }
    } catch (err) {
      if (!isSilent) console.error('Failed to load SMS data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmsData();
  }, [fetchSmsData]);

  // Silent auto refresh every 12 seconds
  useAutoRefresh(fetchSmsData, 12000);


  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setComposeError('');

    if (!composeForm.message || !composeForm.message.trim()) {
      setComposeError(language === 'so' ? 'Fadlan geli qoraalka fariinta SMS-ka' : 'Please enter the SMS message content');
      return;
    }

    if (composeForm.audience === 'CUSTOM' && !composeForm.customNumbers.trim()) {
      setComposeError(language === 'so' ? 'Fadlan geli ugu yaraan hal lambar telefoon' : 'Please enter at least one recipient phone number');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/notifications/sms-broadcast', composeForm);
      addToast(
        language === 'so'
          ? `Farriinta SMS-ka waxaa si guul leh loogu diray ${res.data?.dispatchedCount || 'dhammaan'} tabaruce.`
          : `SMS Broadcast successfully dispatched to ${res.data?.dispatchedCount || 'all'} recipients.`,
        'success'
      );
      setIsComposeOpen(false);
      setComposeForm({
        audience: 'ALL_VOLUNTEERS',
        targetRegion: 'Banadir',
        customNumbers: '',
        senderId: gatewayConfig.senderId || 'CaafimaadHub',
        message: ''
      });
      fetchSmsData();
    } catch (err) {
      setComposeError(err.message || (language === 'so' ? 'Dirista SMS-ka waa ay fashilantay' : 'Failed to dispatch SMS'));
    } finally {
      setSending(false);
    }
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setSavingGateway(true);
    try {
      await api.put('/settings', {
        sms_provider: gatewayConfig.provider,
        sms_sender_id: gatewayConfig.senderId,
        auto_outbreak_sms: gatewayConfig.autoOutbreakAlert ? 1 : 0,
        auto_low_stock_sms: gatewayConfig.autoLowStockAlert ? 1 : 0
      });
      addToast(
        language === 'so' ? 'Habaynta SMS Gateway-ga waa la keydiyay' : 'SMS Gateway settings updated successfully',
        'success'
      );
      fetchSmsData();
    } catch (err) {
      addToast(err.message || 'Failed to save gateway settings', 'error');
    } finally {
      setSavingGateway(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.recipient_phone && log.recipient_phone.toLowerCase().includes(q)) ||
      (log.message_body && log.message_body.toLowerCase().includes(q)) ||
      (log.provider && log.provider.toLowerCase().includes(q)) ||
      (log.status && log.status.toLowerCase().includes(q))
    );
  });

  const charCount = composeForm.message.length;
  const segments = Math.max(1, Math.ceil(charCount / 160));

  const columns = [
    {
      header: language === 'so' ? 'Telefoonka Qaataha' : 'Recipient Phone',
      accessor: 'recipient_phone',
      render: (row) => (
        <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white text-xs">
          <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{row.recipient_phone || '—'}</span>
        </div>
      )
    },
    {
      header: language === 'so' ? 'Farriinta SMS-ka' : 'Message Snippet',
      accessor: 'message_body',
      render: (row) => (
        <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md truncate" title={row.message_body}>
          {row.message_body}
        </p>
      )
    },
    {
      header: 'Gateway / Provider',
      accessor: 'provider',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          <Radio className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          {row.provider || 'HORMUUD'}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Xaaladda' : 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge status={row.status || 'SENT'}>
          {row.status || 'SENT'}
        </Badge>
      )
    },
    {
      header: language === 'so' ? 'Taariikhda' : 'Sent Date',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {row.created_at ? new Date(row.created_at).toLocaleString() : (language === 'so' ? 'Dhawaan' : 'Recently')}
        </span>
      )
    },
    {
      header: language === 'so' ? 'Faahfaahin' : 'Action',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedLog(row)}>
          {language === 'so' ? 'Fiiri' : 'View'}
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Send className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            <span>{language === 'so' ? 'Baahinta Farriimaha SMS-ka' : 'SMS Broadcast & Gateway'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so'
              ? 'U dir farriimo SMS ah tabarucayaasha goobaha fogfog, kormeerayaasha, iyo qoysaska adigoo adeegsanaya Telecommunications Gateways'
              : 'Direct SMS messaging dispatch and telecommunications gateway management for field volunteers and health workers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setComposeError(''); setIsComposeOpen(true); }}
            icon={Send}
            variant="primary"
            className="bg-teal-700 hover:bg-teal-800 text-white shadow-md font-bold"
          >
            {language === 'so' ? 'Dir Farriin SMS Cusub' : 'Compose & Send SMS'}
          </Button>
        </div>
      </div>

      {/* Stat Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard
          value={stats.total || logs.length}
          label={language === 'so' ? 'Wadarta Farriimaha La Diray' : 'Total SMS Dispatched'}
          icon={PhoneCall}
          color="teal"
          subtitle={language === 'so' ? 'Dhammaan farriimaha diiwaangashan' : 'All lifetime SMS dispatches'}
        />
        <StatCard
          value={stats.sent || logs.filter(l => l.status === 'SENT').length}
          label={language === 'so' ? 'Si Guul leh u Gaaray' : 'Delivered Successfully'}
          icon={CheckCircle2}
          color="emerald"
          subtitle={language === 'so' ? '99.4% Guusha dirista' : 'High delivery reliability'}
        />
        <StatCard
          value={gatewayConfig.provider || 'HORMUUD'}
          label={language === 'so' ? 'SMS Gateway-ga Shaqeynaya' : 'Active SMS Gateway'}
          icon={Radio}
          color="purple"
          subtitle={gatewayConfig.senderId ? `Header: ${gatewayConfig.senderId}` : 'MOH National Gateway'}
        />
        <StatCard
          value={stats.failed || logs.filter(l => l.status === 'FAILED').length}
          label={language === 'so' ? 'Farriimaha Fashilmay' : 'Failed Dispatches'}
          icon={AlertCircle}
          color="red"
          subtitle={language === 'so' ? 'Lambarada xiran ama khaldan' : 'Unreachable phone numbers'}
        />
      </div>

      {/* Gateway Settings & Quick Controls */}
      <div className="grid lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2">
          {/* Data Table */}
          <Card
            title={language === 'so' ? 'Diiwaanka Farriimihii La Diray (SMS Logs)' : 'SMS Dispatch History & Delivery Logs'}
            subtitle={language === 'so' ? `${filteredLogs.length} Farriimood oo la diray` : `Showing ${filteredLogs.length} recent messages`}
            icon={MessageSquare}
          >
            <DataTable
              columns={columns}
              data={filteredLogs}
              loading={loading}
              searchQuery={search}
              onSearchChange={setSearch}
              searchPlaceholder={language === 'so' ? 'Raadi lambar, farriin, ama provider...' : 'Search by phone, message, or gateway...'}
              emptyMessage={language === 'so' ? 'Weli ma jirto farriin SMS ah oo la diray' : 'No SMS messages dispatched yet'}
              emptySubtitle={language === 'so' ? 'Guji "Dir Farriin SMS Cusub" si aad u dirto farriintaadii ugu horeysay' : 'Click "Compose & Send SMS" to dispatch your first broadcast'}
            />
          </Card>
        </div>

        {/* Telecommunications Gateway Configuration Card */}
        <div className="space-y-4">
          <Card
            title={language === 'so' ? 'Habaynta SMS Gateway' : 'Telecommunications Gateway'}
            subtitle={language === 'so' ? 'Shirkadaha Isgaarsiinta & Xeerarka' : 'Provider routing and automation'}
            icon={Settings2}
          >
            <form onSubmit={handleSaveGateway} className="space-y-4 text-xs">
              <Select
                label={language === 'so' ? 'SMS Gateway Provider' : 'SMS Provider Gateway'}
                name="provider"
                value={gatewayConfig.provider}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
                options={[
                  { value: 'HORMUUD', label: 'Hormuud Telecom SMS API (Somalia)' },
                  { value: 'TELESOM', label: 'Telesom Bulk SMS Gateway (Somaliland)' },
                  { value: 'GOLIS', label: 'Golis Telecom SMS API (Puntland)' },
                  { value: 'AFRICASTALKING', label: "Africa's Talking Regional Gateway" },
                  { value: 'MOCK', label: 'Mock Gateway (Development Sandbox)' }
                ]}
              />

              <Input
                label={language === 'so' ? 'SMS Sender ID Header' : 'SMS Sender ID Header'}
                name="senderId"
                value={gatewayConfig.senderId}
                onChange={(e) => setGatewayConfig({ ...gatewayConfig, senderId: e.target.value })}
                placeholder="CaafimaadHub"
                validationType="text-only"
                helperText={language === 'so' ? 'Magaca ka muuqanaya taleefanka qaataha (max 11 chars)' : 'Alphanumeric sender ID on volunteer handsets'}
              />

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                  {language === 'so' ? 'Xeerarka Tooska ah (Automated Triggers)' : 'Automated SMS Dispatch Triggers'}
                </p>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatewayConfig.autoOutbreakAlert}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, autoOutbreakAlert: e.target.checked })}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {language === 'so' ? 'Digniinta Degdegga ah (Outbreak Alert)' : 'Emergency Outbreak Alerts'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {language === 'so' ? 'Toos ugu dir SMS tabarucayaasha marka cudur halis ah la helo' : 'Automatically alert field workers when AWD/Cholera outbreak is logged'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatewayConfig.autoLowStockAlert}
                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, autoLowStockAlert: e.target.checked })}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {language === 'so' ? 'Yaraanta Agabka (Low Stock Notice)' : 'Supply Shortage Notices'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {language === 'so' ? 'Digniin SMS ah u dir maamulaha haddii daawadu ka yaraato 10 xabo' : 'Dispatch warning to logistics officer on critical stock depletion'}
                    </span>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                loading={savingGateway}
                variant="primary"
                className="w-full font-bold"
              >
                {language === 'so' ? 'Keydi Habaynta Gateway-ga' : 'Save Gateway Settings'}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Compose & Broadcast Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title={language === 'so' ? 'Dir Farriin SMS ah (Compose & Dispatch)' : 'Compose & Broadcast SMS Message'}
        subtitle={language === 'so' ? 'U dir farriin toos ah tabarucayaasha ama dadweynaha' : 'Dispatch instant text messages to field workers via SMS gateway'}
        size="lg"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          {composeError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{composeError}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label={language === 'so' ? 'Kooxda Qaataha ah (Target Audience)' : 'Target Audience'}
              name="audience"
              value={composeForm.audience}
              onChange={(e) => setComposeForm({ ...composeForm, audience: e.target.value })}
              options={[
                { value: 'ALL_VOLUNTEERS', label: language === 'so' ? 'Dhammaan Tabarucayaasha Shaqeeya (All Active Volunteers)' : 'All Active Volunteers' },
                { value: 'REGION_VOLUNTEERS', label: language === 'so' ? 'Tabarucayaasha Gobolka (District/Region CHVs)' : 'District/Region Volunteers' },
                { value: 'ALL_STAFF', label: language === 'so' ? 'Dhammaan Shaqaalaha Hawlgalka (All Staff)' : 'All Operational Staff' },
                { value: 'CUSTOM', label: language === 'so' ? 'Lambarro Khaas ah (Custom Phone Numbers)' : 'Custom Phone Numbers' }
              ]}
              required
            />

            {composeForm.audience === 'REGION_VOLUNTEERS' ? (
              <Select
                label={language === 'so' ? 'Dooro Gobolka' : 'Select Target Region'}
                name="targetRegion"
                value={composeForm.targetRegion}
                onChange={(e) => setComposeForm({ ...composeForm, targetRegion: e.target.value })}
                options={[
                  { value: 'Banadir', label: 'Banaadir / Mogadishu' },
                  { value: 'Hiran', label: 'Hiiraan / Beledweyne' },
                  { value: 'Bay', label: 'Baay / Baidoa' },
                  { value: 'Gedo', label: 'Gedo / Garbaharey' },
                  { value: 'Bari', label: 'Bari / Bosaso' },
                  { value: 'Mudug', label: 'Mudug / Galkacyo' }
                ]}
              />
            ) : (
              <Input
                label={language === 'so' ? 'Sender ID Header' : 'Sender ID Header'}
                name="senderId"
                value={composeForm.senderId}
                onChange={(e) => setComposeForm({ ...composeForm, senderId: e.target.value })}
                placeholder="CaafimaadHub"
                validationType="text-only"
              />
            )}
          </div>

          {composeForm.audience === 'CUSTOM' && (
            <Textarea
              label={language === 'so' ? 'Lambarada Telefoonka (Kala saar jajab ama comma)' : 'Recipient Phone Numbers (comma or newline separated)'}
              name="customNumbers"
              value={composeForm.customNumbers}
              onChange={(e) => setComposeForm({ ...composeForm, customNumbers: e.target.value })}
              placeholder="+252615551234, +252615555678, +252625559012"
              rows={2}
              required
            />
          )}

          {/* Quick Pre-made Templates */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'so' ? 'Farriimo Diyaar ah (Quick Templates):' : 'Quick Templates:'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setComposeForm({ ...composeForm, message: tpl.text })}
                  className="p-2 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all text-xs cursor-pointer group"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300 block truncate">
                    {tpl.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {tpl.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea with Live Counter */}
          <div>
            <Textarea
              label={language === 'so' ? 'Qoraalka Farriinta SMS-ka' : 'SMS Message Body'}
              name="message"
              value={composeForm.message}
              onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
              placeholder={language === 'so' ? 'Halkaan ku qor fariinta aad rabto inaad u dirto...' : 'Type the message to broadcast to field workers...'}
              rows={4}
              required
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 px-1">
              <span>
                {language === 'so' ? 'Dhererka qoraalka:' : 'Length:'}{' '}
                <strong className={charCount > 160 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}>
                  {charCount}
                </strong>{' '}
                / 160 {language === 'so' ? 'xaraf' : 'chars'}
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800/60">
                {segments} {segments === 1 ? 'SMS Segment' : 'SMS Segments'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsComposeOpen(false)}
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              loading={sending}
              variant="primary"
              icon={Send}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 shadow-md"
            >
              {language === 'so' ? 'Dir SMS-ka Hada' : 'Dispatch SMS Now'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={language === 'so' ? 'Faahfaahinta Farriinta SMS-ka' : 'SMS Dispatch Details'}
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Telefoonka Qaataha:' : 'Recipient:'}</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedLog.recipient_phone}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Gateway Provider:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.provider || 'HORMUUD'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Xaaladda Gaarsiinta:' : 'Delivery Status:'}</span>
                <Badge status={selectedLog.status}>{selectedLog.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">{language === 'so' ? 'Waqtiga La Diray:' : 'Timestamp:'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {language === 'so' ? 'Qoraalka Buuxa ee Farriinta:' : 'Full Message Body:'}
              </label>
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                {selectedLog.message_body}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)} variant="outline">
                {language === 'so' ? 'Xir' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
