import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Package, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, Truck, AlertCircle, Edit, Trash2, BoxesIcon, Layers } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import api from '../../services/api';
import { validateTextOnly, validateNumberOnly, validateFutureOrTodayDate } from '../../utils/validation';
import { enumLabel } from '../../i18n/enums';

export default function InventoryListPage() {
  const { t, language } = useLanguage();
  const { addToast } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Forms
  const [itemForm, setItemForm] = useState({
    item_code: '',
    name: '',
    category: '',
    description: '',
    unit_of_measure: '',
    quantity_on_hand: '',
    minimum_stock_level: '10',
    batch_number: '',
    expiry_date: ''
  });

  const [stockForm, setStockForm] = useState({
    movement_type: '',
    quantity: '',
    reason: '',
    batch_number: '',
    recipient_type: '',
    recipient_id: ''
  });

  const [movementForm, setMovementForm] = useState({
    item_id: '',
    transactionType: '',
    quantity: '',
    referenceNumber: '',
    notes: ''
  });

  const categories = [
    { value: 'VACCINES', label: t('inv_admin.cat_vaccines') },
    { value: 'PPE', label: t('inv_admin.cat_ppe') },
    { value: 'MEDICINES', label: t('inv_admin.cat_medicines') },
    { value: 'DIAGNOSTICS', label: t('inv_admin.cat_tests') },
    { value: 'EQUIPMENT', label: t('inv_admin.cat_coldchain') },
    { value: 'SUPPLIES', label: t('inv_admin.cat_general') }
  ];

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/items', {
        category: categoryFilter || undefined,
        search: search || undefined
      });
      if (res.success) {
        setItems(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // CREATE Item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!itemForm.name || !itemForm.name.trim()) {
      setModalError(language === 'so' ? 'Magaca shayga caafimaadka waa qasab' : 'Item name is required');
      return;
    }

    if (!itemForm.category) {
      setModalError(language === 'so' ? 'Qeybta shayga (Category) waa qasab' : 'Category is required');
      return;
    }

    if (!itemForm.unit_of_measure || !itemForm.unit_of_measure.trim()) {
      setModalError(language === 'so' ? 'Qiyaasta (Unit of measure) waa qasab' : 'Unit of measure is required');
      return;
    }

    const qtyCheck = validateNumberOnly(itemForm.quantity_on_hand, 'Tirada bilowga (Initial Quantity)', language);
    if (!qtyCheck.isValid) { setModalError(qtyCheck.message); return; }

    const alertCheck = validateNumberOnly(itemForm.minimum_stock_level, 'Heerka digniinta (Minimum Alert Level)', language);
    if (!alertCheck.isValid) { setModalError(alertCheck.message); return; }

    if (itemForm.expiry_date) {
      const expCheck = validateFutureOrTodayDate(itemForm.expiry_date, 'Taariikhda dhicitaanka (Expiry Date)', language);
      if (!expCheck.isValid) { setModalError(expCheck.message); return; }
    }

    setFormLoading(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        itemCode: itemForm.item_code?.trim() || undefined,
        category: itemForm.category,
        unitOfMeasure: itemForm.unit_of_measure.trim(),
        quantityOnHand: parseInt(itemForm.quantity_on_hand, 10),
        minimumStockLevel: parseInt(itemForm.minimum_stock_level, 10),
        batchNumber: itemForm.batch_number?.trim() || null,
        expiryDate: itemForm.expiry_date || null
      };
      await api.post('/inventory/items', payload);
      addToast(t('inv_admin.created'), 'success');
      setIsItemModalOpen(false);
      fetchItems();
      setItemForm({
        item_code: '', name: '', category: 'VACCINES', description: '',
        unit_of_measure: 'VIALS', quantity_on_hand: '', minimum_stock_level: '10',
        batch_number: '', expiry_date: ''
      });
      setSubmitted(false);
    } catch (err) {
      setModalError(err.message || t('inv_admin.create_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // EDIT Item
  const openEditModal = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setItemForm({
      item_code: item.item_code || '',
      name: item.name || '',
      category: item.category || 'VACCINES',
      unit_of_measure: item.unit_of_measure || 'VIALS',
      minimum_stock_level: String(item.minimum_stock_level ?? '10'),
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : ''
    });
    setModalError('');
    setSubmitted(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    if (!itemForm.name || !itemForm.name.trim()) {
      setModalError(language === 'so' ? 'Magaca shayga caafimaadka waa qasab' : 'Item name is required');
      return;
    }

    if (!itemForm.unit_of_measure || !itemForm.unit_of_measure.trim()) {
      setModalError(language === 'so' ? 'Qiyaasta (Unit of measure) waa qasab' : 'Unit of measure is required');
      return;
    }

    const alertCheck = validateNumberOnly(itemForm.minimum_stock_level, 'Heerka digniinta (Minimum Alert Level)', language);
    if (!alertCheck.isValid) { setModalError(alertCheck.message); return; }

    if (itemForm.expiry_date) {
      const expCheck = validateFutureOrTodayDate(itemForm.expiry_date, 'Taariikhda dhicitaanka (Expiry Date)', language);
      if (!expCheck.isValid) { setModalError(expCheck.message); return; }
    }

    setFormLoading(true);
    try {
      await api.put(`/inventory/items/${selectedItem.id}`, {
        name: itemForm.name.trim(),
        category: itemForm.category,
        unitOfMeasure: itemForm.unit_of_measure.trim(),
        minimumStockLevel: parseInt(itemForm.minimum_stock_level, 10),
        batchNumber: itemForm.batch_number?.trim() || null,
        expiryDate: itemForm.expiry_date || null
      });
      addToast(t('inv_admin.updated'), 'success');
      setIsEditModalOpen(false);
      fetchItems();
    } catch (err) {
      setModalError(err.message || t('inv_admin.update_failed'));
    } finally {
      setFormLoading(false);
    }
  };

  // DELETE Item
  const openDeleteModal = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setFormLoading(true);
    try {
      await api.delete(`/inventory/items/${selectedItem.id}`);
      addToast(`Item "${selectedItem.name}" deleted successfully from MySQL`, 'success');
      setIsDeleteModalOpen(false);
      fetchItems();
    } catch (err) {
      addToast(err.message || t('inv_admin.delete_failed'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // STOCK MOVEMENT
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setModalError('');

    const qtyCheck = validateNumberOnly(movementForm.quantity, 'Quantity', language);
    if (!qtyCheck.isValid) {
      setModalError(qtyCheck.message);
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        itemId: movementForm.item_id,
        transactionType: movementForm.transactionType,
        quantity: parseInt(movementForm.quantity, 10),
        referenceNumber: movementForm.referenceNumber || 'MANUAL-ADJUSTMENT',
        notes: movementForm.notes || 'Stock adjustment recorded by Admin'
      };
      await api.post('/inventory/transactions', payload);
      addToast('Stock movement recorded successfully in MySQL', 'success');
      setIsMovementModalOpen(false);
      fetchItems();
    } catch (err) {
      setModalError(err.message || 'Failed to record movement');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: language === 'so' ? 'Koodhka' : 'Item Code',
      accessor: 'item_code',
      render: (row) => <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400">{row.item_code}</span>
    },
    {
      header: language === 'so' ? 'Magaca & Qeybta' : 'Item Name & Category',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">{enumLabel(t, row.category)}</p>
        </div>
      )
    },
    {
      header: t('inv_admin.col_stock'),
      render: (row) => {
        const isLow = row.quantity_on_hand <= row.minimum_stock_level;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-sm ${isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
              {row.quantity_on_hand} {row.unit_of_measure}
            </span>
            {isLow && (
              <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {t('inv_admin.low_badge')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: t('inv_admin.col_min'),
      render: (row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.minimum_stock_level} {row.unit_of_measure}</span>
    },
    {
      header: t('inv_admin.col_batch'),
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.batch_number ? `Batch: ${row.batch_number}` : 'N/A'} • {row.expiry_date?.split('T')[0] || 'No Expiry'}
        </span>
      )
    },
    {
      header: t('common.actions'),
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setModalError('');
              setMovementForm({ item_id: row.id, transactionType: 'STOCK_IN', quantity: '', referenceNumber: '', notes: '' });
              setIsMovementModalOpen(true);
            }}
          >
            {t('inv_admin.adjust')}
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => openEditModal(row, e)} icon={Edit}>
            {t('common.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => openDeleteModal(row, e)} icon={Trash2}>
            {t('common.delete')}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="w-7 h-7 text-teal-700 dark:text-teal-400" /> {t('nav.inventory')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('inv_admin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setModalError(''); setSubmitted(false); setIsItemModalOpen(true); }} icon={Plus}>
            {t('inv_admin.add')}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={items.length} label={t('inv_admin.total_items')} icon={Package} color="teal" subtitle={t('inv_admin.sub_total')} />
        <StatCard value={items.filter(i => Number(i.quantity_on_hand) <= Number(i.minimum_stock_level) && Number(i.quantity_on_hand) > 0).length} label={t('inv_admin.low_stock')} icon={AlertTriangle} color="amber" subtitle={t('inv_admin.sub_low')} />
        <StatCard value={items.filter(i => Number(i.quantity_on_hand) === 0).length} label={t('inv_admin.out_stock')} icon={AlertCircle} color="red" subtitle={t('inv_admin.sub_out')} />
        <StatCard value={[...new Set(items.map(i => i.category))].length} label={t('inv_admin.categories')} icon={Layers} color="blue" subtitle={t('inv_admin.sub_categories')} />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search item name or code..."
        filterComponent={
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="" className="dark:bg-slate-800">{t('inv_admin.all_categories')}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value} className="dark:bg-slate-800">{c.label}</option>
            ))}
          </select>
        }
        actions={<Button size="sm" variant="outline" onClick={fetchItems}>{t('common.search')}</Button>}
      />

      {/* CREATE ITEM MODAL */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={t('inv_admin.register_title')} size="lg">
        <form noValidate onSubmit={handleCreateItem} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={t('inv_admin.item_name')}
                name="name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder={t('inv_admin.item_name_ph')}
                required
                submitted={submitted}
              />
            </div>
            <Input
              label={t('inv_admin.item_code')}
              name="item_code"
              value={itemForm.item_code}
              onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })}
              placeholder={t('inv_admin.item_code_ph')}
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('inv_admin.category_label')}
              name="category"
              value={itemForm.category}
              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              options={categories}
              required
              submitted={submitted}
            />
            <Input
              label={t('inv_admin.unit')}
              name="unit_of_measure"
              value={itemForm.unit_of_measure}
              onChange={(e) => setItemForm({ ...itemForm, unit_of_measure: e.target.value })}
              placeholder={t('inv_admin.unit_ph')}
              required
              submitted={submitted}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('inv_admin.initial_qty')}
              name="quantity_on_hand"
              value={itemForm.quantity_on_hand}
              onChange={(e) => setItemForm({ ...itemForm, quantity_on_hand: e.target.value })}
              placeholder="0"
              validationType="number-only"
              required
              submitted={submitted}
              helperText={t('hints.digits')}
            />
            <Input
              label={t('inv_admin.min_alert')}
              name="minimum_stock_level"
              value={itemForm.minimum_stock_level}
              onChange={(e) => setItemForm({ ...itemForm, minimum_stock_level: e.target.value })}
              placeholder="10"
              validationType="number-only"
              required
              submitted={submitted}
              helperText={t('hints.digits')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('inv_admin.batch')}
              name="batch_number"
              value={itemForm.batch_number}
              onChange={(e) => setItemForm({ ...itemForm, batch_number: e.target.value })}
              placeholder={t('inv_admin.batch_ph')}
              submitted={submitted}
            />
            <Input
              label={t('inv_admin.expiry')}
              name="expiry_date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={itemForm.expiry_date}
              onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
              submitted={submitted}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsItemModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('inv_admin.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Item: ${selectedItem?.name}`} size="lg">
        <form noValidate onSubmit={handleUpdateItem} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Input
            label={t('inv_admin.item_name')}
            name="name"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            required
            submitted={submitted}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('inv_admin.category_label')}
              name="category"
              value={itemForm.category}
              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              options={categories}
              required
              submitted={submitted}
            />
            <Input
              label={t('inv_admin.min_alert_short')}
              name="minimum_stock_level"
              value={itemForm.minimum_stock_level}
              onChange={(e) => setItemForm({ ...itemForm, minimum_stock_level: e.target.value })}
              validationType="number-only"
              required
              submitted={submitted}
              helperText={t('hints.digits')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('inv_admin.update')}</Button>
          </div>
        </form>
      </Modal>

      {/* ADJUST STOCK MODAL */}
      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title={t('inv_admin.movement_title')}>
        <form noValidate onSubmit={handleRecordMovement} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <Select
            label={t('inv_admin.movement_type')}
            name="transactionType"
            value={movementForm.transactionType}
            onChange={(e) => setMovementForm({ ...movementForm, transactionType: e.target.value })}
            options={[
              { value: 'STOCK_IN', label: t('inv_admin.mv_in') },
              { value: 'STOCK_OUT', label: t('inv_admin.mv_out') },
              { value: 'ADJUSTMENT', label: t('inv_admin.mv_adjust') },
              { value: 'RETURN', label: t('inv_admin.mv_return') }
            ]}
            required
            submitted={submitted}
          />

          <Input
            label={t('inv_admin.quantity')}
            name="quantity"
            value={movementForm.quantity}
            onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
            placeholder="e.g. 50"
            validationType="number-only"
            required
            submitted={submitted}
            helperText={t('hints.digits')}
          />

          <Input
            label={t('inv_admin.reference')}
            name="referenceNumber"
            value={movementForm.referenceNumber}
            onChange={(e) => setMovementForm({ ...movementForm, referenceNumber: e.target.value })}
            placeholder={t('inv_admin.reference_ph')}
            submitted={submitted}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsMovementModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={formLoading}>{t('inv_admin.record_txn')}</Button>
          </div>
        </form>
      </Modal>

      {/* DELETE ITEM MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('inv_admin.confirm_delete')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('inv_admin.confirm_text')} <strong className="text-slate-900">{selectedItem?.name}</strong> ({selectedItem?.item_code})?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={formLoading} onClick={handleDeleteItem}>{t('inv_admin.delete_permanent')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
