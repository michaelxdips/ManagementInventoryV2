const fs = require('fs');

// 1. Update locales
const enPath = 'frontend/src/locales/en.json';
const idPath = 'frontend/src/locales/id.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

// Fix interpolation format to {{var}}
en.stockOpname.sessionTitle = 'Opname Session #{{id}}';
id.stockOpname.sessionTitle = 'Sesi Opname #{{id}}';

en.audit.showingLogs = 'Showing {{from}} - {{to}} of {{total}} logs';
id.audit.showingLogs = 'Menampilkan {{from}} - {{to}} dari {{total}} log';

// Add missing common translations
en.common = en.common || {};
en.common.back = 'Back';
en.common.delete = 'Delete';
en.common.deleteSession = 'Delete Session';

id.common = id.common || {};
id.common.back = 'Kembali';
id.common.delete = 'Hapus';
id.common.deleteSession = 'Hapus Sesi';

// Add error mappings
en.stockOpname.draftExistsError = 'Complete or cancel the currently running DRAFT session first';
id.stockOpname.draftExistsError = 'Selesaikan atau batalkan sesi DRAFT yang sedang berjalan terlebih dahulu';
en.stockOpname.createError = 'Failed to create opname session';
id.stockOpname.createError = 'Gagal membuat sesi opname';
en.stockOpname.loadError = 'Failed to load opname session';
id.stockOpname.loadError = 'Gagal memuat sesi opname';

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(idPath, JSON.stringify(id, null, 2));

// 2. Fix StockOpname.tsx catch blocks and hardcoded Hapus
const tsxPath = 'frontend/src/pages/StockOpname.tsx';
let content = fs.readFileSync(tsxPath, 'utf8');

// Replace Hapus
content = content.replace(
    /onClick=\{\(\) => deleteSession\(s\.id\)\}>\s*Hapus\s*<\/Button>/g,
    "onClick={() => deleteSession(s.id)}>{t('common.delete')}</Button>"
);
content = content.replace(
    /onClick=\{\(\) => deleteSession\(s\.id\)\}>\s*Hapus sesi\s*<\/Button>/g,
    "onClick={() => deleteSession(s.id)}>{t('common.deleteSession')}</Button>"
);

// Replace handleCreate catch block
content = content.replace(
    /showToast\(err\.message \|\| 'Gagal membuat sesi opname', 'error'\);/g,
    "let msg = err.message || t('stockOpname.createError');\n            if (msg.includes('sesi DRAFT')) msg = t('stockOpname.draftExistsError');\n            showToast(msg, 'error');"
);

// Replace loadSession catch block
content = content.replace(
    /showToast\(err\.message \|\| 'Gagal memuat sesi opname', 'error'\);/g,
    "showToast(err.message || t('stockOpname.loadError'), 'error');"
);

fs.writeFileSync(tsxPath, content);
console.log('Fixed translations and errors');
