import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MobileCard, MobileCardList } from '../components/ui/MobileCard';
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  AnnouncementRow,
} from '../api/announcements.api';
import { formatDateV2 } from '../utils/dateUtils';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonTableRows } from '../components/ui/Skeleton';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../components/ui/Toast';

const parseErr = (err: { message?: string }, defaultMsg: string) => {
  let msg = defaultMsg;
  if (err?.message) {
    try {
      const p = JSON.parse(err.message);
      msg = p.message || msg;
    } catch {
      msg = err.message;
    }
  }
  return msg;
};

const ManageAnnouncements = () => {
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_active: true });
  const { t } = useTranslation();
  const { showToast } = useToast();

  const activeCount = useMemo(() => rows.filter((row) => row.is_active).length, [rows]);
  const inactiveCount = rows.length - activeCount;
  const editingRow = rows.find((row) => row.id === editingId) || null;

  const loadData = useCallback(() => {
    setLoading(true);
    fetchAnnouncements()
      .then((list) => {
        setRows(list);
      })
      .catch((err: { message?: string }) => {
        setRows([]);
        showToast(parseErr(err, t('announcements.reqFailed')), 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm({ title: '', content: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    if (showForm && editingId === null) {
      resetForm();
      return;
    }
    setEditingId(null);
    setForm({ title: '', content: '', is_active: true });
    setShowForm(true);
  };

  const startEdit = (r: AnnouncementRow) => {
    setEditingId(r.id);
    setForm({ title: r.title, content: r.content, is_active: r.is_active });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showToast(t('announcements.errRequired'), 'error');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      is_active: form.is_active,
    };
    const p = editingId ? updateAnnouncement(editingId, payload) : createAnnouncement(payload);
    p.then(() => {
      showToast(editingId ? t('announcements.msgUpdated') : t('announcements.msgCreated'), 'success');
      resetForm();
      loadData();
    })
      .catch((err: { message?: string }) => showToast(parseErr(err, t('announcements.reqFailed')), 'error'))
      .finally(() => setSaving(false));
  };

  const handleToggle = (r: AnnouncementRow) => {
    updateAnnouncement(r.id, { is_active: !r.is_active })
      .then(() => {
        showToast(r.is_active ? t('announcements.msgDeactivated') : t('announcements.msgActivated'), 'success');
        loadData();
      })
      .catch((err: { message?: string }) => showToast(parseErr(err, t('announcements.reqFailed')), 'error'));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteAnnouncement(deleteTarget.id)
      .then(() => {
        showToast(t('announcements.msgDeleted'), 'success');
        if (editingId === deleteTarget.id) resetForm();
        setDeleteTarget(null);
        loadData();
      })
      .catch((err: { message?: string }) => showToast(parseErr(err, t('announcements.reqFailed')), 'error'))
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="announcements-page">
      <section className="announcements-hero">
        <div className="announcements-hero__content">
          <span className="announcements-eyebrow">{t('announcements.eyebrowCenter')}</span>
          <h1>{t('announcements.title')}</h1>
          <p>
            {t('announcements.description')}
          </p>
        </div>
        <div className="announcements-stats" aria-label="Ringkasan pengumuman">
          <div className="announcement-stat-card">
            <span>{t('announcements.statTotal')}</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="announcement-stat-card is-active">
            <span>{t('announcements.statActive')}</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="announcement-stat-card">
            <span>{t('announcements.statArchive')}</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
        <Button type="button" variant="primary" onClick={startCreate}>
          {showForm && editingId === null ? t('announcements.btnCloseForm') : t('announcements.btnAdd')}
        </Button>
      </section>

      {showForm && (
        <section className="announcement-editor-card">
          <div className="announcement-editor-card__header">
            <div>
              <span className="announcements-eyebrow">{editingId ? t('announcements.modeEdit') : t('announcements.modeNew')}</span>
              <h2>{editingId ? editingRow?.title || t('announcements.titleEdit') : t('announcements.titleNew')}</h2>
            </div>
            <span className={form.is_active ? 'announcement-status-pill is-active' : 'announcement-status-pill'}>
              {form.is_active ? t('announcements.statusActive') : t('announcements.statusDraft')}
            </span>
          </div>
          <form className="announcement-form" onSubmit={handleSubmit}>
            <label className="form-field field-full">
              <span className="form-label">{t('announcements.formTitleLabel')}</span>
              <input
                className="input-control"
                value={form.title}
                maxLength={120}
                placeholder={t('announcements.formTitlePlaceholder')}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="form-field field-full">
              <span className="form-label">{t('announcements.formContentLabel')}</span>
              <textarea
                className="input-control announcement-textarea"
                rows={6}
                value={form.content}
                placeholder={t('announcements.formContentPlaceholder')}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </label>
            <label className="announcement-switch">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span>
                <strong>{t('announcements.formSwitchShow')}</strong>
                <small>{t('announcements.formSwitchDesc')}</small>
              </span>
            </label>
            <div className="form-actions form-actions-wide announcement-actions-row">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t('announcements.btnCancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('announcements.btnSaving') : editingId ? t('announcements.btnSave') : t('announcements.btnPublish')}
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="history-card announcements-list-card">

        <div className="announcements-list-header">
          <div>
            <h2 className="history-title">{t('announcements.listTitle')}</h2>
            <p>{t('announcements.listDesc')}</p>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>{t('announcements.colContent')}</TH>
              <TH className="th-width-110">{t('announcements.colStatus')}</TH>
              <TH className="th-width-150">{t('announcements.colCreated')}</TH>
              <TH className="th-width-240">{t('announcements.colAction')}</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={5} columns={4} />
            ) : rows.length === 0 ? (
              <TR>
                <TD colSpan={4} className="empty-row">{t('announcements.emptyList')}</TD>
              </TR>
            ) : (
              rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <div className="announcement-row-title">{r.title}</div>
                    <div className="announcement-row-content">
                      {r.content.length > 150 ? `${r.content.slice(0, 150)}…` : r.content}
                    </div>
                  </TD>
                  <TD>
                    <span className={r.is_active ? 'announcement-status-pill is-active' : 'announcement-status-pill'}>
                      {r.is_active ? t('announcements.statusActive') : t('announcements.statusDraft')}
                    </span>
                  </TD>
                  <TD>{formatDateV2(r.created_at)}</TD>
                  <TD>
                    <div className="announcement-row-actions">
                      <Button type="button" variant="secondary" onClick={() => handleToggle(r)}>
                        {r.is_active ? t('announcements.actionArchive') : t('announcements.actionActivate')}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => startEdit(r)}>
                        {t('announcements.actionEdit')}
                      </Button>
                      <Button type="button" variant="secondary" disabled={deletingId === r.id} onClick={() => setDeleteTarget(r)}>
                        {deletingId === r.id ? t('announcements.actionDeleting') : t('announcements.actionDelete')}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        <MobileCardList isEmpty={rows.length === 0} isLoading={loading} emptyMessage={t('announcements.emptyList')}>
          {rows.map((r) => (
            <MobileCard
              key={r.id}
              header={
                <>
                  <span className="mobile-card-header-title">{r.title}</span>
                  <span className={r.is_active ? 'announcement-status-pill is-active' : 'announcement-status-pill'}>
                    {r.is_active ? t('announcements.statusActive') : t('announcements.statusDraft')}
                  </span>
                </>
              }
              fields={[
                { label: t('announcements.colContent'), value: r.content },
                { label: t('announcements.colCreated'), value: formatDateV2(r.created_at) },
              ]}
              actions={
                <div className="announcement-row-actions">
                  <Button type="button" variant="secondary" onClick={() => handleToggle(r)}>
                    {r.is_active ? t('announcements.actionArchive') : t('announcements.actionActivate')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => startEdit(r)}>
                    {t('announcements.actionEdit')}
                  </Button>
                  <Button type="button" variant="secondary" disabled={deletingId === r.id} onClick={() => setDeleteTarget(r)}>
                    {t('announcements.actionDelete')}
                  </Button>
                </div>
              }
            />
          ))}
        </MobileCardList>
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('announcements.modalDeleteTitle')}
        message={deleteTarget ? t('announcements.modalDeleteMsg', { title: deleteTarget.title }) : ''}
        confirmLabel={t('announcements.modalBtnDelete')}
        danger
        loading={deleteTarget ? deletingId === deleteTarget.id : false}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageAnnouncements;
