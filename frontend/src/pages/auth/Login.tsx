import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast';
import NetworkSignalBar from '../../components/ui/NetworkSignalBar';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTranslation } from '../../hooks/useTranslation';

const Login = () => {
  const { t } = useTranslation();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [remember, setRemember] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { status } = useNetworkStatus();
	const isConnectionUnavailable = status === 'offline' || status === 'server-down';

	useEffect(() => {
		if (isConnectionUnavailable) {
			showToast(t('toast.auth.noConnection'));
		}
	}, [isConnectionUnavailable, showToast]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isConnectionUnavailable) {
			showToast(t('toast.auth.loginDisabled'));
			return;
		}
		if (!username.trim() || !password.trim()) {
			showToast(t('toast.auth.credentialsRequired'));
			return;
		}
		if (password.length < 4) {
			showToast(t('toast.auth.passwordMinLength'));
			return;
		}
		setSubmitting(true);
		login({ username, password, remember })
			.then(() => navigate('/dashboard'))
			.catch(() => showToast(t('toast.auth.loginFailed')))
			.finally(() => setSubmitting(false));
	};

	return (
		<section className="auth-card">
			<NetworkSignalBar variant="login" />
			<div className="auth-icon" aria-hidden />
			<h1 className="auth-title">Log in to your account</h1>
			<p className="auth-subtitle">Enter your username and password below to log in</p>

			<form onSubmit={handleSubmit} noValidate>
				<div className="form-field">
					<label className="form-label" htmlFor="username">
						Username
					</label>
					<input
						id="username"
						name="username"
						className="input-control"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
						spellCheck="false"
						required
					/>
				</div>

				<div className="form-field">
					<label className="form-label" htmlFor="password">
						Password
					</label>
					<input
						id="password"
						name="password"
						className="input-control"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
					/>
				</div>

				<div className="auth-actions">
					<label className="checkbox">
						<input
							type="checkbox"
							checked={remember}
							onChange={(e) => setRemember(e.target.checked)}
						/>
						<span>Remember me</span>
					</label>
				</div>

				<button className="primary-button" type="submit" disabled={submitting || isConnectionUnavailable}>
					{isConnectionUnavailable ? 'Tidak terhubung' : submitting ? 'Logging in...' : 'Log in'}
				</button>
			</form>

			<p className="auth-footer">Management Inventory</p>
		</section>
	);
};

export default Login;
