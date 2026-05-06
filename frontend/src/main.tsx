import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme';
import './styles.css';
import './dashboard-utilities.css';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import ErrorBoundary from './components/ui/ErrorBoundary';

const cleanupStaleDevServiceWorkers = async () => {
	if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;

	const registrations = await navigator.serviceWorker.getRegistrations();
	await Promise.all(registrations.map((registration) => registration.unregister()));

	if ('caches' in window) {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
	}
};

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element not found');
}

cleanupStaleDevServiceWorkers()
	.catch((error) => {
		console.warn('Failed to clean stale dev service workers', error);
	})
	.finally(() => {
		createRoot(rootElement).render(
			<React.StrictMode>
				<BrowserRouter>
					<AuthProvider>
						<ThemeProvider>
							<ToastProvider>
								<ErrorBoundary>
									<App />
									<UpdatePrompt />
								</ErrorBoundary>
							</ToastProvider>
						</ThemeProvider>
					</AuthProvider>
				</BrowserRouter>
			</React.StrictMode>
		);
	});
