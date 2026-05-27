import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import { fetchUnits, deleteUnit, UnitItem } from '../api/units.api';
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

const ManageUnits = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<UnitItem | null>(null);
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
    setConfirmTarget(null);
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
              <TH className="th-width-100">{t('units.colAction')}</TH>
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
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmTarget(row)}
                      disabled={deletingId === row.id}
                    >
                      <TrashIcon /> {deletingId === row.id ? t('units.actionDeleting') : t('units.actionDelete')}
                    </Button>
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
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmTarget(row)}
                  disabled={deletingId === row.id}
                >
                  <TrashIcon /> {deletingId === row.id ? t('units.actionDeleting') : t('units.actionDelete')}
                </Button>
              }
            />
          ))}
        </MobileCardList>
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div className="modal-backdrop" onClick={() => setConfirmTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-kicker">{t('units.modalKicker')}</p>
            <h3 className="modal-title">{t('units.modalTitle', { name: confirmTarget.name })}</h3>
            <p className="modal-text">
              {t('units.modalDesc1')}<strong>{confirmTarget.username}</strong>{t('units.modalDesc2')}
            </p>
            <div className="modal-actions">
              <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmTarget(null)}>
                {t('units.cancel')}
              </Button>
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                <TrashIcon /> {t('units.actionDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUnits;
