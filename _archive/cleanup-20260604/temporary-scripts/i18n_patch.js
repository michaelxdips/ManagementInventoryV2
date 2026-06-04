const fs = require('fs');
const path = require('path');

const i18n_en = JSON.parse(fs.readFileSync('frontend/src/locales/en.json', 'utf8'));
const i18n_id = JSON.parse(fs.readFileSync('frontend/src/locales/id.json', 'utf8'));

// 1. Add namespace objects if they don't exist
const namespaces = ['history', 'approval', 'calendar', 'stockOpname', 'audit'];
for (const ns of namespaces) {
    if (!i18n_en[ns]) i18n_en[ns] = {};
    if (!i18n_id[ns]) i18n_id[ns] = {};
}

// 2. Add keys
Object.assign(i18n_en.history, {
    "inboundTitle": "Inbound History",
    "outboundTitle": "Outbound History",
    "fromDate": "From Date",
    "toDate": "To Date",
    "apply": "Apply",
    "reset": "Reset"
});
Object.assign(i18n_id.history, {
    "inboundTitle": "Riwayat Masuk",
    "outboundTitle": "Riwayat Keluar",
    "fromDate": "Dari Tanggal",
    "toDate": "Hingga Tanggal",
    "apply": "Terapkan",
    "reset": "Reset"
});

Object.assign(i18n_en.approval, {
    "title": "Approval",
    "outboundRequests": "Outbound Requests",
    "desc": "Approve requests to deduct stock and record outbound items.",
    "search": "Search item name, receiver, or department...",
    "continueReview": "Continue Review",
    "approve": "Approve",
    "reject": "Reject",
    "empty": "No requests found"
});
Object.assign(i18n_id.approval, {
    "title": "Persetujuan",
    "outboundRequests": "Permintaan Barang Keluar",
    "desc": "Setujui permintaan untuk mengurangi stok dan mencatat barang keluar.",
    "search": "Cari nama barang, penerima, atau departemen...",
    "continueReview": "Lanjut Review",
    "approve": "Setujui",
    "reject": "Tolak",
    "empty": "Tidak ada permintaan"
});

Object.assign(i18n_en.calendar, {
    "title": "Request Calendar",
    "desc": "Request overview based on operational date, status, and daily details.",
    "today": "Today",
    "totalRequests": "Total Requests",
    "filterStatus": "Filter Status",
    "filterDesc": "Select a status to focus badges and calendar details.",
    "all": "All",
    "dailyDetail": "Daily Detail",
    "requestItem": "request"
});
Object.assign(i18n_id.calendar, {
    "title": "Kalender Permintaan",
    "desc": "Ringkasan permintaan barang berdasarkan tanggal operasional, status, dan detail harian.",
    "today": "Hari Ini",
    "totalRequests": "Total Permintaan",
    "filterStatus": "Filter Status",
    "filterDesc": "Pilih status untuk memfokuskan badge dan detail pada kalender.",
    "all": "Semua",
    "dailyDetail": "Detail Harian",
    "requestItem": "permintaan"
});

Object.assign(i18n_en.stockOpname, {
    "title": "Stock Opname",
    "desc": "Adjust physical stock against system stock.",
    "startNewSession": "Start New Session",
    "sessionNotePlaceholder": "Session Note / Name (Optional)",
    "startOpname": "Start Opname",
    "continue": "Continue",
    "viewResult": "View Result",
    "delete": "Delete"
});
Object.assign(i18n_id.stockOpname, {
    "title": "Stock Opname",
    "desc": "Sesuaikan stok fisik dengan data sistem.",
    "startNewSession": "Mulai Sesi Baru",
    "sessionNotePlaceholder": "Catatan / Nama Sesi (Opsional)",
    "startOpname": "Mulai Opname",
    "continue": "Lanjutkan",
    "viewResult": "Lihat Hasil",
    "delete": "Hapus"
});

Object.assign(i18n_en.audit, {
    "title": "Audit Trail",
    "desc": "Detailed record of all data modification activities.",
    "searchPlaceholder": "Search table, user, or record ID...",
    "action": "Action",
    "all": "All",
    "time": "Time",
    "tableId": "Table / ID",
    "user": "User",
    "changes": "Changes",
    "empty": "No matching audit records found."
});
Object.assign(i18n_id.audit, {
    "title": "Log Audit",
    "desc": "Rekam jejak mendalam untuk seluruh aktivitas modifikasi data.",
    "searchPlaceholder": "Cari tabel, pengguna, atau ID record...",
    "action": "Aksi",
    "all": "Semua",
    "time": "Waktu",
    "tableId": "Tabel / ID",
    "user": "Pengguna",
    "changes": "Perubahan",
    "empty": "Tidak ada rekam jejak yang cocok."
});

