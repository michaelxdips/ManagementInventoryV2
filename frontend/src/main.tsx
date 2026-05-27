import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme';
import './styles.css';
import './dashboard-utilities.css';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './components/ui/Toast';
import { UpdatePrompt } from './components/UpdatePrompt';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

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
		if (import.meta.env.PROD) {
			registerSW({ immediate: true });
		}
		createRoot(rootElement).render(
			<React.StrictMode>
				<BrowserRouter>
					<AuthProvider>
						<LanguageProvider>
							<ThemeProvider>
								<ToastProvider>
									<ErrorBoundary>
										<App />
										<UpdatePrompt />
									</ErrorBoundary>
								</ToastProvider>
							</ThemeProvider>
						</LanguageProvider>
					</AuthProvider>
				</BrowserRouter>
			</React.StrictMode>
		);
	});
