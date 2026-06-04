const fs = require('fs');
const path = require('path');

const applyReplacements = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('useTranslation')) {
    // Inject useTranslation import
    content = content.replace(/(import.*from 'react';)/, "$1\nimport { useTranslation } from 'react-i18next';\nimport { getStatusLabel } from '../utils/status';");
    content = content.replace(/(const [A-Z][a-zA-Z0-9_]+ = \(.*?\) => {)/, "$1\n  const { t } = useTranslation();");
  }

  for (const rep of replacements) {
    if (typeof rep.from === 'string') {
      content = content.split(rep.from).join(rep.to);
    } else {
      content = content.replace(rep.from, rep.to);
    }
  }

  fs.writeFileSync(filePath, content);
};

const pagesDir = path.join(__dirname, 'frontend/src/pages');

// StockOpname
applyReplacements(path.join(pagesDir, 'StockOpname.tsx'), [
  { from: '>Stock Opname<', to: '>{t(\'stockOpname.title\')}<' },
  { from: '>Sesuaikan stok fisik dengan data sistem.<', to: '>{t(\'stockOpname.desc\')}<' },
  { from: '>Mulai Sesi Baru<', to: '>{t(\'stockOpname.startNewSession\')}<' },
  { from: 'placeholder="Catatan / Nama Sesi (Opsional)"', to: 'placeholder={t(\'stockOpname.sessionNotePlaceholder\')}' },
  { from: '>Mulai Opname<', to: '>{t(\'stockOpname.startOpname\')}<' },
  { from: '>ID<', to: '>{t(\'stockOpname.id\')}<' },
  { from: '>Tanggal<', to: '>{t(\'stockOpname.date\')}<' },
  { from: '>Catatan<', to: '>{t(\'stockOpname.note\')}<' },
  { from: '>Status<', to: '>{t(\'stockOpname.status\')}<' },
  { from: '>Aksi<', to: '>{t(\'stockOpname.action\')}<' },
  { from: '>Lanjutkan<', to: '>{t(\'stockOpname.continue\')}<' },
  { from: '>Hapus<', to: '>{t(\'stockOpname.delete\')}<' },
  { from: '>Lihat Hasil<', to: '>{t(\'stockOpname.viewResult\')}<' },
  { from: /formatStatus\(row\.status\)/g, to: 'getStatusLabel(row.status, t)' },
  { from: '>Draft<', to: '>{t(\'status.draft\')}<' },
  { from: '>Selesai<', to: '>{t(\'status.finalized\')}<' },
]);

// RequestCalendar
applyReplacements(path.join(pagesDir, 'RequestCalendar.tsx'), [
  { from: '>Kalender Permintaan<', to: '>{t(\'calendar.title\')}<' },
  { from: '>Ringkasan permintaan barang berdasarkan tanggal operasional, status, dan detail harian.<', to: '>{t(\'calendar.desc\')}<' },
  { from: '>Hari Ini<', to: '>{t(\'calendar.today\')}<' },
  { from: '>Total Permintaan<', to: '>{t(\'calendar.totalRequests\')}<' },
  { from: '>Filter Status<', to: '>{t(\'calendar.filterStatus\')}<' },
  { from: '>Pilih status untuk memfokuskan badge dan detail pada kalender.<', to: '>{t(\'calendar.filterDesc\')}<' },
  { from: '>Semua<', to: '>{t(\'calendar.all\')}<' },
  { from: '>Detail Harian<', to: '>{t(\'calendar.dailyDetail\')}<' },
  { from: '>permintaan<', to: '>{t(\'calendar.requestItem\')}<' },
  { from: '>Status bulan ini<', to: '>{t(\'calendar.thisMonthStatus\')}<' },
  { from: /formatStatus\(([a-zA-Z0-9_\.]+)\)/g, to: 'getStatusLabel($1, t)' },
]);