// Also fix server errors
if (!i18n_en.common) i18n_en.common = {};
if (!i18n_id.common) i18n_id.common = {};
i18n_en.common.fetchError = "Failed to load data from server";
i18n_id.common.fetchError = "Gagal memuat data dari server";

fs.writeFileSync('frontend/src/locales/en.json', JSON.stringify(i18n_en, null, 2) + '\\n');
fs.writeFileSync('frontend/src/locales/id.json', JSON.stringify(i18n_id, null, 2) + '\\n');

// 3. Patching Components

function replaceInFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    for (const {from, to} of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(filepath, content);
}

// HistoryMasuk
replaceInFile('frontend/src/pages/HistoryMasuk.tsx', [
    { from: /'Gagal memuat data dari server'/g, to: "t('common.fetchError')" },
    { from: /<label className="filter-label">Dari Tanggal<\/label>/g, to: "<label className=\"filter-label\">{t('history.fromDate')}</label>" },
    { from: /<label className="filter-label">Hingga Tanggal<\/label>/g, to: "<label className=\"filter-label\">{t('history.toDate')}</label>" }
]);

// HistoryKeluar
replaceInFile('frontend/src/pages/HistoryKeluar.tsx', [
    { from: /'Gagal memuat data dari server'/g, to: "t('common.fetchError')" },
    { from: /<label className="filter-label">Dari Tanggal<\/label>/g, to: "<label className=\"filter-label\">{t('history.fromDate')}</label>" },
    { from: /<label className="filter-label">Hingga Tanggal<\/label>/g, to: "<label className=\"filter-label\">{t('history.toDate')}</label>" }
]);

// RequestCalendar
replaceInFile('frontend/src/pages/RequestCalendar.tsx', [
    { from: /<h1>Kalender Request<\/h1>/g, to: "<h1>{t('calendar.title')}<\/h1>" },
    { from: /<h1 id="request-calendar-title">Kalender Request<\/h1>/g, to: "<h1 id=\"request-calendar-title\">{t('calendar.title')}<\/h1>" }
]);

// StockOpname
replaceInFile('frontend/src/pages/StockOpname.tsx', [
    { from: /<h3 className="section-heading">Mulai Sesi Baru<\/h3>/g, to: "<h3 className=\"section-heading\">{t('stockOpname.startNewSession')}<\/h3>" },
    { from: /placeholder="Catatan \/ Nama Sesi \(Opsional\)"/g, to: "placeholder={t('stockOpname.sessionNotePlaceholder')}" },
    { from: /\{s\.status === 'DRAFT' \? 'Lanjutkan' : 'Lihat Hasil'\}/g, to: "{s.status === 'DRAFT' ? t('stockOpname.continue') : t('stockOpname.viewResult')}" },
    { from: /\{s\.status === 'DRAFT' \? 'Lanjutkan' : 'Lihat hasil'\}/g, to: "{s.status === 'DRAFT' ? t('stockOpname.continue') : t('stockOpname.viewResult')}" }
]);

// AuditLogs
replaceInFile('frontend/src/pages/AuditLogs.tsx', [
    { from: /{ header: 'Perubahan', key: 'changes' },/g, to: "{ header: t('audit.changes'), key: 'changes' }," },
    { from: /{ header: 'Perubahan', dataKey: 'changes' },/g, to: "{ header: t('audit.changes'), dataKey: 'changes' }," },
    { from: /<p className="page-description">Rekam jejak mendalam untuk seluruh aktivitas modifikasi data\.<\/p>/g, to: "<p className=\"page-description\">{t('audit.desc')}<\/p>" },
    { from: /placeholder="Cari tabel, pengguna, atau ID record..."/g, to: "placeholder={t('audit.searchPlaceholder')}" },
    { from: /<TH>Perubahan<\/TH>/g, to: "<TH>{t('audit.changes')}<\/TH>" },
    { from: /title="Tidak ada rekam jejak yang cocok"/g, to: "title={t('audit.empty')}" },
    { from: /emptyMessage="Tidak ada rekam jejak yang cocok\."/g, to: "emptyMessage={t('audit.empty')}" },
    { from: /label: 'Perubahan',/g, to: "label: t('audit.changes')," }
]);

// Approval
replaceInFile('frontend/src/pages/Approval.tsx', [
    { from: /<CheckIcon \/> Lanjut Review/g, to: "<CheckIcon /> {t('approval.continueReview')}" }
]);

// Requests
replaceInFile('frontend/src/pages/Requests.tsx', [
    { from: /'Gagal memuat data dari server'/g, to: "t('common.fetchError')" }
]);

console.log('Patch complete.');
