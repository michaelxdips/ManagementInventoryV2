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

const parseErr = (err: { message?: string }) => {
  let msg = 'Permintaan gagal';
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
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementRow | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_active: true });

  const activeCount = useMemo(() => rows.filter((row) => row.is_active).length, [rows]);
  const inactiveCount = rows.length - activeCount;
  const editingRow = rows.find((row) => row.id === editingId) || null;

  const loadData = useCallback(() => {
    setLoading(true);
    fetchAnnouncements()
      .then((list) => {
        setRows(list);
        setError(null);
      })
      .catch((err: { message?: string }) => {
        setRows([]);
        setError(parseErr(err));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(t);
  }, [statusMessage]);

  const resetForm = () => {
    setForm({ title: '', content: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    setError(null);
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
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Judul dan isi wajib diisi');
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
      setStatusMessage(editingId ? 'Pengumuman diperbarui' : 'Pengumuman dibuat');
      resetForm();
      loadData();
    })
      .catch((err: { message?: string }) => setError(parseErr(err)))
      .finally(() => setSaving(false));
  };

  const handleToggle = (r: AnnouncementRow) => {
    updateAnnouncement(r.id, { is_active: !r.is_active })
      .then(() => {
        setStatusMessage(r.is_active ? 'Pengumuman dinonaktifkan' : 'Pengumuman diaktifkan');
        loadData();
      })
      .catch((err: { message?: string }) => setError(parseErr(err)));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    deleteAnnouncement(deleteTarget.id)
      .then(() => {
        setStatusMessage('Pengumuman dihapus');
        if (editingId === deleteTarget.id) resetForm();
        setDeleteTarget(null);
        loadData();
      })
      .catch((err: { message?: string }) => setError(parseErr(err)))
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="announcements-page">
      <section className="announcements-hero">
        <div className="announcements-hero__content">
          <span className="announcements-eyebrow">Pusat Komunikasi</span>
          <h1>Pengumuman</h1>
          <p>
            Kelola informasi penting yang akan tampil untuk pengguna. Aktifkan hanya pengumuman yang masih relevan agar halaman informasi tetap bersih.
          </p>
        </div>
        <div className="announcements-stats" aria-label="Ringkasan pengumuman">
          <div className="announcement-stat-card">
            <span>Total</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="announcement-stat-card is-active">
            <span>Aktif</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="announcement-stat-card">
            <span>Arsip</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
        <Button type="button" variant="primary" onClick={startCreate}>
          {showForm && editingId === null ? 'Tutup form' : '+ Tambah Pengumuman'}
        </Button>
      </section>

      {showForm && (
        <section className="announcement-editor-card">
          <div className="announcement-editor-card__header">
            <div>
              <span className="announcements-eyebrow">{editingId ? 'Mode Edit' : 'Pengumuman Baru'}</span>
              <h2>{editingId ? editingRow?.title || 'Edit pengumuman' : 'Buat pengumuman baru'}</h2>
            </div>
            <span className={form.is_active ? 'announcement-status-pill is-active' : 'announcement-status-pill'}>
              {form.is_active ? 'Aktif' : 'Draft/Arsip'}
            </span>
          </div>
          <form className="announcement-form" onSubmit={handleSubmit}>
            <label className="form-field field-full">
              <span className="form-label">Judul</span>
              <input
                className="input-control"
                value={form.title}
                maxLength={120}
                placeholder="Contoh: Jadwal restock ATK bulan ini"
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="form-field field-full">
              <span className="form-label">Isi pengumuman</span>
              <textarea
                className="input-control announcement-textarea"
                rows={6}
                value={form.content}
                placeholder="Tulis informasi yang ringkas, jelas, dan mudah dipahami pengguna."
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
                <strong>Tampilkan untuk pengguna</strong>
                <small>Jika nonaktif, pengumuman tersimpan sebagai arsip.</small>
              </span>
            </label>
            <div className="form-actions form-actions-wide announcement-actions-row">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Menyimpan…' : editingId ? 'Simpan Perubahan' : 'Publikasikan'}
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="history-card announcements-list-card">
        {statusMessage && <div className="alert-success">{statusMessage}</div>}
        {error && <div className="alert-danger">{error}</div>}

        <div className="announcements-list-header">
          <div>
            <h2 className="history-title">Daftar Pengumuman</h2>
            <p>Pengumuman terbaru ditampilkan di bagian atas.</p>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Konten</TH>
              <TH className="th-width-110">Status</TH>
              <TH className="th-width-150">Dibuat</TH>
              <TH className="th-width-240">Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <SkeletonTableRows rows={5} columns={4} />
            ) : rows.length === 0 ? (
              <TR>
                <TD colSpan={4} className="empty-row">Belum ada pengumuman</TD>
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
                      {r.is_active ? 'Aktif' : 'Arsip'}
                    </span>
                  </TD>
                  <TD>{formatDateV2(r.created_at)}</TD>
                  <TD>
                    <div className="announcement-row-actions">
                      <Button type="button" variant="secondary" onClick={() => handleToggle(r)}>
                        {r.is_active ? 'Arsipkan' : 'Aktifkan'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => startEdit(r)}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" disabled={deletingId === r.id} onClick={() => setDeleteTarget(r)}>
                        {deletingId === r.id ? '…' : 'Hapus'}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        <MobileCardList isEmpty={rows.length === 0} isLoading={loading} emptyMessage="Belum ada pengumuman">
          {rows.map((r) => (
            <MobileCard
              key={r.id}
              header={
                <>
                  <span className="mobile-card-header-title">{r.title}</span>
                  <span className={r.is_active ? 'announcement-status-pill is-active' : 'announcement-status-pill'}>
                    {r.is_active ? 'Aktif' : 'Arsip'}
                  </span>
                </>
              }
              fields={[
                { label: 'Isi', value: r.content },
                { label: 'Dibuat', value: formatDateV2(r.created_at) },
              ]}
              actions={
                <div className="announcement-row-actions">
                  <Button type="button" variant="secondary" onClick={() => handleToggle(r)}>
                    {r.is_active ? 'Arsipkan' : 'Aktifkan'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => startEdit(r)}>
                    Edit
                  </Button>
                  <Button type="button" variant="secondary" disabled={deletingId === r.id} onClick={() => setDeleteTarget(r)}>
                    Hapus
                  </Button>
                </div>
              }
            />
          ))}
        </MobileCardList>
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Pengumuman"
        message={deleteTarget ? `Hapus pengumuman "${deleteTarget.title}"? Tindakan ini tidak dapat dibatalkan.` : ''}
        confirmLabel="Hapus"
        danger
        loading={deleteTarget ? deletingId === deleteTarget.id : false}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageAnnouncements;
