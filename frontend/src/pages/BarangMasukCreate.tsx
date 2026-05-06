import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { createBarangMasuk } from '../api/barangMasuk.api';
import { useToast } from '../components/ui/Toast';
import { getWIBInputDate } from '../utils/dateUtils';

const BarangMasukCreate = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        nama_barang: '',
        kode_barang: '',
        qty: 1,
        satuan: '',
        lokasi_simpan: '',
        tanggal: getWIBInputDate(),
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nama_barang || !formData.satuan || formData.qty <= 0) {
            showToast('Nama barang, jumlah, dan satuan wajib diisi');
            return;
        }

        setLoading(true);
        try {
            const result = await createBarangMasuk(formData);
            showToast(result.message, 'success');
            // Reset form
            setFormData({
                nama_barang: '',
                kode_barang: '',
                qty: 1,
                satuan: '',
                lokasi_simpan: '',
                tanggal: getWIBInputDate(),
            });
            // Redirect after 2 seconds
            setTimeout(() => navigate('/history-masuk'), 2000);
        } catch (err: any) {
            showToast(err.message || 'Gagal mencatat barang masuk');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="history-page">
            <div className="history-card" style={{ maxWidth: '600px' }}>
                <h2 className="history-title">Tambah Barang Masuk</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Catat barang yang masuk ke inventory untuk menambah stok.
                </p>



                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                        <label htmlFor="nama_barang">Nama Barang *</label>
                        <Input
                            id="nama_barang"
                            type="text"
                            value={formData.nama_barang}
                            onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                            placeholder="Contoh: Kertas A4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="kode_barang">Kode Barang</label>
                        <Input
                            id="kode_barang"
                            type="text"
                            value={formData.kode_barang}
                            onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                            placeholder="Contoh: KRT-A4-001"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tanggal">Tanggal *</label>
                        <Input
                            id="tanggal"
                            type="date"
                            value={formData.tanggal}
                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="qty">Jumlah *</label>
                        <Input
                            id="qty"
                            type="number"
                            min="1"
                            value={formData.qty}
                            onChange={(e) => setFormData({ ...formData, qty: Math.max(1, parseInt(e.target.value) || 1) })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="satuan">Satuan *</label>
                        <Input
                            id="satuan"
                            type="text"
                            value={formData.satuan}
                            onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                            placeholder="Contoh: rim, pcs, kotak"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lokasi_simpan">Lokasi Simpan</label>
                        <Input
                            id="lokasi_simpan"
                            type="text"
                            value={formData.lokasi_simpan}
                            onChange={(e) => setFormData({ ...formData, lokasi_simpan: e.target.value })}
                            placeholder="Contoh: Lemari A1"
                        />
                    </div>

                    <div className="form-actions">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                            Batal
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BarangMasukCreate;
