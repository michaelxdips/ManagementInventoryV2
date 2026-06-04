const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const idPath = 'frontend/src/locales/id.json';
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

en.toast = {
  approval: {
    rejectFailed: "Failed to reject request",
    rejectSuccess: "Request rejected",
    approveFailed: "Failed to approve request"
  },
  audit: {
    exportExcelFailed: "Failed to export audit data to Excel",
    exportPdfFailed: "Failed to export audit data to PDF"
  },
  auth: {
    noConnection: "Not connected. Check network or ensure server is active.",
    loginDisabled: "Not connected. Login is disabled until connection is restored.",
    credentialsRequired: "Username and password are required",
    passwordMinLength: "Password must be at least 4 characters",
    loginFailed: "Login failed, please check your credentials"
  },
  inbound: {
    masterDataLoadFailed: "Failed to load master item data"
  },
  settings: {
    allFieldsRequired: "All fields are required",
    passwordMin6: "New password must be at least 6 characters",
    passwordMismatch: "Password confirmation does not match",
    passwordSuccess: "Password updated successfully",
    passwordFailed: "Failed to update password",
    profileFieldsRequired: "Name and Username are required",
    profileFailed: "Failed to save profile",
    deletePasswordRequired: "Password is required to confirm deletion",
    deleteFailed: "Failed to delete account. Password might be incorrect.",
    deleteSuperadminFailed: "Cannot delete the last superadmin"
  },
  requests: {
    nameRequired: "Item name is required",
    newRequestSuccess: "New item request sent successfully"
  },
  stockOpname: {
    updateFailed: "Failed to update item: ",
    finalizeSuccess: "Successfully finalized",
    finalizeFailed: "Failed to finalize"
  },
  common: {
    errorOccurred: "An error occurred"
  }
};

id.toast = {
  approval: {
    rejectFailed: "Gagal menolak permintaan",
    rejectSuccess: "Permintaan ditolak",
    approveFailed: "Gagal menyetujui permintaan"
  },
  audit: {
    exportExcelFailed: "Gagal mengekspor data audit ke Excel",
    exportPdfFailed: "Gagal mengekspor data audit ke PDF"
  },
  auth: {
    noConnection: "Tidak terhubung. Periksa jaringan atau pastikan server aktif.",
    loginDisabled: "Tidak terhubung. Login dinonaktifkan sampai koneksi kembali.",
    credentialsRequired: "Username dan password wajib diisi",
    passwordMinLength: "Password minimal 4 karakter",
    loginFailed: "Login gagal, periksa kembali kredensial"
  },
  inbound: {
    masterDataLoadFailed: "Gagal memuat master data barang"
  },
  settings: {
    allFieldsRequired: "Semua kolom wajib diisi",
    passwordMin6: "Password baru minimal 6 karakter",
    passwordMismatch: "Konfirmasi password tidak cocok",
    passwordSuccess: "Password berhasil diperbarui",
    passwordFailed: "Gagal memperbarui password",
    profileFieldsRequired: "Name dan Username wajib diisi",
    profileFailed: "Gagal menyimpan profil",
    deletePasswordRequired: "Password diperlukan untuk konfirmasi penghapusan",
    deleteFailed: "Gagal menghapus akun. Password mungkin salah.",
    deleteSuperadminFailed: "Tidak dapat menghapus superadmin terakhir"
  },
  requests: {
    nameRequired: "Nama barang wajib diisi",
    newRequestSuccess: "Request barang baru berhasil dikirim"
  },
  stockOpname: {
    updateFailed: "Gagal update item: ",
    finalizeSuccess: "Berhasil finalisasi",
    finalizeFailed: "Gagal finalize"
  },
  common: {
    errorOccurred: "Terjadi kesalahan"
  }
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(idPath, JSON.stringify(id, null, 2));
console.log('Locales updated for toast');
