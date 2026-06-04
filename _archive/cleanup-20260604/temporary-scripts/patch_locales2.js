const fs = require('fs');
const path = require('path');

const updateLocale = (localeFile, updates) => {
  const content = fs.readFileSync(localeFile, 'utf-8');
  const json = JSON.parse(content);
  
  for (const [ns, keys] of Object.entries(updates)) {
    if (!json[ns]) json[ns] = {};
    for (const [k, v] of Object.entries(keys)) {
      json[ns][k] = v;
    }
  }
  fs.writeFileSync(localeFile, JSON.stringify(json, null, 2));
};

const enUpdates = {
  common: {
    apply: "Apply",
    reset: "Reset",
    delete: "Delete",
    continue: "Continue",
    search: "Search",
    action: "Action",
    all: "All",
    from: "From Date",
    to: "To Date",
    date: "Date",
    status: "Status",
    unit: "Unit",
    quantity: "Quantity",
    noChangedData: "No changed data"
  },
  status: {
    pending: "Pending",
    review: "Review",
    approved: "Approved",
    rejected: "Rejected",
    draft: "Draft",
    finalized: "Finalized"
  },
  items: {
    sortAsc: "Smallest Quantity",
    sortDesc: "Largest Quantity",
    apply: "Apply",
    takeItem: "Take Item",
    outOfStock: "Out of Stock",
    searchPlaceholder: "Search item or item code...",
    showing: "Showing {{from}} - {{to}} of {{total}} items",
    userNote: "Click \"Take\" to submit a request. An admin will approve your request."
  },
  requests: {
    myRequests: "My Requests",
    takeItem: "Take Item",
    newItemRequest: "New Item Request",
    processing: "Processing",
    history: "History",
    newRequest: "New Request",
    closeForm: "Close Form",
    submitRequest: "Submit Request",
    itemName: "Item Name",
    description: "Description",
    unit: "Unit",
    category: "Category",
    requestReason: "Request Reason",
    date: "Date",
    quantity: "Quantity",
    receiver: "Receiver",
    department: "Department",
    status: "Status",
    reason: "Reason",
    requestNewItemTitle: "Request New Item",
    requestNewItemDesc: "Request items that are not yet in inventory. Use the \"Take Item\" tab for existing items.",
    descExample: "Example: Blue Board Marker",
    descAddExample: "Additional description (optional)",
    unitExample: "Example: pcs, pack, rim (optional)",
    catExample: "Example: ATK, Electronics (optional)",
    reasonExample: "Explain the request reason (optional)"
  },
  calendar: {
    title: "Request Calendar",
    desc: "Request overview based on operational date, status, and daily details.",
    today: "Today",
    totalRequests: "Total Requests",
    filterStatus: "Filter Status",
    filterDesc: "Select a status to focus badges and calendar details.",
    all: "All",
    dailyDetail: "Daily Detail",
    requestItem: "request",
    thisMonthStatus: "This month status"
  },
  stockOpname: {
    title: "Stock Opname",
    desc: "Adjust physical stock against system stock.",
    startNewSession: "Start New Session",
    sessionNotePlaceholder: "Session Note / Name (Optional)",
    startOpname: "Start Opname",
    id: "ID",
    date: "Date",
    note: "Note",
    status: "Status",
    action: "Action",
    continue: "Continue",
    delete: "Delete",
    viewResult: "View Result"
  },
  audit: {
    title: "Audit Trail",
    desc: "Detailed record of all data modification activities.",
    searchPlaceholder: "Search table, user, or record ID...",
    action: "Action",
    all: "All",
    time: "Time",
    tableId: "Table / ID",
    user: "User",
    changes: "Changes",
    empty: "No changed data"
  },
  information: {
    latestInfo: "Latest Info",
    activeAnnouncements: "Active Announcements",
    noActiveAnnouncements: "No active announcements."
  },
  dashboard: {
    greetingMorning: "Good Morning",
    greetingAfternoon: "Good Afternoon",
    greetingEvening: "Good Evening",
    summary: "Here is the latest inventory summary.",
    refresh: "Refresh",
    newRequest: "New Request",
    totalRequests: "Total Requests",
    pendingValidation: "Pending Validation",
    approved: "Approved",
    rejected: "Rejected",
    announcements: "Announcements",
    frequentlyRequested: "Frequently Requested",
    frequentSubtitle: "Items most requested by your unit.",
    requestAgain: "Request Again",
    requestedCount: "Requested {{count}} times",
    submitted: "Submitted",
    review: "Review",
    finished: "Finished"
  },
  approval: {
    continueReview: "Continue Review",
    empty: "No requests found"
  }
};

