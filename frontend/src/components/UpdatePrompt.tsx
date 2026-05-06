import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    setShowPrompt(false);
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) return null;

  return (
    <aside className="update-prompt" role="status" aria-live="polite">
      <div className="update-prompt-copy">
        <strong className="update-prompt-title">🎉 Versi Baru Tersedia</strong>
        <p className="update-prompt-description">
          Update aplikasi untuk mendapatkan fitur terbaru dan perbaikan bug.
        </p>
      </div>
      <div className="update-prompt-actions">
        <button type="button" className="update-prompt-primary" onClick={handleUpdate}>
          Update Sekarang
        </button>
        <button type="button" className="update-prompt-secondary" onClick={handleDismiss}>
          Nanti
        </button>
      </div>
      {offlineReady && (
        <p className="update-prompt-ready">✓ App siap digunakan offline</p>
      )}
    </aside>
  );
}
