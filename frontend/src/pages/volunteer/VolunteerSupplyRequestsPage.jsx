import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { Truck, Plus, Package, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Select, Input, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { validateNumberOnly } from '../../utils/validation';

export default function VolunteerSupplyRequestsPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [form, setForm] = useState({
    item_id: '',
    quantity: '',
    reason: ''
  });

  useEffect(() => {
    fetchData(false);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [reqRes, itemsRes] = await Promise.all([
        api.get('/inventory/requests/me'),
        api.get('/inventory/items')
      ]);
      if (reqRes.success || Array.isArray(reqRes.data) || Array.isArray(reqRes)) {
        setRequests(reqRes.data || (Array.isArray(reqRes) ? reqRes : []));
      }
      if (itemsRes.success || Array.isArray(itemsRes.data) || Array.isArray(itemsRes)) {
        const itemList = itemsRes.data || (Array.isArray(itemsRes) ? itemsRes : []);
        setItems(itemList);
        if (itemList.length > 0) {
          setForm(prev => ({ ...prev, item_id: prev.item_id || itemList[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useAutoRefresh(fetchData, 12000, !isModalOpen);

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError('');

    const targetItemId = form.item_id || (items.length > 0 ? items[0].id : null);
    if (!targetItemId) {
      setModalError(language === 'so' ? 'Fadlan dooro qalabka ama dawada' : 'Please select an item');
      return;
    }

    const qtyCheck = validateNumberOnly(form.quantity, 'Tirada la rabo', language);
    if (!qtyCheck.isValid) {
      setModalError(qtyCheck.message);
      return;
    }

    if (!form.reason.trim()) {
      setModalError(language === 'so' ? 'Fadlan sharax sababta aad u codsanayso qalabkan' : 'Please provide a reason for this requisition');
      return;
    }

    setSubmitting(true);
    try {
      const qtyNum = parseInt(form.quantity, 10);
      await api.post('/inventory/requests', {
        item_id: targetItemId,
        itemId: targetItemId,
        quantity_requested: qtyNum,
        requestedQuantity: qtyNum,
        quantity: qtyNum,
        reason: form.reason
      });
      addToast(language === 'so' ? 'Codsigaaga qalabka waxaa loo diray bakhaarka caafimaadka degmada' : 'Your supply request has been submitted to the health depot.', 'success');
      setIsModalOpen(false);
      fetchData();
      setForm({
        item_id: items[0]?.id || '',
        quantity: '',
        reason: ''
      });
    } catch (err) {
      setModalError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.my_supplies')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'so'
              ? 'Codso qalab caafimaad, xirmooyinka ORS, qalabka baaritaanka, ama tallaalka goobaha fogfog'
              : 'Request medical supplies, ORS kits, diagnostic tools, or vaccines for remote sites'}
          </p>
        </div>
        <Button onClick={() => { setForm({ item_id: items[0]?.id || '', quantity: '', reason: '' }); setModalError(''); setIsModalOpen(true); }} icon={Plus}>
          {t('supplies.request_new')}
        </Button>
      </div>

      <div className="space-y-4 w-full">
        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{t('supplies.none')}</p>
              <p className="mt-1">{t('supplies.none_hint')}</p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{req.item_name}</h4>
                    <Badge status={req.status}>{t(`status.${req.status}`) || req.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                    {language === 'so' ? 'Tirada La Codsaday' : 'Qty Requested'}: <strong className="text-slate-900 dark:text-white">{req.quantity_requested}</strong> • {req.reason || (language === 'so' ? 'Bixinta goobta' : 'Field delivery')}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {language === 'so' ? 'La soo gudbiyay' : 'Submitted'}: {req.created_at ? new Date(req.created_at).toLocaleDateString() : (language === 'so' ? 'Dhawaan' : 'Recently')}
                  </span>
                  {req.status === 'ISSUED' && (
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {language === 'so' ? 'Diyaar u ah Qaadasho (Depot)' : 'Ready for Pickup (Depot)'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('supplies.request_title')}
        subtitle={t('supplies.subtitle')}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Select
            label={t('supplies.item')}
            name="item_id"
            value={form.item_id}
            onChange={(e) => setForm({ ...form, item_id: e.target.value })}
            options={items.map((i) => ({ value: i.id, label: `${i.item_code} - ${i.name} (${language === 'so' ? 'Kaydka' : 'Stock'}: ${i.quantity_on_hand})` }))}
            required
          />

          <Input
            label={t('supplies.quantity')}
            name="quantity"
            type="text"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="e.g. 25"
            validationType="number-only"
            required
            helperText={t('hints.digits_enter')}
          />

          <Textarea
            label={t('supplies.reason')}
            name="reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder={t('supplies.reason_ph')}
            rows={3}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('supplies.submit_request')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
