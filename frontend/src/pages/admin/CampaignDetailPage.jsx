import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Megaphone, Calendar, MapPin, Target, DollarSign, Users, ArrowLeft, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      if (res.success) {
        setCampaign(res.data);
      }
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

  if (!campaign) {
    return <div className="text-center py-20 text-slate-500">{t('camp_detail.not_found')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/campaigns')} icon={ArrowLeft}>
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{campaign.name}</h1>
          <p className="text-xs text-teal-700 dark:text-teal-400 font-mono">{campaign.code} • {campaign.type}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title={t('camp_detail.overview')} icon={Megaphone}>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('common.status')}:</span>
              <Badge status={campaign.status}>{campaign.status}</Badge>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('camp_detail.schedule')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {campaign.start_date} to {campaign.end_date}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('camp_detail.target_region')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {campaign.target_region || 'National'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{t('camp_detail.beneficiaries')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-slate-400" /> {campaign.target_beneficiaries?.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('camp_detail.budget')}</span>
              <span className="font-bold text-teal-800 dark:text-teal-300">
                ${campaign.budget?.toLocaleString() || '0'} USD
              </span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card title={t('camp_detail.objectives')} icon={Target}>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{campaign.description}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
