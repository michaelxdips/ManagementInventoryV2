const fs = require('fs');

function insertTranslation(filepath, componentName) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes('useTranslation')) {
        content = "import { useTranslation } from '../hooks/useTranslation';\n" + content;
    }
    const regex = new RegExp(`const ${componentName} = \\([^)]*\\) => \\{`);
    if (regex.test(content) && !content.includes('const { t } = useTranslation()')) {
        content = content.replace(regex, (match) => match + '\n  const { t } = useTranslation();');
    }
    fs.writeFileSync(filepath, content);
}

insertTranslation('frontend/src/pages/AuditLogs.tsx', 'AuditLogs');
insertTranslation('frontend/src/pages/RequestCalendar.tsx', 'RequestCalendar');

// Fix ConfirmDialog
let cd = fs.readFileSync('frontend/src/components/ui/ConfirmDialog.tsx', 'utf8');
cd = "import { useTranslation } from '../../hooks/useTranslation';\n" + cd.replace("import { useTranslation } from '../../hooks/useTranslation';", "");
cd = cd.replace("const ConfirmDialog = ({", "const ConfirmDialog = ({\n  open,\n  title,\n  message,\n  confirmLabel,\n  cancelLabel,\n  danger = false,\n  loading = false,\n  onConfirm,\n  onCancel,\n}: ConfirmDialogProps) => {\n  const { t } = useTranslation();\n  return (\n  <Modal isOpen={open} title={title} onClose={onCancel}>");
cd = cd.replace(/const ConfirmDialog = \(\{\s*open,\s*title,[\s\S]*?\}: ConfirmDialogProps\) => \(\s*<Modal/g, ""); // this is getting messy, I'll just rewrite it cleanly

const cdClean = `import React from 'react';
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
`;
fs.writeFileSync('frontend/src/components/ui/ConfirmDialog.tsx', cdClean);

console.log('Fixed missing t');
