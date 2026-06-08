import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchUnits, deleteUnit, updateUnit, resetUnitPassword, UnitItem } from '../api/units.api';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { EmptyTableRow } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../components/ui/Toast';

const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="3.5" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ManageUnits = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<UnitItem | null>(null);
  const [editTarget, setEditTarget] = useState<UnitItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UnitItem | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const refreshFlag = (location.state as { refresh?: boolean } | null)?.refresh;
  const { t } = useTranslation();
  const { showToast } = useToast();

  const loadData = useCallback(() => {
    setLoading(true);
    fetchUnits()
      .then((rows) => {
        setUnits(rows);
      })
      .catch((err) => {
        setUnits([]);
        showToast(err.message || t('units.loadError'), 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast, t]);

  useEffect(() => {
    loadData();
  }, [refreshFlag, loadData]);

  const handleDelete = async () => {
    if (!confirmTarget) return;
    setDeletingId(confirmTarget.id);
    try {
      await deleteUnit(confirmTarget.id);
      showToast(t('units.deleteSuccess', { name: confirmTarget.name }), 'success');
      loadData();
    } catch (err: any) {
      let msg = t('units.deleteFailed');
      try {
        const parsed = JSON.parse(err.message);
        msg = parsed.message || msg;
      } catch {
        msg = err.message || msg;
      }
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  };

  const openEditModal = (unit: UnitItem) => {
    setEditTarget(unit);
    setEditName(unit.name);
    setEditUsername(unit.username);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    
    if (!editName.trim()) {
      showToast(t('units.nameRequired'), 'error');
      return;
    }
    
    if (!editUsername.trim()) {
      showToast(t('units.usernameRequired'), 'error');
      return;
    }
    
    const formattedUsername = editUsername.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,50}$/;
    if (!usernameRegex.test(formattedUsername)) {
      showToast(t('units.usernameInvalid'), 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUnit(editTarget.id, {
        name: editName.trim(),
        username: formattedUsername
      });
      showToast(t('units.editSuccess', { name: editName.trim() }), 'success');
      loadData();
      setEditTarget(null);
    } catch (err: any) {
      let msg = t('units.editFailed');
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      } else if (err.message) {
         try {
           const parsed = JSON.parse(err.message);
           msg = parsed.message || msg;
         } catch {
           msg = err.message;
         }
      }
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openResetModal = (unit: UnitItem) => {
    setResetTarget(unit);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    if (newPassword.length < 8) {
      showToast(t('units.passwordMinLength'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(t('units.passwordMismatch'), 'error');
      return;
    }

    setSaving(true);
    try {
      await resetUnitPassword(resetTarget.id, { newPassword });
      showToast(t('units.resetSuccess'), 'success');
      setResetTarget(null);
    } catch (err: any) {
      let msg = t('units.resetFailed');
      if (err.response?.data?.message) {
         msg = err.response.data.message;
      } else if (err.message) {
         try {
           const parsed = JSON.parse(err.message);
           msg = parsed.message || msg;
         } catch {
           msg = err.message;
         }
      }
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="history-page">
      <div className="requests-header section-spacer-sm">
        <h2 className="history-title">{t('units.title')}</h2>
        <Button type="button" variant="secondary" onClick={() => navigate('/manage-units/create')}>
          <UserPlusIcon />
          <span>{t('units.addUnit')}</span>
        </Button>
      </div>

      <div className="history-card">
        <Table>
          <THead>
            <TR>
              <TH className="th-width-52">{t('units.colNo')}</TH>
              <TH>{t('units.colName')}</TH>
              <TH className="th-width-180">{t('units.colUsername')}</TH>
              <TH style={{ width: '200px' }}>{t('units.colAction')}</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={5} columns={4} />
            ) : units.length === 0 ? (
              <EmptyTableRow
                colSpan={4}
                title={t('units.emptyTitle')}
                description={t('units.emptyDesc')}
              />
            ) : (
              units.map((row, idx) => (
                <TR key={row.id}>
                  <TD>{idx + 1}</TD>
                  <TD>{row.name}</TD>
                  <TD>{row.username}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(row)}
                        title={t('units.actionEdit')}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openResetModal(row)}
                        title={t('units.actionResetPassword')}
                        style={{ color: 'var(--color-warning-dark)' }}
                      >
                        <KeyIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirmTarget(row)}
                        disabled={deletingId === row.id}
                        title={t('units.actionDelete')}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Mobile Card View */}
        <MobileCardList
          isEmpty={units.length === 0}
          isLoading={loading}
          emptyMessage={t('units.emptyTitle')}
        >
          {units.map((row, idx) => (
            <MobileCard
              key={row.id}
              header={
                <span className="mobile-card-header-title">{row.name}</span>
              }
              fields={[
                { label: t('units.colNo'), value: idx + 1 },
                { label: t('units.colUsername'), value: row.username },
              ]}
              actions={
                <div className="mobile-card-actions" style={{ display: 'flex', width: '100%' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(row)}
                  >
                    <EditIcon /> <span className="sr-only sm-not-sr-only">{t('units.actionEdit')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openResetModal(row)}
                  >
                    <KeyIcon /> <span className="sr-only sm-not-sr-only">Reset</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmTarget(row)}
                    disabled={deletingId === row.id}
                  >
                    <TrashIcon /> <span className="sr-only sm-not-sr-only">{t('units.actionDelete')}</span>
                  </Button>
                </div>
              }
            />
          ))}
        </MobileCardList>
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div className="modal-backdrop" onClick={() => setConfirmTarget(null)}>
          <div className="unit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="unit-modal__header">
              <div>
                <h2 className="unit-modal__title">Delete Unit</h2>
                <p className="unit-modal__description">{t('units.deleteUnitDesc')}</p>
              </div>
              <button type="button" aria-label="Close modal" className="unit-modal__close" onClick={() => setConfirmTarget(null)}>
                <XIcon />
              </button>
            </div>
            <div className="unit-modal__body">
              <div className="unit-modal__confirm-card">
                <strong>{confirmTarget.name}</strong><br />
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Username: {confirmTarget.username}</span>
              </div>
            </div>
            <div className="unit-modal__footer">
              <Button type="button" variant="secondary" onClick={() => setConfirmTarget(null)}>
                {t('units.cancel')}
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={deletingId !== null}>
                <TrashIcon /> {deletingId !== null ? t('units.actionDeleting') : t('units.actionDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-backdrop" onClick={() => setEditTarget(null)}>
          <div className="unit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="unit-modal__header">
              <div>
                <h2 className="unit-modal__title">{t('units.editUnit')}</h2>
                <p className="unit-modal__description">{t('units.editUnitDesc')}</p>
              </div>
              <button type="button" aria-label="Close modal" className="unit-modal__close" onClick={() => setEditTarget(null)}>
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="unit-modal__body">
                <div className="unit-modal__field">
                  <label className="form-label">{t('settings.name')}</label>
                  <input
                    type="text"
                    className="unit-modal__input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="unit-modal__field">
                  <label className="form-label">{t('settings.username')}</label>
                  <input
                    type="text"
                    className="unit-modal__input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="unit-modal__footer">
                <Button type="button" variant="secondary" onClick={() => setEditTarget(null)} disabled={saving}>
                  {t('units.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? t('settings.saving') : t('units.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-backdrop" onClick={() => setResetTarget(null)}>
          <div className="unit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="unit-modal__header">
              <div>
                <h2 className="unit-modal__title">{t('units.resetPasswordTitle')}</h2>
                <p className="unit-modal__description">{t('units.resetUnitPasswordDesc')}</p>
              </div>
              <button type="button" aria-label="Close modal" className="unit-modal__close" onClick={() => setResetTarget(null)}>
                <XIcon />
              </button>
            </div>
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="unit-modal__body">
                <div className="unit-modal__field">
                  <label className="form-label">{t('units.newPassword')}</label>
                  <div className="unit-modal__password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="unit-modal__input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="unit-modal__password-toggle"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div className="unit-modal__field">
                  <label className="form-label">{t('units.confirmPassword')}</label>
                  <div className="unit-modal__password-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="unit-modal__input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="unit-modal__password-toggle"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="unit-modal__footer">
                <Button type="button" variant="secondary" onClick={() => setResetTarget(null)} disabled={saving}>
                  {t('units.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? t('settings.saving') : t('units.actionResetPassword')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUnits;
