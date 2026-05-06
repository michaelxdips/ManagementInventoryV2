import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useAuth from '../hooks/useAuth';
import Modal from '../components/ui/Modal';
import { updateProfile, deleteAccount } from '../api/users.api';
import { useToast } from '../components/ui/Toast';

const ProfileSettings = () => {
	const { user, updateUser, logout } = useAuth();
	const navigate = useNavigate();

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
			setMessage('Profil berhasil disimpan');
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
			// setShowConfirm(false); // Keep open on error so user can retry
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
					<span className="settings-title">Profile settings</span>
				</div>

				<div className="settings-header">
					<h1 className="settings-heading">Settings</h1>
					<p className="settings-subtitle">Manage your profile and account settings</p>
				</div>

				<div className="settings-tabs">
					<Link className="settings-tab is-active" to="/settings">
						Profile
					</Link>
					<Link className="settings-tab" to="/settings/password">
						Password
					</Link>
				</div>

				<div className="settings-section">
					<p className="section-kicker">Profile information</p>
					<p className="section-muted">Update your name, username, and email for notifikasi status permintaan</p>

					<div className="settings-grid">
						<label className="settings-field">
							<span className="settings-label">Name</span>
							<input
								className="input-control settings-input"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</label>

						<label className="settings-field">
							<span className="settings-label">Username</span>
							<input
								className="input-control settings-input"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</label>

						<label className="settings-field settings-field--full">
							<span className="settings-label">Email (opsional)</span>
							<input
								type="email"
								className="input-control settings-input"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="nama@perusahaan.com"
								autoComplete="email"
							/>
						</label>
					</div>

					<div className="settings-actions">
						{message && <p className="items-meta text-success" role="status">{message}</p>}

						<Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
							{saving ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</div>

				<div className="settings-section">
					<p className="section-kicker">Delete account</p>
					<p className="section-muted">Delete your account and all of its resources</p>

					<div className="danger-card">
						<p className="danger-title">Warning</p>
						<p className="danger-text">Please proceed with caution, this cannot be undone.</p>
						<Button type="button" variant="danger" onClick={handleDelete} disabled={saving}>Delete account</Button>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={showConfirm}
				onClose={cancelDelete}
				title="Hapus akun?"
				footer={
					<div className="modal-actions">
						<Button type="button" variant="secondary" onClick={cancelDelete}>Batal</Button>
						<Button type="submit" form="delete-form" variant="danger" disabled={saving}>
							{saving ? 'Menghapus...' : 'Hapus Permanen'}
						</Button>
					</div>
				}
			>
				<div className="mb-4">
					<p className="modal-kicker">Konfirmasi Keamanan</p>
					<p className="modal-helper-text">
						Tindakan ini tidak dapat dibatalkan. Masukkan password Anda untuk konfirmasi.
					</p>



					<form id="delete-form" onSubmit={confirmDelete}>
						<div className="form-group mt-4">
							<label htmlFor="del-password">Password Anda</label>
							<Input
								id="del-password"
								type="password"
								placeholder="Masukkan password saat ini"
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
