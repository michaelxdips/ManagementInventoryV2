const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const idPath = 'frontend/src/locales/id.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

en.requests.emptyNewRequest = 'Request items that are not yet available in inventory using the New Request button.';
id.requests.emptyNewRequest = 'Ajukan barang yang belum tersedia di inventory melalui tombol Request Baru.';

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(idPath, JSON.stringify(id, null, 2));

const reqPath = 'frontend/src/pages/Requests.tsx';
let reqContent = fs.readFileSync(reqPath, 'utf8');

reqContent = reqContent.replace(
    /<span>Ambil Barang<\/span>/,
    "<span>{t('requests.takeItem')}</span>"
);

reqContent = reqContent.replace(
    /description="Ajukan barang yang belum tersedia di inventory melalui tombol Request Baru\."/,
    "description={t('requests.emptyNewRequest')}"
);

fs.writeFileSync(reqPath, reqContent);
console.log('Requests page patched');
