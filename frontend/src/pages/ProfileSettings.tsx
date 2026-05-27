import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuth from '../hooks/useAuth';
import Modal from '../components/ui/Modal';
import { updateProfile, deleteAccount } from '../api/users.api';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../hooks/useTranslation';

const ProfileSettings = () => {
	const { user, updateUser, logout } = useAuth();
	const navigate = useNavigate();
	const { t, language, setLanguage } = useTranslation();

	const [name, setName] = useState('');
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState<string | null>(null);
	const { showToast } = useToast();
	const [saving, setSaving] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// Password for deletion confirmation
	const [deletePassword, setDeletePassword] = useState('');

	// Initialize state from auth context
	useEffect(() => {
		if (user) {
			setName(user.name);
			setUsername(user.username);
			setEmail(user.email ?? '');
		}
	}, [user]);

	const handleSave = async () => {
		if (!name.trim() || !username.trim()) {
			showToast('Name dan Username wajib diisi');
			setMessage(null);
			return;
		}


		setMessage(null);
		setSaving(true);

		try {
			const trimmedEmail = email.trim();
			const updatedUser = await updateProfile({
				name,
				username,
				email: trimmedEmail === '' ? null : trimmedEmail,
			});
			updateUser(updatedUser); // Update context instantly
			setMessage(t('settings.profileSaved'));
		} catch (err: any) {
			const msg = typeof err?.message === 'string' ? (() => { try { return JSON.parse(err.message).message; } catch { return err.message; } })() : 'Gagal menyimpan profil';
			showToast(msg || 'Gagal menyimpan profil');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		setDeletePassword('');

		setShowConfirm(true);
	};

	const confirmDelete = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!deletePassword) {
			showToast('Password diperlukan untuk konfirmasi penghapusan');
			return;
		}

		setMessage(null);

		setSaving(true);

		try {
			await deleteAccount(deletePassword);
			await logout(); // Clear context and redirect
			navigate('/login');
		} catch (err: any) {
			const msg = typeof err?.message === 'string' ? (() => { try { return JSON.parse(err.message).message; } catch { return err.message; } })() : 'Gagal menghapus akun. Password mungkin salah.';
			showToast(msg || 'Gagal menghapus akun. Password mungkin salah.');
			setSaving(false);
		}
	};

	const cancelDelete = () => {
		setShowConfirm(false);
		setDeletePassword('');

	};

	return (
		<div className="settings-page">
			<div className="settings-card">
				<div className="settings-title-row">
					<span className="settings-icon" aria-hidden>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
							<rect x="5" y="3" width="14" height="18" rx="2" />
							<path d="M9 7h6M9 11h6M9 15h4" />
						</svg>
					</span>
					<span className="settings-title">{t('settings.profileSettings')}</span>
				</div>

				<div className="settings-header">
					<h1 className="settings-heading">{t('settings.settingsTitle')}</h1>
					<p className="settings-subtitle">{t('settings.settingsSubtitle')}</p>
				</div>

				<div className="settings-tabs">
					<Link className="settings-tab is-active" to="/settings">
						{t('settings.tabProfile')}
					</Link>
					<Link className="settings-tab" to="/settings/password">
						{t('settings.tabPassword')}
					</Link>
				</div>
				
				<div className="settings-section">
					<p className="section-kicker">{t('settings.preferences')}</p>
					<p className="section-muted">{t('settings.preferencesDesc')}</p>

					<div className="settings-grid">
						<label className="settings-field">
							<span className="settings-label">{t('settings.language')}</span>
							<select
								className="input-control settings-input"
								value={language}
								onChange={(e) => setLanguage(e.target.value as 'en' | 'id')}
							>
								<option value="id">Bahasa Indonesia</option>
								<option value="en">English</option>
							</select>
						</label>
					</div>
				</div>

				<div className="settings-section">
					<p className="section-kicker">{t('settings.profileInfo')}</p>
					<p className="section-muted">{t('settings.profileInfoDesc')}</p>

					<div className="settings-grid">
						<label className="settings-field">
							<span className="settings-label">{t('settings.name')}</span>
							<input
								className="input-control settings-input"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</label>

						<label className="settings-field">
							<span className="settings-label">{t('settings.username')}</span>
							<input
								className="input-control settings-input"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</label>

						<label className="settings-field settings-field--full">
							<span className="settings-label">{t('settings.emailOptional')}</span>
							<input
								type="email"
								className="input-control settings-input"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={t('settings.emailPlaceholder')}
								autoComplete="email"
							/>
						</label>
					</div>

					<div className="settings-actions">
						{message && <p className="items-meta text-success" role="status">{message}</p>}

						<Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
							{saving ? t('settings.saving') : t('settings.save')}
						</Button>
					</div>
				</div>

				<div className="settings-section">
					<p className="section-kicker">{t('settings.deleteAccount')}</p>
					<p className="section-muted">{t('settings.deleteAccountDesc')}</p>

					<div className="danger-card">
						<p className="danger-title">{t('settings.warning')}</p>
						<p className="danger-text">{t('settings.warningDesc')}</p>
						<Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>{t('settings.deleteAccountBtn')}</Button>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showConfirm}
				onClose={cancelDelete}
				title={t('settings.deleteConfirmTitle')}
				footer={
					<div className="modal-actions">
						<Button type="button" variant="secondary" onClick={cancelDelete}>{t('settings.cancel')}</Button>
						<Button type="submit" form="delete-form" variant="danger" disabled={saving}>
							{saving ? t('settings.deleting') : t('settings.deletePermanent')}
						</Button>
					</div>
				}
			>
				<div className="mb-4">
					<p className="modal-kicker">{t('settings.securityConfirm')}</p>
					<p className="modal-helper-text">
						{t('settings.securityConfirmDesc')}
					</p>

					<form id="delete-form" onSubmit={confirmDelete}>
						<div className="form-group mt-4">
							<label htmlFor="del-password">{t('settings.yourPassword')}</label>
							<Input
								id="del-password"
								type="password"
								placeholder={t('settings.passwordPlaceholder')}
								value={deletePassword}
								onChange={(e) => setDeletePassword(e.target.value)}
								required
								autoFocus
							/>
						</div>
					</form>
				</div>
			</Modal>
		</div>
	);
};

export default ProfileSettings;
