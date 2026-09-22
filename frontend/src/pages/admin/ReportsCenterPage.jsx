import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { FileText, Download, Filter, FileSpreadsheet, Shield, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Select, Input } from '../../components/common/Input';
import api from '../../services/api';

export default function ReportsCenterPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [reportType, setReportType] = useState('volunteers');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'volunteers', label: t('reports.ds_volunteers') },
    { value: 'campaigns', label: t('reports.ds_campaigns') },
    { value: 'field-data', label: t('reports.ds_submissions') },
    { value: 'inventory', label: t('reports.ds_inventory') },
    { value: 'emergencies', label: t('reports.ds_emergencies') },
    { value: 'feedback', label: t('reports.ds_feedback') }
  ];

  const handleDownload = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('caafimaad_token');
      const query = new URLSearchParams({
        type: reportType,
        format,
        startDate,
        endDate
      }).toString();

      const response = await fetch(`/api/v1/reports/export?${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caafimaadhub-${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast(t('reports.csv_ok'), 'success');
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caafimaadhub-${reportType}-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        addToast(t('reports.json_ok'), 'success');
      }
    } catch (err) {
      addToast(err.message || t('reports.export_failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.reports')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('reports.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Export Configuration */}
        <div className="lg:col-span-2">
          <Card 
            title={t('reports.generator')} 
            subtitle={language === 'so' ? 'Dooro xuduudaha oo soo deji xogta' : 'Select parameters and download datasets'} 
            icon={FileSpreadsheet}
          >
            <div className="space-y-4">
              <Select
                label={t('reports.select_dataset')}
                name="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                options={reportTypes}
                required
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={t('reports.start_date')}
                  name="startDate"
                  type="date"
                  allowPast={true}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label={t('reports.end_date')}
                  name="endDate"
                  type="date"
                  allowPast={true}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <Select
                label={t('reports.format')}
                name="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                options={[
                  { value: 'csv', label: t('reports.fmt_csv') },
                  { value: 'json', label: t('reports.fmt_json') }
                ]}
                required
              />

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button onClick={handleDownload} loading={loading} size="lg" icon={Download}>
                  {t('reports.download')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Regulatory & Standards Info */}
        <div className="space-y-4">
          <Card title={t('reports.standards')} icon={Shield}>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>{t('reports.compliance')}</span>
              </div>
              <p className="leading-relaxed">
                {t('reports.disclaimer')}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
