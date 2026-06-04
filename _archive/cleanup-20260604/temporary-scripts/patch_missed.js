const fs = require('fs');
const path = require('path');

const applyReplacements = (filePath, replacements) => {
  let content = fs.readFileSync(filePath, 'utf-8');

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

// AuditLogs
applyReplacements(path.join(pagesDir, 'AuditLogs.tsx'), [
  { from: '>Cari<', to: '>{t(\'common.search\')}<' },
  { from: '>Dari<', to: '>{t(\'common.from\')}<' },
  { from: '>Hingga<', to: '>{t(\'common.to\')}<' },
  { from: '"Coba ubah filter tanggal, aksi, atau kata kunci pencarian."', to: 't(\'audit.emptyDesc\')' },
  { from: "'Waktu'", to: "t('audit.time')" },
  { from: "'ID Record'", to: "t('audit.tableId')" },
  { from: "'Pengguna'", to: "t('audit.user')" },
  { from: 'Menampilkan {fromDisplay} - {toDisplay} dari {pagination.total} log', to: "{t('audit.showingLogs', { from: fromDisplay, to: toDisplay, total: pagination.total })}" }
]);

// StockOpname
applyReplacements(path.join(pagesDir, 'StockOpname.tsx'), [
  { from: '>Sesi Opname #{activeSession.id}<', to: '>{t(\'stockOpname.sessionTitle\', { id: activeSession.id })}<' },
  { from: 'Status: <span className="text-strong">{activeSession.status}</span> | Tanggal: {new Date(activeSession.opname_date).toLocaleString(\'id-ID\')}', to: '{t(\'stockOpname.status\')}: <span className="text-strong">{activeSession.status}</span> | {t(\'stockOpname.date\')}: {new Date(activeSession.opname_date).toLocaleString(i18n.language === \'id\' ? \'id-ID\' : \'en-US\')}' },
  { from: '>Kembali<', to: '>{t(\'common.back\')}<' },
  { from: '<TH>Kode</TH>', to: '<TH>{t(\'inventory.columns.itemCode\')}</TH>' },
  { from: '<TH>Nama Barang</TH>', to: '<TH>{t(\'inventory.columns.itemName\')}</TH>' },
  { from: '<TH>Stok Sistem</TH>', to: '<TH>{t(\'stockOpname.systemStock\')}</TH>' },
  { from: '<TH className="th-width-150">Stok Fisik</TH>', to: '<TH className="th-width-150">{t(\'stockOpname.physicalStock\')}</TH>' },
  { from: '<TH>Selisih</TH>', to: '<TH>{t(\'stockOpname.difference\')}</TH>' },
  { from: '<TH>Catatan (Opsional)</TH>', to: '<TH>{t(\'stockOpname.noteOptional\')}</TH>' },
  { from: 'placeholder="Alasan selisih..."', to: 'placeholder={t(\'stockOpname.notePlaceholder\')}' },
  { from: "{actionLoading ? 'Menyimpan...' : 'Finalisasi & Update Stok'}", to: "{actionLoading ? t('common.saving') : t('stockOpname.finalize')}" },
  { from: "{actionLoading ? 'Membuat...' : '+ Mulai Opname'}", to: "{actionLoading ? t('common.creating') : t('stockOpname.startOpname')}" },
  { from: '>Hapus<', to: '>{t(\'common.delete\')}<' },
  { from: 'label: \'Kode\'', to: "label: t('inventory.columns.itemCode')" },
  { from: 'label: \'Stok sistem\'', to: "label: t('stockOpname.systemStock')" },
  { from: 'label: \'Selisih\'', to: "label: t('stockOpname.difference')" },
  { from: 'label: \'Tanggal\'', to: "label: t('stockOpname.date')" },
  { from: 'label: \'Catatan\'', to: "label: t('stockOpname.note')" },
  { from: '>Stok fisik<', to: '>{t(\'stockOpname.physicalStock\')}<' },
  { from: '>Hapus sesi<', to: '>{t(\'stockOpname.deleteSession\')}<' },
  { from: 'const { t } = useTranslation();', to: 'const { t, i18n } = useTranslation();' },
  { from: "{new Date(s.opname_date).toLocaleString('id-ID')}", to: "{new Date(s.opname_date).toLocaleString(i18n.language === 'id' ? 'id-ID' : 'en-US')}" },
  { from: "const { t, i18n } = useTranslation();\n    const { t, i18n } = useTranslation();", to: 'const { t, i18n } = useTranslation();' } // prevent duplication if multiple run
]);

console.log("Patched successfully");
