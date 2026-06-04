const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/ui/ConfirmDialog.tsx', 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { useTranslation } from '../../hooks/useTranslation';");
    content = content.replace(/const ConfirmDialog: React.FC<ConfirmDialogProps> = \(\{([^}]+)\}\) => \{/, (match, group) => {
        return `const ConfirmDialog: React.FC<ConfirmDialogProps> = ({${group}}) => {\n  const { t } = useTranslation();`;
    });
    content = content.replace("confirmLabel = 'Ya, lanjutkan',", "confirmLabel,");
    content = content.replace("cancelLabel = 'Batal',", "cancelLabel,");
    content = content.replace("{cancelLabel}", "{cancelLabel || t('common.cancel')}");
    content = content.replace("{confirmLabel}", "{confirmLabel || t('common.confirm')}");
    fs.writeFileSync('frontend/src/components/ui/ConfirmDialog.tsx', content);
}

const en = JSON.parse(fs.readFileSync('frontend/src/locales/en.json', 'utf8'));
const id = JSON.parse(fs.readFileSync('frontend/src/locales/id.json', 'utf8'));
if (!en.common) en.common = {};
if (!id.common) id.common = {};
en.common.confirm = "Yes, continue";
en.common.cancel = "Cancel";
id.common.confirm = "Ya, lanjutkan";
id.common.cancel = "Batal";
fs.writeFileSync('frontend/src/locales/en.json', JSON.stringify(en, null, 2) + '\\n');
fs.writeFileSync('frontend/src/locales/id.json', JSON.stringify(id, null, 2) + '\\n');
console.log('ConfirmDialog patched.');
