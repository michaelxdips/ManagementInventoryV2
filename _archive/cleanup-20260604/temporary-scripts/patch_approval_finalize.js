const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/pages/ApprovalFinalize.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useTranslation')) {
    content = content.replace(/import \{ useParams, useNavigate \} from 'react-router-dom';/, "import { useParams, useNavigate } from 'react-router-dom';\nimport { useTranslation } from '../hooks/useTranslation';");
    content = content.replace(/const ApprovalFinalize = \(\) => \{/, "const ApprovalFinalize = () => {\n    const { t } = useTranslation();");
}

const replacements = [
    { from: "'Gagal memuat detail permintaan'", to: "t('approval.loadError', 'Gagal memuat detail permintaan')" },
    { from: "'Gagal menyelesaikan permintaan'", to: "t('approval.finalizeError', 'Gagal menyelesaikan permintaan')" },
    { from: "'Gagal update status'", to: "t('approval.updateError', 'Gagal update status')" },
    { from: "'Data tidak tersedia'", to: "t('approval.dataNotAvailable', 'Data tidak tersedia')" },
    { from: "'Jumlah harus lebih dari 0'", to: "t('approval.qtyZeroError', 'Jumlah harus lebih dari 0')" },
    { from: "`Jumlah tidak boleh melebihi permintaan (${detail.requestQty})`", to: "`Jumlah tidak boleh melebihi permintaan (${detail.requestQty})`" },
    { from: "`Jumlah tidak boleh melebihi stok tersedia (${detail.stok_tersedia})`", to: "`Jumlah tidak boleh melebihi stok tersedia (${detail.stok_tersedia})`" },
    { from: "'Status diupdate ke Review. Silakan lanjutkan.'", to: "t('approval.statusReview', 'Status diupdate ke Review. Silakan lanjutkan.')" },
    { from: "Memuat data...", to: "{t('common.loading', 'Memuat data...')}" },
    { from: ">Review Barang Keluar<", to: ">{t('approval.reviewTitle', 'Review Barang Keluar')}<" },
    { from: "← Kembali ke Approval", to: "← {t('approval.backToApproval', 'Kembali ke Approval')}" },
    { from: "'Detail Barang Keluar'", to: "t('approval.detailTitle', 'Detail Barang Keluar')" },
    { from: "'Review Barang Keluar'", to: "t('approval.reviewTitle', 'Review Barang Keluar')" },
    { from: "⚠️ Permintaan ini masih <strong>PENDING</strong>. Klik \"Mulai Review\" untuk memproses.", to: "⚠️ {t('approval.pendingWarning', 'Permintaan ini masih PENDING. Klik \"Mulai Review\" untuk memproses.')}" },
    { from: ">Nama Barang<", to: ">{t('inventory.columns.itemName', 'Nama Barang')}<" },
    { from: ">Kode Barang<", to: ">{t('inventory.columns.itemCode', 'Kode Barang')}<" },
    { from: ">Lokasi Barang<", to: ">{t('inventory.columns.location', 'Lokasi Barang')}<" },
    { from: ">Jumlah Disetujui<", to: ">{t('approval.approvedQty', 'Jumlah Disetujui')}<" },
    { from: "Permintaan asli: {detail.requestQty} · Stok: {detail.stok_tersedia}", to: "{t('approval.qtyInfo', { reqQty: detail.requestQty, stockQty: detail.stok_tersedia })}" },
    { from: ">Satuan<", to: ">{t('inventory.columns.unit', 'Satuan')}<" },
    { from: "← Kembali", to: "← {t('common.back', 'Kembali')}" },
    { from: ">Mulai Review<", to: ">{t('approval.startReview', 'Mulai Review')}<" },
    { from: "Memproses...", to: "{t('common.processing', 'Memproses...')}" },
    { from: "Selesai & Catat Barang Keluar", to: "{t('approval.finishAndRecord', 'Selesai & Catat Barang Keluar')}" },
    { from: "Status: {detail.status}", to: "{t('requests.status', 'Status')}: {detail.status}" },
];

for (const rep of replacements) {
    if (typeof rep.from === 'string') {
        content = content.split(rep.from).join(rep.to);
    }
}

fs.writeFileSync(file, content);
console.log('ApprovalFinalize patched');
