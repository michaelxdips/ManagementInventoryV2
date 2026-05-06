import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
}

const Modal = ({ isOpen, onClose, title, children, footer, width = '500px' }: ModalProps) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle click outside
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="modal-content"
                style={{ maxWidth: width }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 id="modal-title" className="modal-title" style={{ margin: 0 }}>{title}</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Close modal"
                        style={{ padding: '4px 8px', fontSize: '18px', lineHeight: 1 }}
                    >
                        &times;
                    </Button>
                </div>

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="modal-actions" style={{ marginTop: '24px' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
