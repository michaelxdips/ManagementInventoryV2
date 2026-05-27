import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { createRequest } from '../api/requests.api';
import { fetchItems, Item } from '../api/items.api';
import { fetchUnitNames } from '../api/units.api';
import useAuth from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../hooks/useTranslation';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const RequestsCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUserRole = user?.role === 'user';
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [items, setItems] = useState<Item[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formValues, setFormValues] = useState({
    item: '',
    date: '',
    qty: '',
    unit: '',
    receiver: '',
    dept: isUserRole && user?.name ? user.name : '',
  });
  const [saving, setSaving] = useState(false);

  // Search/filter state for item dropdown
  const [itemSearch, setItemSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchItems()
      .then((rows) => setItems(rows))
      .catch(() => setItems([]));

    fetchUnitNames()
      .then((names) => setUnitOptions(names))
      .catch(() => setUnitOptions([]));
  }, []);

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Select an item from the dropdown
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setItemSearch(item.name);
    setFormValues((prev) => ({
      ...prev,
      item: item.name,
      unit: item.unit,
    }));
    setShowDropdown(false);
  };

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { item, date, qty, unit, receiver, dept } = formValues;
    if (!item || !date || !qty || !unit || !receiver || !dept) {
      showToast(t('requests.errorAllFieldsRequired'));
      return;
    }
    const qtyNumber = Number(qty);
    if (Number.isNaN(qtyNumber) || qtyNumber <= 0) {
      showToast(t('requests.errorQtyGreaterThanZero'));
      return;
    }

    // Validate against stock
    if (selectedItem && qtyNumber > selectedItem.quantity) {
      showToast(`${t('requests.errorStockNotEnough')} ${selectedItem.quantity} ${selectedItem.unit}`);
      return;
    }

    setSaving(true);
    createRequest({ item, date, qty: qtyNumber, unit, receiver, dept })
      .then(() => {
        showToast(t('requests.successCreated'), 'success');
        setFormValues({ item: '', date: '', qty: '', unit: '', receiver: '', dept: isUserRole && user?.name ? user.name : '' });
        setSelectedItem(null);
        setItemSearch('');
      })
      .catch((err: any) => {
        let msg = t('requests.errorSaveFailed');
        if (err?.message) {
          try {
            const parsed = JSON.parse(err.message);
            msg = parsed.message || msg;
          } catch {
            msg = err.message;
          }
        }
        showToast(msg);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="requests-page">
      <div className="requests-header section-spacer-md">
        <h2 className="history-title">{t('requests.createTitle')}</h2>
        <Button type="button" variant="ghost" onClick={() => navigate('/requests')}>
          {t('requests.backToList')}
        </Button>
      </div>

      <div className="history-card">
        <div className="history-title title-inline">
          <PlusIcon /> <span>{t('requests.formTitle')}</span>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          {/* Nama Barang — Searchable Dropdown */}
          <label className="form-field form-field--relative">
            <span className="form-label">{t('requests.itemLabel')}</span>
            <input
              className="input-control"
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value);
                setShowDropdown(true);
                // Clear selection if user types something different
                if (selectedItem && e.target.value !== selectedItem.name) {
                  setSelectedItem(null);
                  setFormValues((prev) => ({ ...prev, item: '', unit: '' }));
                }
              }}
              onFocus={() => { if (!selectedItem) setShowDropdown(true); }}
              placeholder={t('requests.searchPlaceholder')}
              autoComplete="off"
            />
            {showDropdown && itemSearch && !selectedItem && (
              <div className="dropdown-panel dropdown-panel--search">
                {filteredItems.length === 0 ? (
                  <div className="dropdown-empty">{t('requests.itemNotFound')}</div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="dropdown-option"
                    >
                      <div>
                        <div className="dropdown-option__title">{item.name}</div>
                        <div className="dropdown-option__meta">
                          {item.code || 'No code'} · {item.location || '-'}
                        </div>
                      </div>
                      <div className={item.quantity > 0 ? 'dropdown-stock dropdown-stock--positive' : 'dropdown-stock dropdown-stock--negative'}>
                        {t('requests.stock')} {item.quantity} {item.unit}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {/* Click-away listener */}
            {showDropdown && (
              <div
                className="dropdown-backdrop"
                onClick={() => setShowDropdown(false)}
              />
            )}
            {selectedItem && (
              <div className="field-note field-note--success">
                ✓ {t('requests.stock')} {selectedItem.quantity} {selectedItem.unit}
              </div>
            )}
          </label>

          <label className="form-field">
            <span className="form-label">{t('requests.dateLabel')}</span>
            <input
              className="input-control"
              type="date"
              placeholder="dd/mm/yyyy"
              value={formValues.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </label>
          <label className="form-field">
            <span className="form-label">{t('requests.qtyLabel')}</span>
            <div className="qty-stepper">
              <button
                type="button"
                className="qty-stepper__button"
                onClick={() => handleChange('qty', String(Math.max(1, Number(formValues.qty || 1) - 1)))}
                disabled={!formValues.qty || Number(formValues.qty) <= 1}
                aria-label={t('requests.decreaseQty')}
              >
                −
              </button>
              <input
                className="input-control qty-stepper__input"
                type="number"
                min="1"
                max={selectedItem?.quantity || undefined}
                value={formValues.qty}
                onChange={(e) => handleChange('qty', e.target.value)}
              />
              <button
                type="button"
                className="qty-stepper__button"
                onClick={() => {
                  const currentQty = Number(formValues.qty || 0);
                  const nextQty = currentQty + 1;
                  if (selectedItem?.quantity && nextQty > selectedItem.quantity) return;
                  handleChange('qty', String(nextQty));
                }}
                disabled={Boolean(selectedItem?.quantity && Number(formValues.qty || 0) >= selectedItem.quantity)}
                aria-label={t('requests.increaseQty')}
              >
                +
              </button>
            </div>
          </label>
          <label className="form-field">
            <span className="form-label">{t('requests.unitLabel')}</span>
            <input
              className="input-control input-control--disabled"
              value={formValues.unit}
              disabled
            />
          </label>
          <label className="form-field">
            <span className="form-label">{t('requests.receiverLabel')}</span>
            <input className="input-control" value={formValues.receiver} onChange={(e) => handleChange('receiver', e.target.value)} />
          </label>
          <label className="form-field">
            <span className="form-label">{t('requests.deptLabel')}</span>
            {isUserRole ? (
              <input
                className="input-control input-control--disabled"
                value={formValues.dept}
                disabled
              />
            ) : (
              <select
                className="input-control"
                value={formValues.dept}
                onChange={(e) => handleChange('dept', e.target.value)}
              >
                <option value="">{t('requests.selectUnit')}</option>
                {unitOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </label>

          <div className="form-actions form-actions-wide">
            <div className="items-meta" aria-live="polite" />
            <Button type="submit" variant="secondary" disabled={saving || !selectedItem}>
              <PlusIcon />
              <span>{saving ? t('requests.saving') : t('requests.save')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestsCreate;
