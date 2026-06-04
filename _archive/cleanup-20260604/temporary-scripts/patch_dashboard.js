const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');

content = content.replace('Menyiapkan ringkasan inventory terbaru...', "{t('dashboard.preparing')}");
content = content.replace('Gagal Memuat Dashboard', "{t('dashboard.loadError')}");
content = content.replace('Coba Lagi', "{t('common.tryAgain')}");

fs.writeFileSync('frontend/src/pages/Dashboard.tsx', content);

const en = JSON.parse(fs.readFileSync('frontend/src/locales/en.json', 'utf8'));
const id = JSON.parse(fs.readFileSync('frontend/src/locales/id.json', 'utf8'));

en.dashboard = en.dashboard || {};
en.dashboard.preparing = 'Preparing latest inventory summary...';
en.dashboard.loadError = 'Failed to Load Dashboard';
en.common = en.common || {};
en.common.tryAgain = 'Try Again';

id.dashboard = id.dashboard || {};
id.dashboard.preparing = 'Menyiapkan ringkasan inventory terbaru...';
id.dashboard.loadError = 'Gagal Memuat Dashboard';
id.common = id.common || {};
id.common.tryAgain = 'Coba Lagi';

fs.writeFileSync('frontend/src/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('frontend/src/locales/id.json', JSON.stringify(id, null, 2));
console.log('Dashboard and locales patched');
