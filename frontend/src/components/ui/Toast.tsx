import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'error' | 'success' | 'warning' | 'info';

type Toast = {
    id: number;
    message: string;
    type: ToastType;
};

type ToastContextValue = {
    showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'error') => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" aria-live="assertive">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onDismiss, 300); // Wait for exit animation
        }, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const icons: Record<ToastType, string> = {
        error: '✕',
        success: '✓',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`} role="alert">
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => { setExiting(true); setTimeout(onDismiss, 300); }} aria-label="Tutup">
                ×
            </button>
        </div>
    );
};

export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