const idUpdates = {
  common: {
    apply: "Terapkan",
    reset: "Reset",
    delete: "Hapus",
    continue: "Lanjutkan",
    search: "Cari",
    action: "Aksi",
    all: "Semua",
    from: "Dari Tanggal",
    to: "Hingga Tanggal",
    date: "Tanggal",
    status: "Status",
    unit: "Unit",
    quantity: "Jumlah",
    noChangedData: "Tidak ada data berubah"
  },
  status: {
    pending: "Menunggu",
    review: "Review",
    approved: "Disetujui",
    rejected: "Ditolak",
    draft: "Draft",
    finalized: "Selesai"
  },
  items: {
    sortAsc: "Jumlah Terkecil",
    sortDesc: "Jumlah Terbesar",
    apply: "Terapkan",
    takeItem: "Ambil Barang",
    outOfStock: "Stok Habis",
    searchPlaceholder: "Cari barang atau kode barang...",
    showing: "Menampilkan {{from}} - {{to}} dari {{total}} barang",
    userNote: "Klik \"Ambil\" untuk mengajukan permintaan. Admin akan menyetujui permintaan Anda."
  },
  requests: {
    myRequests: "Permintaan Saya",
    takeItem: "Ambil Barang",
    newItemRequest: "Request Barang Baru",
    processing: "Sedang diproses",
    history: "Riwayat",
    newRequest: "Permintaan Baru",
    closeForm: "Tutup Form",
    submitRequest: "Kirim Request",
    itemName: "Nama Barang",
    description: "Deskripsi",
    unit: "Satuan",
    category: "Kategori",
    requestReason: "Alasan Request",
    date: "Tanggal",
    quantity: "Jumlah",
    receiver: "Penerima",
    department: "Unit",
    status: "Status",
    reason: "Alasan",
    requestNewItemTitle: "Request Barang Baru",
    requestNewItemDesc: "Request barang yang belum ada di inventory. Barang yang sudah ada gunakan tab \"Ambil Barang\".",
    descExample: "Contoh: Spidol Boardmarker Biru",
    descAddExample: "Deskripsi tambahan (opsional)",
    unitExample: "Contoh: pcs, pack, rim (opsional)",
    catExample: "Contoh: ATK, Elektronik (opsional)",
    reasonExample: "Jelaskan alasan request (opsional)"
  },
  calendar: {
    title: "Kalender Permintaan",
    desc: "Ringkasan permintaan barang berdasarkan tanggal operasional, status, dan detail harian.",
    today: "Hari Ini",
    totalRequests: "Total Permintaan",
    filterStatus: "Filter Status",
    filterDesc: "Pilih status untuk memfokuskan badge dan detail pada kalender.",
    all: "Semua",
    dailyDetail: "Detail Harian",
    requestItem: "permintaan",
    thisMonthStatus: "Status bulan ini"
  },
  stockOpname: {
    title: "Stock Opname",
    desc: "Sesuaikan stok fisik dengan data sistem.",
    startNewSession: "Mulai Sesi Baru",
    sessionNotePlaceholder: "Catatan / Nama Sesi (Opsional)",
    startOpname: "Mulai Opname",
    id: "ID",
    date: "Tanggal",
    note: "Catatan",
    status: "Status",
    action: "Aksi",
    continue: "Lanjutkan",
    delete: "Hapus",
    viewResult: "Lihat Hasil"
  },
  audit: {
    title: "Log Audit",
    desc: "Rekam jejak seluruh aktivitas modifikasi data.",
    searchPlaceholder: "Cari tabel, pengguna, atau ID record...",
    action: "Aksi",
    all: "Semua",
    time: "Waktu",
    tableId: "Tabel / ID",
    user: "Pengguna",
    changes: "Perubahan",
    empty: "Tidak ada data berubah"
  },
  information: {
    latestInfo: "Info Terbaru",
    activeAnnouncements: "Pengumuman Aktif",
    noActiveAnnouncements: "Belum ada pengumuman aktif."
  },
  dashboard: {
    greetingMorning: "Selamat Pagi",
    greetingAfternoon: "Selamat Siang",
    greetingEvening: "Selamat Malam",
    summary: "Berikut ringkasan inventaris terbaru.",
    refresh: "Refresh",
    newRequest: "Permintaan Baru",
    totalRequests: "Total Permintaan",
    pendingValidation: "Menunggu Validasi",
    approved: "Disetujui",
    rejected: "Ditolak",
    announcements: "Pengumuman",
    frequentlyRequested: "Sering Diminta",
    frequentSubtitle: "Barang yang paling sering diminta oleh unit Anda.",
    requestAgain: "Minta Lagi",
    requestedCount: "Diminta {{count}} kali",
    submitted: "Diajukan",
    review: "Review",
    finished: "Selesai"
  },
  approval: {
    continueReview: "Lanjut Review",
    empty: "Tidak ada permintaan"
  }
};

updateLocale(path.join(__dirname, 'frontend/src/locales/en.json'), enUpdates);
updateLocale(path.join(__dirname, 'frontend/src/locales/id.json'), idUpdates);

console.log("JSONs patched successfully.");
