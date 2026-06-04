import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useTranslation } from '../../hooks/useTranslation';

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
  confirmLabel,
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  return (
  <Modal isOpen={open} title={title} onClose={onCancel}>
    <p style={{ margin: '0 0 18px', color: 'var(--muted)', lineHeight: 1.6 }}>
      {message}
    </p>
    <div className="flex-wrap-gap" style={{ justifyContent: 'flex-end', gap: '10px' }}>
      <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
        {cancelLabel || t('common.cancel')}
      </Button>
      <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
        {loading ? 'Memproses...' : (confirmLabel || t('common.confirm'))}
      </Button>
    </div>
  </Modal>
  );
};

export default ConfirmDialog;
