import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { createBarangMasuk } from '../api/barangMasuk.api';
import { useToast } from '../components/ui/Toast';
import { getWIBInputDate } from '../utils/dateUtils';
import { useTranslation } from '../hooks/useTranslation';

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
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nama_barang || !formData.satuan || formData.qty <= 0) {
            showToast(t('inbound.errorRequiredFields'));
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
            showToast(err.message || t('inbound.errorSaveFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="history-page">
            <div className="history-card" style={{ maxWidth: '600px' }}>
                <h2 className="history-title">{t('inbound.createTitle')}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    {t('inbound.createSubtitle')}
                </p>



                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                        <label htmlFor="nama_barang">{t('inbound.itemNameLabel')}</label>
                        <Input
                            id="nama_barang"
                            type="text"
                            value={formData.nama_barang}
                            onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                            placeholder={t('inbound.itemNamePlaceholder')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="kode_barang">{t('inbound.itemCodeLabel')}</label>
                        <Input
                            id="kode_barang"
                            type="text"
                            value={formData.kode_barang}
                            onChange={(e) => setFormData({ ...formData, kode_barang: e.target.value })}
                            placeholder={t('inbound.itemCodePlaceholder')}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tanggal">{t('inbound.dateLabel')}</label>
                        <Input
                            id="tanggal"
                            type="date"
                            value={formData.tanggal}
                            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="qty">{t('inbound.qtyLabel')}</label>
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
                        <label htmlFor="satuan">{t('inbound.unitLabel')}</label>
                        <Input
                            id="satuan"
                            type="text"
                            value={formData.satuan}
                            onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                            placeholder={t('inbound.unitPlaceholder')}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lokasi_simpan">{t('inbound.locationLabel')}</label>
                        <Input
                            id="lokasi_simpan"
                            type="text"
                            value={formData.lokasi_simpan}
                            onChange={(e) => setFormData({ ...formData, lokasi_simpan: e.target.value })}
                            placeholder={t('inbound.locationPlaceholder')}
                        />
                    </div>

                    <div className="form-actions">
                        <Button type="submit" disabled={loading}>
                            {loading ? t('inbound.saving') : t('inbound.save')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                            {t('inbound.cancel')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BarangMasukCreate;
