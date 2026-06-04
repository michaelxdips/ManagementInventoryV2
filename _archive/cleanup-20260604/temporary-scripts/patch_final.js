const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const idPath = 'frontend/src/locales/id.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

// common.creating
en.common.creating = 'Creating...';
id.common.creating = 'Membuat...';

// Approval missing keys
en.approval = en.approval || {};
en.approval.reviewTitle = 'Review Request';
en.approval.approvedQty = 'Approved Quantity';
en.approval.qtyInfo = 'Amount to be approved and deducted from stock.';
en.approval.finishAndRecord = 'Finish & Record Outbound';

id.approval = id.approval || {};
id.approval.reviewTitle = 'Tinjau Permintaan';
id.approval.approvedQty = 'Jumlah Disetujui';
id.approval.qtyInfo = 'Jumlah yang disetujui dan akan dipotong dari stok.';
id.approval.finishAndRecord = 'Selesai & Catat Barang Keluar';

// Calendar missing keys
en.calendar = en.calendar || {};
en.calendar.today = 'Today';
en.calendar.totalRequest = 'Total Request';
en.calendar.pendingReview = 'Pending + Review';
en.calendar.statusThisMonth = 'Status this month';
en.calendar.request = 'request';
en.calendar.all = 'All';
en.calendar.qty = 'Qty';
en.calendar.reason = 'Reason';

id.calendar = id.calendar || {};
id.calendar.today = 'Hari Ini';
id.calendar.totalRequest = 'Total Request';
id.calendar.pendingReview = 'Pending + Review';
id.calendar.statusThisMonth = 'Status bulan ini';
id.calendar.request = 'request';
id.calendar.all = 'Semua';
id.calendar.qty = 'Qty';
id.calendar.reason = 'Alasan';

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(idPath, JSON.stringify(id, null, 2));

// Patch RequestCalendar.tsx
const calPath = 'frontend/src/pages/RequestCalendar.tsx';
let calContent = fs.readFileSync(calPath, 'utf8');

calContent = calContent.replace(
    /<RotateCcw size=\{16\} \/> Hari Ini/,
    "<RotateCcw size={16} /> {t('calendar.today')}"
);
calContent = calContent.replace(
    /<span>Total Request<\/span>/,
    "<span>{t('calendar.totalRequest')}</span>"
);
calContent = calContent.replace(
    /<small>\{key === 'PENDING' \? 'Pending \+ Review' : 'Status bulan ini'\}<\/small>/,
    "<small>{key === 'PENDING' ? t('calendar.pendingReview') : t('calendar.statusThisMonth')}</small>"
);
calContent = calContent.replace(
    /\{item\.label\}/,
    "{item.key === 'ALL' ? t('calendar.all') : item.label}"
);
calContent = calContent.replace(
    /<span>request<\/span>/,
    "<span>{t('calendar.request')}</span>"
);
calContent = calContent.replace(
    /<p>Tidak ada request pada tanggal ini untuk filter yang dipilih\.<\/p>/,
    "<p>{t('calendar.empty')}</p>"
);
calContent = calContent.replace(
    /<dt>Qty<\/dt>/,
    "<dt>{t('calendar.qty')}</dt>"
);
calContent = calContent.replace(
    /<dt>Tanggal<\/dt>/,
    "<dt>{t('common.date')}</dt>"
);
calContent = calContent.replace(
    /Alasan: \{request\.reject_reason\}/,
    "{t('calendar.reason')}: {request.reject_reason}"
);

fs.writeFileSync(calPath, calContent);
console.log('Locales and Calendar patched');
