const fs = require('fs');

const idPath = 'src/locales/id.json';
const enPath = 'src/locales/en.json';

let idData = JSON.parse(fs.readFileSync(idPath, 'utf8'));
let enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const commonKeys = {
  inventory: {
    title: 'Daftar ATK',
    searchPlaceholder: 'Cari Barang atau Kode Barang...',
    sortAsc: 'Jumlah Terkecil',
    sortDesc: 'Jumlah Terbesar',
    apply: 'Terapkan',
    pdf: 'PDF',
    excel: 'Excel',
    importExcel: 'Import Excel',
    superadminNote: 'ℹ️ Hanya superadmin yang dapat mengubah stok. Silakan hubungi superadmin untuk update stok.',
    userNote: 'ℹ️ Klik "Ambil" untuk mengajukan permintaan barang. Admin akan menyetujui permintaan Anda.',
    noData: 'Tidak ada data',
    noDataDescSearch: 'Coba ubah kata kunci, urutan, atau reset filter dashboard.',
    noDataDescEmpty: 'Data ATK akan tampil setelah item ditambahkan atau diimpor.',
    columns: {
      no: 'No',
      itemName: 'Nama Barang',
      itemCode: 'Kode Barang',
      qty: 'Jumlah',
      unit: 'Satuan',
      location: 'Lokasi Simpan',
      action: 'Action',
      date: 'Tanggal',
      receiver: 'Penerima',
      dept: 'Unit'
    },
    actions: {
      edit: 'Edit',
      delete: 'Hapus',
      take: 'Ambil',
      outOfStock: 'Habis',
      cancel: 'Batal',
      save: 'Simpan',
      saving: 'Menyimpan...',
      approve: 'Setujui',
      reject: 'Tolak'
    },
    modals: {
      editTitle: 'Edit Barang',
      requestTitle: 'Ambil Barang',
      qtyRequest: 'Jumlah Request',
      stockAvailable: 'Stok tersedia',
      processRequest: 'Memproses...',
      submitRequest: 'Ajukan Permintaan',
      minStockLabel: 'Peringatan Stok Minimum',
      minStockHint: 'Barang akan menyala kuning jika stok menyentuh angka ini atau di bawahnya.'
    }
  },
  approval: {
    title: 'Permintaan Barang Keluar',
    subtitle: 'Setujui permintaan untuk mengurangi stok dan mencatat barang keluar.',
    searchPlaceholder: 'Cari nama barang, penerima, atau unit...',
    selected: 'dipilih',
    approveSelected: 'Setujui Terpilih (Final)',
    rejectSelected: 'Tolak Terpilih',
    noData: 'Tidak ada permintaan yang menunggu persetujuan',
    noDataDesc: 'Permintaan baru akan muncul otomatis saat user mengajukan barang keluar.',
    rejectReason: 'Alasan penolakan (opsional)'
  },
  history: {
    titleIn: 'Riwayat Barang Masuk',
    subtitleIn: 'Data historis penambahan stok ATK dari waktu ke waktu.',
    titleOut: 'Riwayat Barang Keluar',
    subtitleOut: 'Data historis permintaan barang keluar yang telah selesai diproses.',
    filterByStatus: 'Filter Status',
    allStatuses: 'Semua Status'
  },
  requests: {
    title: 'Daftar Request Saya',
    subtitle: 'Pantau status permintaan barang Anda di sini.',
    noData: 'Belum ada request',
    noDataDesc: 'Anda belum membuat permintaan apapun.'
  },
  stockOpname: {
    title: 'Stock Opname',
    subtitle: 'Sesuaikan stok fisik dengan data sistem.',
    recordAdjustment: 'Catat Penyesuaian',
    history: 'Riwayat Penyesuaian',
    noData: 'Tidak ada data barang',
    noDataDesc: 'Silakan tambahkan data barang terlebih dahulu.',
    physicalStock: 'Stok Fisik',
    systemStock: 'Stok Sistem',
    discrepancy: 'Selisih',
    notes: 'Keterangan / Catatan',
    submit: 'Simpan Penyesuaian'
  }
};

const enKeys = {
  inventory: {
    title: 'Stationery List',
    searchPlaceholder: 'Search Item or Code...',
    sortAsc: 'Lowest Quantity',
    sortDesc: 'Highest Quantity',
    apply: 'Apply',
    pdf: 'PDF',
    excel: 'Excel',
    importExcel: 'Import Excel',
    superadminNote: 'ℹ️ Only superadmins can modify stock. Please contact a superadmin to update stock.',
    userNote: 'ℹ️ Click "Take" to submit a request. An admin will approve your request.',
    noData: 'No data',
    noDataDescSearch: 'Try changing keywords, sorting, or resetting the dashboard filter.',
    noDataDescEmpty: 'Items will appear after being added or imported.',
    columns: {
      no: 'No',
      itemName: 'Item Name',
      itemCode: 'Item Code',
      qty: 'Quantity',
      unit: 'Unit',
      location: 'Storage Location',
      action: 'Action',
      date: 'Date',
      receiver: 'Receiver',
      dept: 'Department'
    },
    actions: {
      edit: 'Edit',
      delete: 'Delete',
      take: 'Take',
      outOfStock: 'Out of Stock',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      approve: 'Approve',
      reject: 'Reject'
    },
    modals: {
      editTitle: 'Edit Item',
      requestTitle: 'Take Item',
      qtyRequest: 'Request Qty',
      stockAvailable: 'Available stock',
      processRequest: 'Processing...',
      submitRequest: 'Submit Request',
      minStockLabel: 'Minimum Stock Alert',
      minStockHint: 'Item row will highlight in yellow if stock hits this number or below.'
    }
  },
  approval: {
    title: 'Outbound Requests',
    subtitle: 'Approve requests to deduct stock and record outbound items.',
    searchPlaceholder: 'Search item name, receiver, or department...',
    selected: 'selected',
    approveSelected: 'Approve Selected (Final)',
    rejectSelected: 'Reject Selected',
    noData: 'No pending approvals',
    noDataDesc: 'New requests will automatically appear when a user submits an outbound request.',
    rejectReason: 'Rejection reason (optional)'
  },
  history: {
    titleIn: 'Inbound History',
    subtitleIn: 'Historical data of stationery stock additions over time.',
    titleOut: 'Outbound History',
    subtitleOut: 'Historical data of completed outbound item requests.',
    filterByStatus: 'Filter Status',
    allStatuses: 'All Statuses'
  },
  requests: {
    title: 'My Requests',
    subtitle: 'Monitor your item request statuses here.',
    noData: 'No requests yet',
    noDataDesc: 'You have not created any requests yet.'
  },
  stockOpname: {
    title: 'Stock Opname',
    subtitle: 'Adjust physical stock with system data.',
    recordAdjustment: 'Record Adjustment',
    history: 'Adjustment History',
    noData: 'No items data',
    noDataDesc: 'Please add item data first.',
    physicalStock: 'Physical Stock',
    systemStock: 'System Stock',
    discrepancy: 'Discrepancy',
    notes: 'Notes / Remarks',
    submit: 'Save Adjustment'
  }
};

idData = { ...idData, ...commonKeys };
enData = { ...enData, ...enKeys };

fs.writeFileSync(idPath, JSON.stringify(idData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

console.log('Successfully updated id.json and en.json');
