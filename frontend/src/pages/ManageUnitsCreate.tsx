import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { createUnit } from '../api/units.api';
import { useTranslation } from '../hooks/useTranslation';

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ManageUnitsCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState({
    unitName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { unitName, username, password, confirmPassword } = formValues;
    if (!unitName || !username || !password || !confirmPassword) {
      setFormError('Semua field wajib diisi');
      setSuccess(null);
      return;
    }
    if (password.length < 6) {
      setFormError('Password minimal 6 karakter');
      setSuccess(null);
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok');
      setSuccess(null);
      return;
    }
    setFormError(null);
    setSaving(true);
    createUnit({ unitName, username, password })
      .then(() => {
        setSuccess('Akun unit berhasil dibuat');
        setFormValues({ unitName: '', username: '', password: '', confirmPassword: '' });
        navigate('/manage-units', { state: { refresh: true } });
      })
      .catch(() => {
        setFormError('Gagal membuat akun unit (server)');
        setSuccess(null);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="history-page" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="modal-backdrop" onClick={() => navigate('/manage-units')}>
        <div className="unit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="unit-modal__header">
            <div>
              <h2 className="unit-modal__title">{t('units.addUnit')}</h2>
              <p className="unit-modal__description">{t('units.addUnitDesc')}</p>
            </div>
            <button type="button" aria-label="Close modal" className="unit-modal__close" onClick={() => navigate('/manage-units')}>
              <XIcon />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="unit-modal__body">
              <div className="unit-modal__field">
                <label className="form-label">{t('settings.name')}</label>
                <input
                  className="unit-modal__input"
                  placeholder="Enter unit name"
                  value={formValues.unitName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, unitName: e.target.value }))}
                  disabled={saving}
                />
              </div>
              
              <div className="unit-modal__field">
                <label className="form-label">{t('settings.username')}</label>
                <input
                  className="unit-modal__input"
                  placeholder="Enter username for login"
                  value={formValues.username}
                  onChange={(e) => setFormValues(prev => ({ ...prev, username: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="unit-modal__field">
                <label className="form-label">{t('units.newPassword')}</label>
                <div className="unit-modal__password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="unit-modal__input"
                    placeholder="Enter new password"
                    value={formValues.password}
                    onChange={(e) => setFormValues(prev => ({ ...prev, password: e.target.value }))}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="unit-modal__password-toggle"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="unit-modal__field">
                <label className="form-label">{t('units.confirmPassword')}</label>
                <div className="unit-modal__password-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="unit-modal__input"
                    placeholder="Confirm new password"
                    value={formValues.confirmPassword}
                    onChange={(e) => setFormValues(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="unit-modal__password-toggle"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {(formError || success) && (
                <div className="items-meta" aria-live="polite" style={{ marginTop: '-8px' }}>
                  {formError && <span className="danger-text" role="alert">{formError}</span>}
                  {success && <span role="status" style={{ color: 'var(--accent)' }}>{success}</span>}
                </div>
              )}
            </div>

            <div className="unit-modal__footer">
              <Button type="button" variant="secondary" onClick={() => navigate('/manage-units')} disabled={saving}>
                {t('units.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? t('settings.saving') : t('units.addUnit')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageUnitsCreate;