// AuditLogs
applyReplacements(path.join(pagesDir, 'AuditLogs.tsx'), [
  { from: '>Log Audit<', to: '>{t(\'audit.title\')}<' },
  { from: '>Rekam jejak mendalam untuk seluruh aktivitas modifikasi data.<', to: '>{t(\'audit.desc\')}<' },
  { from: 'placeholder="Cari tabel, pengguna, atau ID record..."', to: 'placeholder={t(\'audit.searchPlaceholder\')}' },
  { from: '>Aksi<', to: '>{t(\'audit.action\')}<' },
  { from: '>Semua<', to: '>{t(\'audit.all\')}<' },
  { from: '>Dari Tanggal<', to: '>{t(\'common.from\')}<' },
  { from: '>Hingga Tanggal<', to: '>{t(\'common.to\')}<' },
  { from: '>Terapkan<', to: '>{t(\'common.apply\')}<' },
  { from: '>Waktu<', to: '>{t(\'audit.time\')}<' },
  { from: '>Tabel / ID<', to: '>{t(\'audit.tableId\')}<' },
  { from: '>Pengguna<', to: '>{t(\'audit.user\')}<' },
  { from: '>Perubahan<', to: '>{t(\'audit.changes\')}<' },
  { from: '>Tidak ada data berubah<', to: '>{t(\'audit.empty\')}<' },
]);

// AtkItems
applyReplacements(path.join(pagesDir, 'AtkItems.tsx'), [
  { from: 'placeholder="Cari Barang atau Kode Barang..."', to: 'placeholder={t(\'items.searchPlaceholder\')}' },
  { from: '>Jumlah Terkecil<', to: '>{t(\'items.sortAsc\')}<' },
  { from: '>Jumlah Terbesar<', to: '>{t(\'items.sortDesc\')}<' },
  { from: '>Terapkan<', to: '>{t(\'common.apply\')}<' },
  { from: '>Menampilkan<', to: '>{t(\'items.showing\').split(\'{{from}}\')[0]}<' }, // Need better replacement for "Menampilkan {{from}} - {{to}} dari {{total}} barang"
  { from: />Ambil Barang</g, to: '>{t(\'items.takeItem\')}<' },
  { from: '>Stok Habis<', to: '>{t(\'items.outOfStock\')}<' },
  { from: />Ambil</g, to: '>{t(\'inventory.actions.take\')}<' },
  { from: '>Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} barang<', to: '>{t(\'items.showing\', { from: indexOfFirstItem + 1, to: Math.min(indexOfLastItem, filteredData.length), total: filteredData.length })}<' },
  { from: />Nama Barang</g, to: '>{t(\'inventory.columns.itemName\')}<' },
  { from: />Kode Barang</g, to: '>{t(\'inventory.columns.itemCode\')}<' },
  { from: />Jumlah</g, to: '>{t(\'inventory.columns.qty\')}<' },
  { from: />Satuan</g, to: '>{t(\'inventory.columns.unit\')}<' },
  { from: />Lokasi Simpan</g, to: '>{t(\'inventory.columns.location\')}<' },
  { from: />Aksi</g, to: '>{t(\'inventory.columns.action\')}<' },
]);

// Approval
applyReplacements(path.join(pagesDir, 'Approval.tsx'), [
  { from: '>Lanjut Review<', to: '>{t(\'approval.continueReview\')}<' },
  { from: '>Tidak ada permintaan<', to: '>{t(\'approval.empty\')}<' },
]);

// Dashboard updates - check if there are any pending raw keys or Indonesian text
const dashboardFiles = ['UserDashboard.tsx', 'AdminDashboard.tsx'];
for (const file of dashboardFiles) {
  applyReplacements(path.join(pagesDir, 'dashboard', file), [
    { from: '>Sering Diminta<', to: '>{t(\'dashboard.frequentlyRequested\')}<' },
    { from: '>Minta Lagi<', to: '>{t(\'dashboard.requestAgain\')}<' },
    { from: '>Pengumuman<', to: '>{t(\'dashboard.announcements\')}<' },
    { from: '>Permintaan Baru<', to: '>{t(\'dashboard.newRequest\')}<' },
    { from: '>Total Permintaan<', to: '>{t(\'dashboard.totalRequests\')}<' },
    { from: '>Menunggu Validasi<', to: '>{t(\'dashboard.pendingValidation\')}<' },
    { from: '>Disetujui<', to: '>{t(\'dashboard.approved\')}<' },
    { from: '>Ditolak<', to: '>{t(\'dashboard.rejected\')}<' },
    { from: '>Sedang diproses<', to: '>{t(\'dashboard.processing\')}<' },
    { from: '>Riwayat<', to: '>{t(\'dashboard.history\')}<' },
    { from: '>Berikut ringkasan<', to: '>{t(\'dashboard.summary\').split(\'.\')[0]}<' }
  ]);
}

console.log("Components patched successfully.");
