import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Award, Download, Printer, CheckCircle2, Shield, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../services/api';

export default function CertificateWalletPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/training/certificates/me');
      if (res.success) {
        setCertificates(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Award className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.certificates')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official accredited digital qualifications issued by the Federal Ministry of Health Somalia
          </p>
        </div>
        {certificates.length > 0 && (
          <Button variant="outline" onClick={handlePrint} icon={Printer}>
            {t('cert_wallet.print')}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6 w-full">
          {[1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/50 dark:border-slate-800 shadow-xl p-8 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
            {t('cert_wallet.no_certificates') || (language === 'so' ? 'Wali shahaado kuguma jirto' : 'No certificates yet')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {t('cert_wallet.no_certificates_desc') || (language === 'so'
              ? 'Marka aad dhammayso tababar oo aad gudbo imtixaanka, shahaadadaada halkan ayay ka soo muuqan doontaa.'
              : 'Once you complete a training course and pass the assessment, your certificates will appear here.')}
          </p>
        </div>
      ) : (
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-teal-800/20 dark:border-teal-700/40 shadow-xl p-8 relative overflow-hidden bg-gradient-to-br from-teal-50/40 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30 flex flex-col justify-between"
          >
            {/* Seal watermark */}
            <div className="absolute right-4 bottom-4 opacity-5 dark:opacity-10 pointer-events-none">
              <Shield className="w-64 h-64 text-teal-950 dark:text-teal-400" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-teal-900/10 dark:border-teal-700/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-800 dark:bg-teal-700 flex items-center justify-center text-white shadow-md">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm tracking-wide uppercase">
                      {t('cert_wallet.ministry')}
                    </h3>
                    <p className="text-[10px] text-teal-800 dark:text-teal-300 font-semibold">
                      {t('cert_wallet.board')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase">{t('cert_wallet.cert_id')}</span>
                  <span className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                    {cert.certificate_number}
                  </span>
                </div>
              </div>

              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">{t('cert_wallet.certify_that')}</p>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-serif">
                  {cert.volunteer_name || user?.fullName || user?.full_name || 'Volunteer'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                  has demonstrated verified competency and successfully completed all required modules and assessments in:
                </p>
                <h4 className="text-base font-bold text-teal-800 dark:text-teal-300 py-1">
                  {cert.course_title}
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  Competency Score: {cert.score_achieved}% (Honor Distinction)
                </p>
              </div>

              <div className="flex items-end justify-between pt-4 border-t border-teal-900/10 dark:border-teal-700/30 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{t('cert_wallet.issue_date')}</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {cert.issue_date}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{t('cert_wallet.verify_code') || 'Verification Code'}</p>
                  <span className="font-mono text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/60 px-2 py-0.5 rounded tracking-widest">
                    {cert.verification_code}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 dark:border-slate-600 pb-1 mb-1 italic text-slate-600 dark:text-slate-300 font-serif text-[11px]">
                    {cert.issuer_name || 'Super Administrator'}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold">{t('cert_wallet.director')}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
