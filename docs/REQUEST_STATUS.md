# Alur status permintaan barang (`requests`)

## Nilai enum di database

`PENDING` → `APPROVAL_REVIEW` → **`APPROVED`** atau **`REJECTED`**  
Selain itu ada **`FINISHED`** di skema DB sebagai nilai tambahan.

## Perilaku API saat ini (sumber kebenaran)

| Transisi | Dipicu oleh |
|----------|-------------|
| `PENDING` | User membuat permintaan ambil barang. |
| `APPROVAL_REVIEW` | Admin memindahkan ke tahap review (alur dua langkah). |
| `APPROVED` | Admin **menyetujui** (tanpa review) **atau** **mengfinalisasi** jumlah di halaman finalisasi; stok berkurang dan barang keluar tercatat. |
| `REJECTED` | Admin menolak (dengan alasan opsional); stok tidak berubah. |
| `FINISHED` | **Tidak di-set oleh kode approval saat ini.** Disimpan di enum untuk data lama, integrasi masa depan, atau update manual. Jika nanti bisnis membutuhkan “barang sudah diambil / case ditutup”, tambahkan endpoint atau job yang mengubah `APPROVED` → `FINISHED` secara eksplisit. |

## Ringkasan

- **Disetujui secara operasional** = status **`APPROVED`** (stok sudah dikurangi sesuai alur).  
- **`FINISHED`** = opsional/legacy; dashboard user menganggap `APPROVED` dan `FINISHED` sama untuk **hitungan “disetujui/selesai”** agar angka konsisten jika ada data `FINISHED`.
