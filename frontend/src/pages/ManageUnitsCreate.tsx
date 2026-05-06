import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { createUnit } from '../api/units.api';

const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9.5" cy="7" r="3.5" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const ManageUnitsCreate = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    unitName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

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
    <div className="history-page">
      <div className="requests-header section-spacer-md">
        <h2 className="history-title">Manage User</h2>
        <Button type="button" variant="ghost" onClick={() => navigate('/manage-units')}>
          Kembali ke list
        </Button>
      </div>

      <div className="history-card">
        <div className="history-title title-inline">
          <UserPlusIcon /> <span>Form Tambah User</span>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field field-full">
            <span className="form-label">Unit Name</span>
            <input
              className="input-control"
              placeholder="Enter unit name"
              value={formValues.unitName}
              onChange={(e) => handleChange('unitName', e.target.value)}
            />
          </label>

          <label className="form-field field-full">
            <span className="form-label">Username</span>
            <input
              className="input-control"
              placeholder="Enter username"
              value={formValues.username}
              onChange={(e) => handleChange('username', e.target.value)}
            />
          </label>

          <label className="form-field field-full">
            <span className="form-label">Password</span>
            <input
              className="input-control"
              type="password"
              placeholder="Enter password"
              value={formValues.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
          </label>

          <label className="form-field field-full">
            <span className="form-label">Confirm Password</span>
            <input
              className="input-control"
              type="password"
              placeholder="Confirm password"
              value={formValues.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
            />
          </label>

          <div className="form-actions form-actions-wide">
            <div className="items-meta" aria-live="polite">
              {formError && <span className="danger-text" role="alert">{formError}</span>}
              {success && <span role="status">{success}</span>}
            </div>
            <Button type="submit" variant="secondary" className="button-wide" disabled={saving}>
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageUnitsCreate;
