import Modal from './Modal';
import Button from './Button';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal isOpen={open} title={title} onClose={onCancel}>
    <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
      {message}
    </p>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
        {loading ? 'Memproses...' : confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default ConfirmDialog;
