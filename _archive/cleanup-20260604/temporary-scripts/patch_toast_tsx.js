const fs = require('fs');

function replaceFile(path, from, to) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(from, to);
    fs.writeFileSync(path, content);
}

replaceFile('frontend/src/pages/Approval.tsx', 
    /showToast\(err\.message \|\| 'Gagal menolak permintaan', 'error'\);/g, 
    "showToast(err.message || t('toast.approval.rejectFailed'), 'error');");

replaceFile('frontend/src/pages/Approval.tsx', 
    /showToast\('Permintaan ditolak'\);/g, 
    "showToast(t('toast.approval.rejectSuccess'));");

replaceFile('frontend/src/pages/Approval.tsx', 
    /showToast\(err\.message \|\| 'Gagal menyetujui permintaan', 'error'\);/g, 
    "showToast(err.message || t('toast.approval.approveFailed'), 'error');");

// For AuditLogs
replaceFile('frontend/src/pages/AuditLogs.tsx', 
    /parseErrorMessage\(err, 'Gagal mengekspor data audit ke Excel'\)/g, 
    "parseErrorMessage(err, t('toast.audit.exportExcelFailed'))");

replaceFile('frontend/src/pages/AuditLogs.tsx', 
    /parseErrorMessage\(err, 'Gagal mengekspor data audit ke PDF'\)/g, 
    "parseErrorMessage(err, t('toast.audit.exportPdfFailed'))");

// For auth/Login
replaceFile('frontend/src/pages/auth/Login.tsx', 
    /showToast\('Tidak terhubung\. Periksa jaringan atau pastikan server aktif\.'\);/g, 
    "showToast(t('toast.auth.noConnection'));");

replaceFile('frontend/src/pages/auth/Login.tsx', 
    /showToast\('Tidak terhubung\. Login dinonaktifkan sampai koneksi kembali\.'\);/g, 
    "showToast(t('toast.auth.loginDisabled'));");

replaceFile('frontend/src/pages/auth/Login.tsx', 
    /showToast\('Username dan password wajib diisi'\);/g, 
    "showToast(t('toast.auth.credentialsRequired'));");

replaceFile('frontend/src/pages/auth/Login.tsx', 
    /showToast\('Password minimal 4 karakter'\);/g, 
    "showToast(t('toast.auth.passwordMinLength'));");

replaceFile('frontend/src/pages/auth/Login.tsx', 
    /\.catch\(\(\) => showToast\('Login gagal, periksa kembali kredensial'\)\)/g, 
    ".catch(() => showToast(t('toast.auth.loginFailed')))");

// BarangMasukCreate.tsx
replaceFile('frontend/src/pages/BarangMasukCreate.tsx', 
    /\.catch\(\(\) => showToast\('Gagal memuat master data barang'\)\);/g, 
    ".catch(() => showToast(t('toast.inbound.masterDataLoadFailed')));");

// PasswordSettings
replaceFile('frontend/src/pages/PasswordSettings.tsx', 
    /showToast\('Semua kolom wajib diisi'\);/g, 
    "showToast(t('toast.settings.allFieldsRequired'));");

replaceFile('frontend/src/pages/PasswordSettings.tsx', 
    /showToast\('Password baru minimal 6 karakter'\);/g, 
    "showToast(t('toast.settings.passwordMin6'));");

replaceFile('frontend/src/pages/PasswordSettings.tsx', 
    /showToast\('Konfirmasi password tidak cocok'\);/g, 
    "showToast(t('toast.settings.passwordMismatch'));");

replaceFile('frontend/src/pages/PasswordSettings.tsx', 
    /showToast\('Password berhasil diperbarui'\);/g, 
    "showToast(t('toast.settings.passwordSuccess'));");

replaceFile('frontend/src/pages/PasswordSettings.tsx', 
    /showToast\(msg \|\| 'Gagal memperbarui password'\);/g, 
    "showToast(msg || t('toast.settings.passwordFailed'));");

// ProfileSettings
replaceFile('frontend/src/pages/ProfileSettings.tsx', 
    /showToast\('Name dan Username wajib diisi'\);/g, 
    "showToast(t('toast.settings.profileFieldsRequired'));");

replaceFile('frontend/src/pages/ProfileSettings.tsx', 
    /showToast\(msg \|\| 'Gagal menyimpan profil'\);/g, 
    "showToast(msg || t('toast.settings.profileFailed'));");

replaceFile('frontend/src/pages/ProfileSettings.tsx', 
    /showToast\('Password diperlukan untuk konfirmasi penghapusan'\);/g, 
    "showToast(t('toast.settings.deletePasswordRequired'));");

// For superadmin error
let profile = fs.readFileSync('frontend/src/pages/ProfileSettings.tsx', 'utf8');
profile = profile.replace(
    /showToast\(msg \|\| 'Gagal menghapus akun\. Password mungkin salah\.'\);/g, 
    "let displayMsg = msg || t('toast.settings.deleteFailed');\n\t\t\tif (msg && msg.includes('superadmin terakhir')) displayMsg = t('toast.settings.deleteSuperadminFailed');\n\t\t\tshowToast(displayMsg);"
);
fs.writeFileSync('frontend/src/pages/ProfileSettings.tsx', profile);

// Requests
replaceFile('frontend/src/pages/Requests.tsx', 
    /showToast\('Nama barang wajib diisi'\);/g, 
    "showToast(t('toast.requests.nameRequired'));");

replaceFile('frontend/src/pages/Requests.tsx', 
    /showToast\('Request barang baru berhasil dikirim'\);/g, 
    "showToast(t('toast.requests.newRequestSuccess'));");

// StockOpname
replaceFile('frontend/src/pages/StockOpname.tsx', 
    /showToast\('Gagal update item: ' \+ \(err\.message \|\| 'Terjadi kesalahan'\), 'error'\);/g, 
    "showToast(t('toast.stockOpname.updateFailed') + (err.message || t('toast.common.errorOccurred')), 'error');");

replaceFile('frontend/src/pages/StockOpname.tsx', 
    /showToast\('Berhasil finalisasi'\);/g, 
    "showToast(t('toast.stockOpname.finalizeSuccess'));");

replaceFile('frontend/src/pages/StockOpname.tsx', 
    /showToast\(err\.message \|\| 'Gagal finalize', 'error'\);/g, 
    "showToast(err.message || t('toast.stockOpname.finalizeFailed'), 'error');");

console.log('TSX files patched');
